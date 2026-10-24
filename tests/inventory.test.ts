import test from 'node:test';
import assert from 'node:assert/strict';
import { getDb, withTransaction, closeDb } from '../lib/db/database';
import { ReservationService } from '../lib/services/reservation-service';
import { TicketService } from '../lib/services/ticket-service';
import { signTicket, verifyTicketSignature } from '../lib/domain/inventory';

test('GATEFOLD AUTHORITATIVE SUITE', async (t) => {
  // Ensure DB and migrations are ready
  await getDb();

  await t.test('1. Cryptographic ticket signing and tamper verification', () => {
    const publicId = 'GF-TEST-8819A';
    const { qrPayload, signature } = signTicket(publicId);

    assert.equal(qrPayload.startsWith('GF:GF-TEST-8819A:'), true);
    assert.equal(signature.length, 64);

    const verified = verifyTicketSignature(qrPayload);
    assert.equal(verified.valid, true);
    assert.equal(verified.publicId, publicId);

    // Tampered signature
    const tampered = qrPayload.slice(0, -4) + 'abcd';
    const tamperedCheck = verifyTicketSignature(tampered);
    assert.equal(tamperedCheck.valid, false);
  });

  await t.test('2. Atomic concurrency: 20 simultaneous reservation requests for scarce inventory', async () => {
    // We create a test ticket type linked to existing occ_litho_main with capacity = 1
    const testTktId = 'tkt_race_' + Date.now();
    const testOccId = 'occ_litho_main';
    const testInvId = 'inv_race_' + Date.now();

    await withTransaction(async (tx) => {
      await tx.query(
        `INSERT INTO ticket_types (id, event_id, occurrence_id, name, description, currency, price_in_cents, sales_start, sales_end, visibility, max_per_order, status)
         VALUES ($1, 'evt_lithography', $2, 'Single Final Ticket', 'Race test item', 'USD', 2000, NOW() - INTERVAL '1 day', NOW() + INTERVAL '1 day', 'PUBLIC', 1, 'ACTIVE')`,
        [testTktId, testOccId]
      );
      await tx.query(
        `INSERT INTO ticket_inventory (id, occurrence_id, ticket_type_id, capacity, held, sold, version)
         VALUES ($1, $2, $3, 1, 0, 0, 1)`,
        [testInvId, testOccId, testTktId]
      );
    });

    // Fire 20 simultaneous reservation attempts for this 1 ticket
    const promises = Array.from({ length: 20 }).map((_, i) =>
      ReservationService.createHold({
        eventId: 'evt_lithography',
        buyerName: `Competitor ${i}`,
        buyerEmail: `comp${i}@example.com`,
        lines: [{ ticketTypeId: testTktId, occurrenceId: testOccId, quantity: 1 }],
      })
        .then((res) => ({ success: true, error: '' as string, res }))
        .catch((err: any) => ({ success: false, error: String(err.code || err.message), res: null }))
    );

    const results = await Promise.all(promises);
    const successes = results.filter((r) => r.success);
    const failures = results.filter((r): r is { success: false; error: string; res: null } => !r.success);

    assert.equal(successes.length, 1, 'Exactly one concurrent request must win the ticket');
    assert.equal(failures.length, 19, 'All 19 other requests must be rejected with SOLD_OUT');
    assert.equal(failures[0].error, 'SOLD_OUT');

    // Confirm DB invariant: held = 1, sold = 0, held + sold <= capacity (1)
    const db = await getDb();
    const invRes = await db.query(`SELECT * FROM ticket_inventory WHERE id = $1`, [testInvId]);
    const inv = invRes.rows[0] as any;
    assert.equal(inv.held, 1);
    assert.equal(inv.sold, 0);
    assert.equal(inv.capacity, 1);
  });

  await t.test('3. Demo checkout transitions held to sold and issues exact ticket count', async () => {
    // Reserve 2 tickets for symposium
    const hold = await ReservationService.createHold({
      eventId: 'evt_symposium',
      buyerName: 'Dr. Arthur Pendelton',
      buyerEmail: 'arthur@sample.org',
      lines: [{ ticketTypeId: 'tkt_symp_stu', occurrenceId: 'occ_symp_main', quantity: 2 }],
    });

    assert.equal(hold.status, 'PENDING_HOLD');

    // Complete simulated checkout
    const checkoutResult = await ReservationService.completeDemoCheckout(hold.id, [
      { attendeeName: 'Dr. Arthur Pendelton', attendeeEmail: 'arthur@sample.org' },
      { attendeeName: 'Assistant Vera', attendeeEmail: 'vera@sample.org' },
    ]);

    assert.equal(checkoutResult.reservation.status, 'CONFIRMED');
    assert.equal(checkoutResult.tickets.length, 2);
    assert.equal(checkoutResult.tickets[0].status, 'VALID');
    assert.notEqual(checkoutResult.tickets[0].publicId, checkoutResult.tickets[1].publicId);

    // Double checkout on already confirmed reservation must be idempotent
    const repeat = await ReservationService.completeDemoCheckout(hold.id);
    assert.equal(repeat.tickets.length, 2);
    assert.equal(repeat.tickets[0].id, checkoutResult.tickets[0].id);
  });

  await t.test('4. Double check-in prevention: second scan returns ALREADY_USED', async () => {
    // Reserve & issue 1 ticket
    const hold = await ReservationService.createHold({
      eventId: 'evt_jazz',
      buyerName: 'Miles Parker',
      buyerEmail: 'miles@jazz.org',
      lines: [{ ticketTypeId: 'tkt_jazz_gen', occurrenceId: 'occ_jazz_main', quantity: 1 }],
    });

    const { tickets } = await ReservationService.completeDemoCheckout(hold.id);
    const ticket = tickets[0];

    const staffUser = { id: 'usr_staff', name: 'Sofia Alvarez', role: 'STAFF' };

    // First scan: must SUCCEED
    const scan1 = await TicketService.verifyAndCheckIn({
      qrPayloadOrCode: ticket.qrPayload,
      staffUser,
      gateOrDevice: 'Main West Door',
    });
    assert.equal(scan1.outcome, 'SUCCESS');
    assert.equal(scan1.ticket?.status, 'CHECKED_IN');

    // Second scan of same ticket: must return ALREADY_USED
    const scan2 = await TicketService.verifyAndCheckIn({
      qrPayloadOrCode: ticket.qrPayload,
      staffUser,
      gateOrDevice: 'Main West Door',
    });
    assert.equal(scan2.outcome, 'ALREADY_USED');
    assert.equal(scan2.message.includes('ALREADY_USED'), true);

    // Manual code lookup check-in attempt on same ticket: also ALREADY_USED
    const scan3 = await TicketService.verifyAndCheckIn({
      qrPayloadOrCode: ticket.publicId,
      staffUser,
    });
    assert.equal(scan3.outcome, 'ALREADY_USED');

    // Invalid signature test
    const fakeQr = `GF:${ticket.publicId}:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef`;
    const invalidScan = await TicketService.verifyAndCheckIn({
      qrPayloadOrCode: fakeQr,
      staffUser,
    });
    assert.equal(invalidScan.outcome, 'INVALID_SIGNATURE');

    // Unknown ticket test
    const unknownScan = await TicketService.verifyAndCheckIn({
      qrPayloadOrCode: 'GF-UNKNOWN-9999',
      staffUser,
    });
    assert.equal(unknownScan.outcome, 'NOT_FOUND');
  });

  await t.test('5. Safe hold expiration releases held inventory', async () => {
    const testTktId = 'tkt_exp_' + Date.now();
    const testOccId = 'occ_symp_main';
    const testInvId = 'inv_exp_' + Date.now();

    await withTransaction(async (tx) => {
      await tx.query(
        `INSERT INTO ticket_types (id, event_id, occurrence_id, name, description, currency, price_in_cents, sales_start, sales_end, visibility, max_per_order, status)
         VALUES ($1, 'evt_symposium', $2, 'Expiring Tier', 'Test', 'USD', 1000, NOW() - INTERVAL '1 day', NOW() + INTERVAL '1 day', 'PUBLIC', 4, 'ACTIVE')`,
        [testTktId, testOccId]
      );
      await tx.query(
        `INSERT INTO ticket_inventory (id, occurrence_id, ticket_type_id, capacity, held, sold, version)
         VALUES ($1, $2, $3, 5, 0, 0, 1)`,
        [testInvId, testOccId, testTktId]
      );
    });

    const hold = await ReservationService.createHold({
      eventId: 'evt_symposium',
      buyerName: 'Hold Expirer',
      buyerEmail: 'expirer@sample.com',
      lines: [{ ticketTypeId: testTktId, occurrenceId: testOccId, quantity: 3 }],
    });

    // Check held is 3
    const db = await getDb();
    let invRes = await db.query(`SELECT held FROM ticket_inventory WHERE id = $1`, [testInvId]);
    assert.equal((invRes.rows[0] as any).held, 3);

    // Artificially age the hold
    await db.query(`UPDATE reservations SET hold_expires_at = NOW() - INTERVAL '1 minute' WHERE id = $1`, [hold.id]);

    // Late checkout attempt must be rejected with HOLD_EXPIRED
    await assert.rejects(
      async () => {
        await ReservationService.completeDemoCheckout(hold.id);
      },
      (err: any) => err.code === 'HOLD_EXPIRED'
    );

    // Run expiration service
    const expResult = await ReservationService.expirePendingHolds();
    assert.equal(expResult.expiredCount >= 1, true);

    // Verify inventory released: held returned to 0
    invRes = await db.query(`SELECT held, sold FROM ticket_inventory WHERE id = $1`, [testInvId]);
    assert.equal((invRes.rows[0] as any).held, 0);
    assert.equal((invRes.rows[0] as any).sold, 0);
  });

  await closeDb();
});
