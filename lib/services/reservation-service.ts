import * as crypto from 'crypto';
import { withTransaction, query } from '../db/database';
import {
  DomainError,
  assertInventoryInvariant,
  validateReservationTransition,
  signTicket,
  generateTicketPublicId,
  HOLD_DURATION_SECONDS,
} from '../domain/inventory';
import type { Reservation, ReservationLine, IssuedTicket } from '../types';

export interface CreateHoldRequest {
  eventId: string;
  buyerName: string;
  buyerEmail: string;
  buyerNotes?: string;
  lines: {
    ticketTypeId: string;
    occurrenceId: string;
    quantity: number;
  }[];
  idempotencyKey?: string;
}

export class ReservationService {
  /**
   * Transactionally create an inventory hold.
   * Uses atomic row locking and conditional update to guarantee inventory invariants.
   */
  static async createHold(input: CreateHoldRequest): Promise<Reservation> {
    if (!input.lines || input.lines.length === 0) {
      throw new DomainError('VALIDATION_ERROR', 'At least one ticket must be selected');
    }
    if (!input.buyerEmail || !input.buyerName) {
      throw new DomainError('VALIDATION_ERROR', 'Buyer name and email are required');
    }

    // Check idempotency if key provided
    if (input.idempotencyKey) {
      const existing = await query(
        `SELECT r.* FROM idempotency_records ir 
         JOIN reservations r ON r.idempotency_key = ir.scoped_key 
         WHERE ir.scoped_key = $1 AND ir.status = 'COMPLETED'`,
        [input.idempotencyKey]
      );
      if (existing.rows.length > 0) {
        return this.getReservationById(existing.rows[0].id) as Promise<Reservation>;
      }
    }

    return await withTransaction(async (tx) => {
      // 1. Fetch ticket types & check event status
      const eventRes = await tx.query(`SELECT status, cancellation_policy FROM events WHERE id = $1`, [input.eventId]);
      if (eventRes.rows.length === 0) {
        throw new DomainError('NOT_FOUND', 'Event not found');
      }
      if (eventRes.rows[0].status !== 'PUBLISHED') {
        throw new DomainError('CONFLICT', 'Reservations are only permitted for PUBLISHED events');
      }

      // 2. Fetch inventory rows and sort in consistent order to prevent deadlocks
      const ticketTypeIds = input.lines.map((l) => l.ticketTypeId);
      const invQuery = await tx.query(
        `SELECT ti.id, ti.ticket_type_id, ti.occurrence_id, ti.capacity, ti.held, ti.sold, tt.price_in_cents, tt.name as ticket_name, tt.max_per_order
         FROM ticket_inventory ti
         JOIN ticket_types tt ON tt.id = ti.ticket_type_id
         WHERE ti.ticket_type_id = ANY($1)
         ORDER BY ti.id ASC`,
        [ticketTypeIds]
      );

      const invMap = new Map<string, any>();
      for (const row of invQuery.rows) {
        invMap.set(row.ticket_type_id, row);
      }

      let totalAmountInCents = 0;
      const reservationId = 'res_' + crypto.randomBytes(8).toString('hex');
      const publicToken = 'tok_' + crypto.randomBytes(12).toString('hex');
      const holdExpiresAt = new Date(Date.now() + HOLD_DURATION_SECONDS * 1000).toISOString();

      // 3. Atomically reserve inventory with conditional update:
      // UPDATE ticket_inventory SET held = held + $1 WHERE id = $2 AND capacity - sold - held >= $1
      for (const line of input.lines) {
        if (line.quantity <= 0) {
          throw new DomainError('VALIDATION_ERROR', 'Ticket quantity must be greater than zero');
        }
        const inv = invMap.get(line.ticketTypeId);
        if (!inv) {
          throw new DomainError('NOT_FOUND', `Ticket inventory for type ${line.ticketTypeId} not found`);
        }
        if (line.quantity > inv.max_per_order) {
          throw new DomainError(
            'VALIDATION_ERROR',
            `Requested quantity (${line.quantity}) exceeds limit of ${inv.max_per_order} for ${inv.ticket_name}`
          );
        }

        const updateResult = await tx.query(
          `UPDATE ticket_inventory
           SET held = held + $1, version = version + 1
           WHERE id = $2 AND (capacity - sold - held) >= $1
           RETURNING *`,
          [line.quantity, inv.id]
        );

        if (updateResult.rows.length === 0) {
          throw new DomainError(
            'SOLD_OUT',
            `Insufficient tickets available for "${inv.ticket_name}". Another visitor may have reserved the remaining inventory.`
          );
        }

        assertInventoryInvariant(updateResult.rows[0]);
        totalAmountInCents += inv.price_in_cents * line.quantity;
      }

      // 4. Create reservation record
      await tx.query(
        `INSERT INTO reservations 
         (id, public_token, event_id, buyer_name, buyer_email, buyer_notes, status, hold_expires_at, total_amount_in_cents, currency, idempotency_key, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, 'PENDING_HOLD', $7, $8, 'USD', $9, CURRENT_TIMESTAMP)`,
        [
          reservationId,
          publicToken,
          input.eventId,
          input.buyerName.trim(),
          input.buyerEmail.trim().toLowerCase(),
          input.buyerNotes || null,
          holdExpiresAt,
          totalAmountInCents,
          input.idempotencyKey || null,
        ]
      );

      // 5. Insert reservation lines with snapshotted prices
      for (const line of input.lines) {
        const inv = invMap.get(line.ticketTypeId);
        const lineId = 'rline_' + crypto.randomBytes(8).toString('hex');
        await tx.query(
          `INSERT INTO reservation_lines (id, reservation_id, ticket_type_id, occurrence_id, quantity, price_per_unit_in_cents)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [lineId, reservationId, line.ticketTypeId, line.occurrenceId, line.quantity, inv.price_in_cents]
        );
      }

      // 6. Record idempotency if requested
      if (input.idempotencyKey) {
        await tx.query(
          `INSERT INTO idempotency_records (id, scoped_key, request_hash, status, response_json, created_at)
           VALUES ($1, $2, $3, 'COMPLETED', $4, CURRENT_TIMESTAMP)
           ON CONFLICT (scoped_key) DO NOTHING`,
          [
            'idmp_' + crypto.randomBytes(6).toString('hex'),
            input.idempotencyKey,
            crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex'),
            JSON.stringify({ reservationId, publicToken }),
          ]
        );
      }

      return {
        id: reservationId,
        publicToken,
        eventId: input.eventId,
        buyerName: input.buyerName,
        buyerEmail: input.buyerEmail,
        buyerNotes: input.buyerNotes,
        status: 'PENDING_HOLD',
        holdExpiresAt,
        totalAmountInCents,
        currency: 'USD',
        createdAt: new Date().toISOString(),
      };
    });
  }

  /**
   * Complete simulated demo checkout:
   * Moves held inventory to sold, validates unexpired hold, and issues authentic signed tickets.
   */
  static async completeDemoCheckout(
    reservationId: string,
    attendees?: { attendeeName: string; attendeeEmail: string }[]
  ): Promise<{ reservation: Reservation; tickets: IssuedTicket[] }> {
    return await withTransaction(async (tx) => {
      // 1. Lock reservation row
      const res = await tx.query(`SELECT * FROM reservations WHERE id = $1 FOR UPDATE`, [reservationId]);
      if (res.rows.length === 0) {
        throw new DomainError('NOT_FOUND', 'Reservation not found');
      }
      const reservation = res.rows[0];

      // Validate hold state and expiration
      validateReservationTransition(reservation.status, 'CONFIRMED', reservation.hold_expires_at);

      // If already confirmed, return existing tickets idempotently
      if (reservation.status === 'CONFIRMED') {
        const existingTickets = await tx.query(
          `SELECT it.*, tt.name as ticket_type_name 
           FROM issued_tickets it
           JOIN ticket_types tt ON tt.id = it.ticket_type_id
           WHERE it.reservation_id = $1`,
          [reservationId]
        );
        return {
          reservation: {
            ...reservation,
            status: 'CONFIRMED',
          },
          tickets: existingTickets.rows,
        };
      }

      // 2. Fetch reservation lines
      const lines = await tx.query(
        `SELECT rl.*, tt.name as ticket_name 
         FROM reservation_lines rl
         JOIN ticket_types tt ON tt.id = rl.ticket_type_id
         WHERE rl.reservation_id = $1`,
        [reservationId]
      );

      // 3. Transfer inventory from held -> sold
      for (const line of lines.rows) {
        const invUpdate = await tx.query(
          `UPDATE ticket_inventory
           SET held = GREATEST(0, held - $1), sold = sold + $1, version = version + 1
           WHERE ticket_type_id = $2 AND occurrence_id = $3
           RETURNING *`,
          [line.quantity, line.ticket_type_id, line.occurrence_id]
        );

        if (invUpdate.rows.length > 0) {
          assertInventoryInvariant(invUpdate.rows[0]);
        }
      }

      // 4. Update reservation status to CONFIRMED
      await tx.query(
        `UPDATE reservations 
         SET status = 'CONFIRMED', confirmed_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [reservationId]
      );

      // 5. Issue exactly 1 unique signed ticket per quantity
      const issuedTickets: IssuedTicket[] = [];
      let attendeeIndex = 0;

      for (const line of lines.rows) {
        for (let i = 0; i < line.quantity; i++) {
          const publicId = generateTicketPublicId('GF');
          const { qrPayload, signature } = signTicket(publicId);
          const ticketId = 'tkt_' + crypto.randomBytes(8).toString('hex');

          const attendee = attendees && attendees[attendeeIndex] ? attendees[attendeeIndex] : null;
          const attendeeName = attendee?.attendeeName?.trim() || `${reservation.buyer_name} (Guest ${i + 1})`;
          const attendeeEmail = attendee?.attendeeEmail?.trim() || reservation.buyer_email;

          await tx.query(
            `INSERT INTO issued_tickets
             (id, public_id, reservation_id, reservation_line_id, ticket_type_id, occurrence_id, attendee_name, attendee_email, status, qr_payload, signature, issued_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'VALID', $9, $10, CURRENT_TIMESTAMP)`,
            [
              ticketId,
              publicId,
              reservationId,
              line.id,
              line.ticket_type_id,
              line.occurrence_id,
              attendeeName,
              attendeeEmail,
              qrPayload,
              signature,
            ]
          );

          issuedTickets.push({
            id: ticketId,
            publicId,
            reservationId,
            reservationLineId: line.id,
            ticketTypeId: line.ticket_type_id,
            occurrenceId: line.occurrence_id,
            attendeeName,
            attendeeEmail,
            status: 'VALID',
            qrPayload,
            signature,
            issuedAt: new Date().toISOString(),
          });
          attendeeIndex++;
        }
      }

      // 6. Log audit event
      await tx.query(
        `INSERT INTO audit_events (id, organizer_id, actor_id, actor_email, action, target_type, target_id, metadata_json, created_at)
         VALUES ($1, 'org_gatefold', 'system', $2, 'DEMO_CHECKOUT_CONFIRMED', 'RESERVATION', $3, $4, CURRENT_TIMESTAMP)`,
        [
          'aud_' + crypto.randomBytes(6).toString('hex'),
          reservation.buyer_email,
          reservationId,
          JSON.stringify({ ticketsIssued: issuedTickets.length, totalCents: reservation.total_amount_in_cents }),
        ]
      );

      return {
        reservation: {
          ...reservation,
          status: 'CONFIRMED',
          confirmedAt: new Date().toISOString(),
        },
        tickets: issuedTickets,
      };
    });
  }

  /**
   * Safe opportunistic or scheduled hold expiration
   */
  static async expirePendingHolds(): Promise<{ expiredCount: number }> {
    const expiredRes = await query(
      `SELECT id FROM reservations 
       WHERE status = 'PENDING_HOLD' AND hold_expires_at <= CURRENT_TIMESTAMP`
    );

    let expiredCount = 0;
    for (const row of expiredRes.rows) {
      await withTransaction(async (tx) => {
        // Atomic compare-and-swap lock
        const locked = await tx.query(
          `UPDATE reservations 
           SET status = 'EXPIRED' 
           WHERE id = $1 AND status = 'PENDING_HOLD'
           RETURNING *`,
          [row.id]
        );

        if (locked.rows.length === 0) return; // Already claimed/expired by another worker

        // Fetch lines and release held inventory
        const lines = await tx.query(`SELECT * FROM reservation_lines WHERE reservation_id = $1`, [row.id]);
        for (const line of lines.rows) {
          await tx.query(
            `UPDATE ticket_inventory
             SET held = GREATEST(0, held - $1), version = version + 1
             WHERE ticket_type_id = $2 AND occurrence_id = $3`,
            [line.quantity, line.ticket_type_id, line.occurrence_id]
          );
        }
        expiredCount++;
      });
    }

    return { expiredCount };
  }

  /**
   * Cancel reservation with proper release of inventory
   */
  static async cancelReservation(reservationId: string, actorId: string = 'buyer'): Promise<Reservation> {
    return await withTransaction(async (tx) => {
      const res = await tx.query(`SELECT * FROM reservations WHERE id = $1 FOR UPDATE`, [reservationId]);
      if (res.rows.length === 0) {
        throw new DomainError('NOT_FOUND', 'Reservation not found');
      }
      const reservation = res.rows[0];

      if (reservation.status === 'CANCELLED') {
        return reservation;
      }

      const lines = await tx.query(`SELECT * FROM reservation_lines WHERE reservation_id = $1`, [reservationId]);

      if (reservation.status === 'PENDING_HOLD') {
        // Release held inventory
        for (const line of lines.rows) {
          await tx.query(
            `UPDATE ticket_inventory
             SET held = GREATEST(0, held - $1), version = version + 1
             WHERE ticket_type_id = $2 AND occurrence_id = $3`,
            [line.quantity, line.ticket_type_id, line.occurrence_id]
          );
        }
      } else if (reservation.status === 'CONFIRMED') {
        // Release sold inventory & void tickets
        for (const line of lines.rows) {
          await tx.query(
            `UPDATE ticket_inventory
             SET sold = GREATEST(0, sold - $1), version = version + 1
             WHERE ticket_type_id = $2 AND occurrence_id = $3`,
            [line.quantity, line.ticket_type_id, line.occurrence_id]
          );
        }
        await tx.query(
          `UPDATE issued_tickets SET status = 'CANCELLED', revoked_at = CURRENT_TIMESTAMP WHERE reservation_id = $1`,
          [reservationId]
        );
      }

      await tx.query(
        `UPDATE reservations SET status = 'CANCELLED', cancelled_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [reservationId]
      );

      await tx.query(
        `INSERT INTO audit_events (id, organizer_id, actor_id, actor_email, action, target_type, target_id, metadata_json, created_at)
         VALUES ($1, 'org_gatefold', $2, 'actor', 'RESERVATION_CANCELLED', 'RESERVATION', $3, '{}', CURRENT_TIMESTAMP)`,
        ['aud_' + crypto.randomBytes(6).toString('hex'), actorId, reservationId]
      );

      return {
        ...reservation,
        status: 'CANCELLED',
        cancelledAt: new Date().toISOString(),
      };
    });
  }

  static async getReservationById(reservationId: string): Promise<Reservation | null> {
    const res = await query(
      `SELECT r.*, e.title as event_title, e.slug as event_slug, e.start_date, e.doors_open_time, v.name as venue_name, v.city as venue_city
       FROM reservations r
       JOIN events e ON e.id = r.event_id
       LEFT JOIN venues v ON v.id = e.venue_id
       WHERE r.id = $1`,
      [reservationId]
    );

    if (res.rows.length === 0) return null;
    const r = res.rows[0];

    const lines = await query(
      `SELECT rl.*, tt.name as ticket_type_name 
       FROM reservation_lines rl
       JOIN ticket_types tt ON tt.id = rl.ticket_type_id
       WHERE rl.reservation_id = $1`,
      [reservationId]
    );

    const tickets = await query(
      `SELECT it.*, tt.name as ticket_type_name, ci.scanned_at, ci.scanned_by_staff_name
       FROM issued_tickets it
       JOIN ticket_types tt ON tt.id = it.ticket_type_id
       LEFT JOIN check_ins ci ON ci.ticket_id = it.id
       WHERE it.reservation_id = $1
       ORDER BY it.issued_at ASC`,
      [reservationId]
    );

    return {
      id: r.id,
      publicToken: r.public_token,
      eventId: r.event_id,
      buyerName: r.buyer_name,
      buyerEmail: r.buyer_email,
      buyerNotes: r.buyer_notes,
      status: r.status,
      holdExpiresAt: r.hold_expires_at,
      totalAmountInCents: r.total_amount_in_cents,
      currency: r.currency,
      idempotencyKey: r.idempotency_key,
      createdAt: r.created_at,
      confirmedAt: r.confirmed_at,
      cancelledAt: r.cancelled_at,
      event: {
        id: r.event_id,
        title: r.event_title,
        slug: r.event_slug,
        startDate: r.start_date,
        doorsOpenTime: r.doors_open_time,
        venue: {
          name: r.venue_name,
          city: r.venue_city,
        } as any,
      } as any,
      lines: lines.rows.map((l) => ({
        id: l.id,
        reservationId: l.reservation_id,
        ticketTypeId: l.ticket_type_id,
        occurrenceId: l.occurrence_id,
        quantity: l.quantity,
        pricePerUnitInCents: l.price_per_unit_in_cents,
        ticketTypeName: l.ticket_type_name,
      })),
      tickets: tickets.rows.map((t) => ({
        id: t.id,
        publicId: t.public_id,
        reservationId: t.reservation_id,
        reservationLineId: t.reservation_line_id,
        ticketTypeId: t.ticket_type_id,
        occurrenceId: t.occurrence_id,
        attendeeName: t.attendee_name,
        attendeeEmail: t.attendee_email,
        status: t.status,
        qrPayload: t.qr_payload,
        signature: t.signature,
        issuedAt: t.issued_at,
        checkIn: t.scanned_at
          ? {
              id: 'chk_' + t.id,
              ticketId: t.id,
              scannedAt: t.scanned_at,
              scannedByStaffId: '',
              scannedByStaffName: t.scanned_by_staff_name || 'Staff',
              gateOrDevice: t.gate_or_device || 'Main Gate',
            }
          : undefined,
      })),
    };
  }

  static async getReservationByPublicToken(publicToken: string): Promise<Reservation | null> {
    const res = await query(`SELECT id FROM reservations WHERE public_token = $1`, [publicToken]);
    if (res.rows.length === 0) return null;
    return this.getReservationById(res.rows[0].id);
  }
}
