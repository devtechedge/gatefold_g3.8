import * as crypto from 'crypto';
import QRCode from 'qrcode';
import { withTransaction, query } from '../db/database';
import { verifyTicketSignature } from '../domain/inventory';
import type { IssuedTicket, CheckIn } from '../types';

export interface VerifyCheckInInput {
  qrPayloadOrCode: string;
  staffUser: {
    id: string;
    name: string;
    role: string;
  };
  gateOrDevice?: string;
  eventId?: string; // Optional filter to verify ticket is for this specific event
  notes?: string;
}

export type CheckInOutcome =
  | 'SUCCESS'
  | 'ALREADY_USED'
  | 'INVALID_SIGNATURE'
  | 'NOT_FOUND'
  | 'CANCELLED'
  | 'WRONG_EVENT'
  | 'UNAUTHORIZED';

export interface CheckInResult {
  outcome: CheckInOutcome;
  message: string;
  ticket?: IssuedTicket;
  checkIn?: CheckIn;
  previousCheckIn?: CheckIn;
}

export class TicketService {
  /**
   * Authoritatively verify and check-in a ticket.
   * Atomic database transaction guarantees no race conditions or duplicate check-ins.
   */
  static async verifyAndCheckIn(input: VerifyCheckInInput): Promise<CheckInResult> {
    const raw = input.qrPayloadOrCode.trim();

    let publicId: string;
    // Check if input is a full signed QR payload: GF:<publicId>:<hmac>
    if (raw.startsWith('GF:') && raw.split(':').length === 3) {
      const sigCheck = verifyTicketSignature(raw);
      if (!sigCheck.valid || !sigCheck.publicId) {
        return {
          outcome: 'INVALID_SIGNATURE',
          message: 'Cryptographic signature verification failed. Code is forged or corrupted.',
        };
      }
      publicId = sigCheck.publicId;
    } else {
      // Manual alphanumeric code entered by staff (e.g. GF-SYM-9481B)
      publicId = raw.toUpperCase();
    }

    return await withTransaction(async (tx) => {
      // 1. Lock ticket row FOR UPDATE
      const tktRes = await tx.query(
        `SELECT it.*, r.event_id, r.status as reservation_status, e.title as event_title, tt.name as ticket_type_name
         FROM issued_tickets it
         JOIN reservations r ON r.id = it.reservation_id
         JOIN events e ON e.id = r.event_id
         JOIN ticket_types tt ON tt.id = it.ticket_type_id
         WHERE it.public_id = $1
         FOR UPDATE OF it`,
        [publicId]
      );

      if (tktRes.rows.length === 0) {
        return {
          outcome: 'NOT_FOUND',
          message: `Ticket identifier "${publicId}" not found in authoritative records.`,
        };
      }

      const tkt = tktRes.rows[0];

      // 2. Validate event match if check-in is scoped to an event
      if (input.eventId && tkt.event_id !== input.eventId) {
        return {
          outcome: 'WRONG_EVENT',
          message: `Ticket is valid, but issued for another event: "${tkt.event_title}".`,
          ticket: {
            id: tkt.id,
            publicId: tkt.public_id,
            attendeeName: tkt.attendee_name,
            attendeeEmail: tkt.attendee_email,
            status: tkt.status,
          } as any,
        };
      }

      // 3. Check cancellation
      if (tkt.status === 'CANCELLED' || tkt.reservation_status === 'CANCELLED') {
        return {
          outcome: 'CANCELLED',
          message: 'Ticket has been cancelled and cannot be admitted.',
          ticket: {
            id: tkt.id,
            publicId: tkt.public_id,
            attendeeName: tkt.attendee_name,
            status: 'CANCELLED',
          } as any,
        };
      }

      // 4. Check already scanned
      if (tkt.status === 'CHECKED_IN') {
        const prevCheckInRes = await tx.query(`SELECT * FROM check_ins WHERE ticket_id = $1`, [tkt.id]);
        const prev = prevCheckInRes.rows[0];
        return {
          outcome: 'ALREADY_USED',
          message: `ALREADY_USED: Ticket was scanned on ${new Date(prev?.scanned_at || Date.now()).toLocaleTimeString()} by ${prev?.scanned_by_staff_name || 'Staff'}.`,
          ticket: {
            id: tkt.id,
            publicId: tkt.public_id,
            attendeeName: tkt.attendee_name,
            status: 'CHECKED_IN',
          } as any,
          previousCheckIn: prev
            ? {
                id: prev.id,
                ticketId: prev.ticket_id,
                scannedAt: prev.scanned_at,
                scannedByStaffId: prev.scanned_by_staff_id,
                scannedByStaffName: prev.scanned_by_staff_name,
                gateOrDevice: prev.gate_or_device,
                notes: prev.notes,
              }
            : undefined,
        };
      }

      // 5. Valid first scan: Mark checked in & create check-in record
      await tx.query(
        `UPDATE issued_tickets 
         SET status = 'CHECKED_IN' 
         WHERE id = $1`,
        [tkt.id]
      );

      const checkInId = 'chk_' + crypto.randomBytes(8).toString('hex');
      const nowIso = new Date().toISOString();
      await tx.query(
        `INSERT INTO check_ins 
         (id, ticket_id, scanned_at, scanned_by_staff_id, scanned_by_staff_name, gate_or_device, notes)
         VALUES ($1, $2, CURRENT_TIMESTAMP, $3, $4, $5, $6)`,
        [
          checkInId,
          tkt.id,
          input.staffUser.id,
          input.staffUser.name,
          input.gateOrDevice || 'Main Gate',
          input.notes || null,
        ]
      );

      // Audit event
      await tx.query(
        `INSERT INTO audit_events 
         (id, organizer_id, actor_id, actor_email, action, target_type, target_id, metadata_json, created_at)
         VALUES ($1, 'org_gatefold', $2, $3, 'TICKET_CHECKED_IN', 'TICKET', $4, $5, CURRENT_TIMESTAMP)`,
        [
          'aud_' + crypto.randomBytes(6).toString('hex'),
          input.staffUser.id,
          input.staffUser.name,
          tkt.id,
          JSON.stringify({ gate: input.gateOrDevice, publicId }),
        ]
      );

      return {
        outcome: 'SUCCESS',
        message: `Verified and admitted: ${tkt.attendee_name} (${tkt.ticket_type_name}).`,
        ticket: {
          id: tkt.id,
          publicId: tkt.public_id,
          reservationId: tkt.reservation_id,
          reservationLineId: tkt.reservation_line_id,
          ticketTypeId: tkt.ticket_type_id,
          occurrenceId: tkt.occurrence_id,
          attendeeName: tkt.attendee_name,
          attendeeEmail: tkt.attendee_email,
          status: 'CHECKED_IN',
          qrPayload: tkt.qr_payload,
          signature: tkt.signature,
          issuedAt: tkt.issued_at,
          ticketType: { name: tkt.ticket_type_name } as any,
          event: { title: tkt.event_title } as any,
        },
        checkIn: {
          id: checkInId,
          ticketId: tkt.id,
          scannedAt: nowIso,
          scannedByStaffId: input.staffUser.id,
          scannedByStaffName: input.staffUser.name,
          gateOrDevice: input.gateOrDevice || 'Main Gate',
          notes: input.notes,
        },
      };
    });
  }

