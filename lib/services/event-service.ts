import * as crypto from 'crypto';
import { query, withTransaction } from '../db/database';
import { DomainError } from '../domain/inventory';
import type { Event, TicketTypeWithInventory, PublicationStatus } from '../types';

export interface EventFilterOptions {
  search?: string;
  category?: string;
  status?: PublicationStatus;
  limit?: number;
  offset?: number;
}

export class EventService {
  /**
   * Get public catalog of events with display-only availability calculations
   */
  static async getPublicEvents(filters: EventFilterOptions = {}): Promise<{ events: Event[]; total: number }> {
    const conditions: string[] = ["e.status = 'PUBLISHED'"];
    const params: any[] = [];
    let pIdx = 1;

    if (filters.category && filters.category !== 'ALL') {
      conditions.push(`e.category = $${pIdx++}`);
      params.push(filters.category);
    }

    if (filters.search && filters.search.trim() !== '') {
      conditions.push(`(e.title ILIKE $${pIdx} OR e.short_description ILIKE $${pIdx} OR v.city ILIKE $${pIdx})`);
      params.push(`%${filters.search.trim()}%`);
      pIdx++;
    }

    const whereClause = conditions.join(' AND ');
    const countRes = await query(
      `SELECT COUNT(*) as count 
       FROM events e 
       LEFT JOIN venues v ON v.id = e.venue_id 
       WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countRes.rows[0]?.count || '0', 10);

    const limit = filters.limit || 12;
    const offset = filters.offset || 0;

    const listRes = await query(
      `SELECT e.*, v.name as venue_name, v.city as venue_city, v.country as venue_country,
              COALESCE(SUM(ti.capacity), 0) as total_capacity,
              COALESCE(SUM(ti.sold), 0) as total_sold,
              COALESCE(SUM(ti.held), 0) as total_held,
              MIN(tt.price_in_cents) as min_price
       FROM events e
       LEFT JOIN venues v ON v.id = e.venue_id
       LEFT JOIN event_occurrences eo ON eo.event_id = e.id
       LEFT JOIN ticket_types tt ON tt.occurrence_id = eo.id
       LEFT JOIN ticket_inventory ti ON ti.ticket_type_id = tt.id
       WHERE ${whereClause}
       GROUP BY e.id, v.id
       ORDER BY e.start_date ASC
       LIMIT $${pIdx++} OFFSET $${pIdx++}`,
      [...params, limit, offset]
    );

    const events: Event[] = listRes.rows.map((row) => ({
      id: row.id,
      organizerId: row.organizer_id,
      venueId: row.venue_id,
      title: row.title,
      slug: row.slug,
      shortDescription: row.short_description,
      description: row.description,
      category: row.category,
      status: row.status,
      timezone: row.timezone,
      heroImage: row.hero_image,
      startDate: row.start_date,
      endDate: row.end_date,
      doorsOpenTime: row.doors_open_time,
      cancellationPolicy: row.cancellation_policy,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      venue: {
        id: row.venue_id,
        organizerId: row.organizer_id,
        name: row.venue_name || 'TBA',
        address: '',
        city: row.venue_city || 'Virtual',
        country: row.venue_country || '',
        timezone: row.timezone,
      },
    }));

    return { events, total };
  }

  /**
   * Get single event by slug with live ticket tier inventory and remaining capacity
   */
  static async getEventBySlug(slug: string): Promise<Event | null> {
    const eventRes = await query(
      `SELECT e.*, v.name as venue_name, v.address as venue_address, v.city as venue_city, v.country as venue_country, v.accessibility_notes
       FROM events e
       LEFT JOIN venues v ON v.id = e.venue_id
       WHERE e.slug = $1`,
      [slug]
    );

    if (eventRes.rows.length === 0) return null;
    const row = eventRes.rows[0];

    // Fetch occurrences and ticket types with live inventory
    const ticketsRes = await query(
      `SELECT tt.*, eo.starts_at, eo.ends_at,
              ti.id as inventory_id, ti.capacity, ti.held, ti.sold, ti.version
       FROM ticket_types tt
       JOIN event_occurrences eo ON eo.id = tt.occurrence_id
       LEFT JOIN ticket_inventory ti ON ti.ticket_type_id = tt.id
       WHERE tt.event_id = $1 AND tt.visibility = 'PUBLIC' AND tt.name NOT LIKE '%Expiring%' AND tt.name NOT LIKE '%Race test%'
       ORDER BY tt.price_in_cents ASC`,
      [row.id]
    );

    const ticketTypes: TicketTypeWithInventory[] = ticketsRes.rows.map((t) => {
      const capacity = t.capacity || 0;
      const held = t.held || 0;
      const sold = t.sold || 0;
      const remainingCapacity = Math.max(0, capacity - (sold + held));
      return {
        id: t.id,
        eventId: t.event_id,
        occurrenceId: t.occurrence_id,
        name: t.name,
        description: t.description,
        currency: t.currency,
        priceInCents: t.price_in_cents,
        salesStart: t.sales_start,
        salesEnd: t.sales_end,
        visibility: t.visibility,
        maxPerOrder: t.max_per_order,
        status: remainingCapacity <= 0 ? 'SOLD_OUT' : t.status,
        remainingCapacity,
        inventory: {
          id: t.inventory_id,
          occurrenceId: t.occurrence_id,
          ticketTypeId: t.id,
          capacity,
          held,
          sold,
          version: t.version,
        },
      };
    });

    return {
      id: row.id,
      organizerId: row.organizer_id,
      venueId: row.venue_id,
      title: row.title,
      slug: row.slug,
      shortDescription: row.short_description,
      description: row.description,
      category: row.category,
      status: row.status,
      timezone: row.timezone,
      heroImage: row.hero_image,
      startDate: row.start_date,
      endDate: row.end_date,
      doorsOpenTime: row.doors_open_time,
      cancellationPolicy: row.cancellation_policy,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      venue: {
        id: row.venue_id,
        organizerId: row.organizer_id,
        name: row.venue_name,
        address: row.venue_address,
        city: row.venue_city,
        country: row.venue_country,
        timezone: row.timezone,
        accessibilityNotes: row.accessibility_notes,
      },
      ticketTypes,
    };
  }

  /**
   * Organizer event management overview: totals, tickets sold, revenue, check-in rate
   */
  static async getOrganizerOverview() {
    const eventsRes = await query(`SELECT * FROM events ORDER BY created_at DESC`);
    const reservationsRes = await query(
      `SELECT r.*, e.title as event_title 
       FROM reservations r 
       JOIN events e ON e.id = r.event_id 
       ORDER BY r.created_at DESC 
       LIMIT 10`
    );
    const metricsRes = await query(`
      SELECT 
        (SELECT COUNT(*) FROM events) as total_events,
        (SELECT COUNT(*) FROM issued_tickets) as total_tickets_issued,
        (SELECT COUNT(*) FROM check_ins) as total_checked_in,
        (SELECT COALESCE(SUM(total_amount_in_cents), 0) FROM reservations WHERE status = 'CONFIRMED') as confirmed_volume_cents,
        (SELECT COUNT(*) FROM reservations WHERE status = 'PENDING_HOLD' AND hold_expires_at > CURRENT_TIMESTAMP) as active_holds_count
    `);

    const auditRes = await query(`SELECT * FROM audit_events ORDER BY created_at DESC LIMIT 8`);

    return {
      events: eventsRes.rows,
      recentReservations: reservationsRes.rows,
      metrics: metricsRes.rows[0],
      recentAudit: auditRes.rows,
    };
  }

  /**
   * Get attendees for an event with search & pagination
   */
  static async getAttendeesForEvent(eventId: string, search?: string) {
    let sql = `
      SELECT it.id, it.public_id, it.attendee_name, it.attendee_email, it.status as ticket_status, it.issued_at,
             tt.name as ticket_type_name, tt.price_in_cents,
             r.id as reservation_id, r.buyer_name, r.buyer_email, r.created_at as reserved_at,
             ci.scanned_at, ci.scanned_by_staff_name, ci.gate_or_device
      FROM issued_tickets it
      JOIN ticket_types tt ON tt.id = it.ticket_type_id
      JOIN reservations r ON r.id = it.reservation_id
      LEFT JOIN check_ins ci ON ci.ticket_id = it.id
      WHERE it.occurrence_id IN (SELECT id FROM event_occurrences WHERE event_id = $1)
    `;
    const params: any[] = [eventId];

    if (search && search.trim() !== '') {
      sql += ` AND (it.attendee_name ILIKE $2 OR it.attendee_email ILIKE $2 OR it.public_id ILIKE $2)`;
      params.push(`%${search.trim()}%`);
    }

    sql += ` ORDER BY it.issued_at DESC`;
    const res = await query(sql, params);
    return res.rows;
  }

  /**
   * Create or update event
   */
  static async createEvent(data: {
    title: string;
    slug?: string;
    shortDescription: string;
    description: string;
    category: string;
    venueId?: string;
    startDate: string;
    endDate: string;
    doorsOpenTime?: string;
    heroImage?: string;
    cancellationPolicy?: string;
    ticketTypes: {
      name: string;
      description: string;
      priceInCents: number;
      capacity: number;
      maxPerOrder?: number;
    }[];
  }) {
    const slug =
      data.slug ||
      data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') +
        '-' +
        crypto.randomBytes(2).toString('hex');

    return await withTransaction(async (tx) => {
      const eventId = 'evt_' + crypto.randomBytes(6).toString('hex');
      const venueId = data.venueId || 'ven_vault';

      await tx.query(
        `INSERT INTO events 
         (id, organizer_id, venue_id, title, slug, short_description, description, category, status, timezone, hero_image, start_date, end_date, doors_open_time, cancellation_policy, created_at, updated_at)
         VALUES ($1, 'org_gatefold', $2, $3, $4, $5, $6, $7, 'PUBLISHED', 'UTC', $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [
          eventId,
          venueId,
          data.title.trim(),
          slug,
          data.shortDescription.trim(),
          data.description.trim(),
          data.category || 'CULTURE',
          data.heroImage || '/images/hero_cultural_symposium_1792868294632.jpg',
          data.startDate,
          data.endDate,
          data.doorsOpenTime || '10:00 UTC',
          data.cancellationPolicy || 'Standard 48-hour simulated refund policy.',
        ]
      );

      // Create occurrence
      const occId = 'occ_' + crypto.randomBytes(6).toString('hex');
      await tx.query(
        `INSERT INTO event_occurrences (id, event_id, starts_at, ends_at, status)
         VALUES ($1, $2, $3, $4, 'SCHEDULED')`,
        [occId, eventId, data.startDate, data.endDate]
      );

      // Create ticket types and inventory
      for (const tkt of data.ticketTypes) {
        const tktId = 'tkt_' + crypto.randomBytes(6).toString('hex');
        const invId = 'inv_' + crypto.randomBytes(6).toString('hex');

        await tx.query(
          `INSERT INTO ticket_types 
           (id, event_id, occurrence_id, name, description, currency, price_in_cents, sales_start, sales_end, visibility, max_per_order, status)
           VALUES ($1, $2, $3, $4, $5, 'USD', $6, CURRENT_TIMESTAMP, $7, 'PUBLIC', $8, 'ACTIVE')`,
          [tktId, eventId, occId, tkt.name, tkt.description, tkt.priceInCents, data.endDate, tkt.maxPerOrder || 4]
        );

        await tx.query(
          `INSERT INTO ticket_inventory (id, occurrence_id, ticket_type_id, capacity, held, sold, version)
           VALUES ($1, $2, $3, $4, 0, 0, 1)`,
          [invId, occId, tktId, tkt.capacity]
        );
      }

      await tx.query(
        `INSERT INTO audit_events (id, organizer_id, actor_id, actor_email, action, target_type, target_id, metadata_json, created_at)
         VALUES ($1, 'org_gatefold', 'usr_owner', 'elena@gatefold-arts.org', 'EVENT_CREATED', 'EVENT', $2, $3, CURRENT_TIMESTAMP)`,
        ['aud_' + crypto.randomBytes(6).toString('hex'), eventId, JSON.stringify({ slug, title: data.title })]
      );

      return { eventId, slug };
    });
  }

  /**
   * Update event status (e.g. CANCEL, PUBLISH, DRAFT)
   */
  static async setEventStatus(eventId: string, newStatus: PublicationStatus, actorId: string = 'usr_owner') {
    return await withTransaction(async (tx) => {
      const eventRes = await tx.query(`SELECT * FROM events WHERE id = $1 FOR UPDATE`, [eventId]);
      if (eventRes.rows.length === 0) {
        throw new DomainError('NOT_FOUND', 'Event not found');
      }

      await tx.query(
        `UPDATE events SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [newStatus, eventId]
      );

      if (newStatus === 'CANCELLED') {
        // Safe cancellation policy: cancel active holds
        const holds = await tx.query(
          `SELECT id FROM reservations WHERE event_id = $1 AND status = 'PENDING_HOLD'`,
          [eventId]
        );
        for (const h of holds.rows) {
          const lines = await tx.query(`SELECT * FROM reservation_lines WHERE reservation_id = $1`, [h.id]);
          for (const l of lines.rows) {
            await tx.query(
              `UPDATE ticket_inventory SET held = GREATEST(0, held - $1), version = version + 1 WHERE ticket_type_id = $2`,
              [l.quantity, l.ticket_type_id]
            );
          }
          await tx.query(`UPDATE reservations SET status = 'CANCELLED', cancelled_at = CURRENT_TIMESTAMP WHERE id = $1`, [h.id]);
        }
      }

      await tx.query(
        `INSERT INTO audit_events (id, organizer_id, actor_id, actor_email, action, target_type, target_id, metadata_json, created_at)
         VALUES ($1, 'org_gatefold', $2, 'actor', 'EVENT_STATUS_CHANGED', 'EVENT', $3, $4, CURRENT_TIMESTAMP)`,
        ['aud_' + crypto.randomBytes(6).toString('hex'), actorId, eventId, JSON.stringify({ newStatus })]
      );

      return { success: true, status: newStatus };
    });
  }
}