  static async getTicketByPublicId(publicId: string): Promise<IssuedTicket | null> {
    const res = await query(
      `SELECT it.*, tt.name as ticket_type_name, tt.price_in_cents, e.id as event_id, e.title as event_title, e.slug as event_slug, e.start_date, e.doors_open_time, v.name as venue_name, v.city as venue_city, v.address as venue_address, ci.id as check_in_id, ci.scanned_at, ci.scanned_by_staff_name, ci.gate_or_device
       FROM issued_tickets it
       JOIN ticket_types tt ON tt.id = it.ticket_type_id
       JOIN reservations r ON r.id = it.reservation_id
       JOIN events e ON e.id = r.event_id
       LEFT JOIN venues v ON v.id = e.venue_id
       LEFT JOIN check_ins ci ON ci.ticket_id = it.id
       WHERE it.public_id = $1`,
      [publicId]
    );

    if (res.rows.length === 0) return null;
    const t = res.rows[0];

    return {
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
      ticketType: {
        id: t.ticket_type_id,
        name: t.ticket_type_name,
        priceInCents: t.price_in_cents,
      } as any,
      event: {
        id: t.event_id,
        title: t.event_title,
        slug: t.event_slug,
        startDate: t.start_date,
        doorsOpenTime: t.doors_open_time,
        venue: {
          name: t.venue_name,
          city: t.venue_city,
          address: t.venue_address,
        } as any,
      } as any,
      checkIn: t.check_in_id
        ? {
            id: t.check_in_id,
            ticketId: t.id,
            scannedAt: t.scanned_at,
            scannedByStaffId: '',
            scannedByStaffName: t.scanned_by_staff_name,
            gateOrDevice: t.gate_or_device,
          }
        : undefined,
    };
  }

  static async generateQrCodeDataUrl(payload: string): Promise<string> {
    return QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 280,
      color: {
        dark: '#0A0A0A',
        light: '#FFFFFF',
      },
    });
  }
}
