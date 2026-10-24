import type { PGlite } from '@electric-sql/pglite';
import * as crypto from 'crypto';

export async function seedDatabase(client: PGlite) {
  // 1. Users
  await client.query(`
    INSERT INTO users (id, email, name, role) VALUES
    ('usr_owner', 'elena@gatefold-arts.org', 'Elena Rostova (Director)', 'OWNER'),
    ('usr_manager', 'marcus@gatefold-arts.org', 'Marcus Thorne (Operations)', 'EVENT_MANAGER'),
    ('usr_staff', 'sofia@gatefold-arts.org', 'Sofia Alvarez (Gate Staff)', 'STAFF')
    ON CONFLICT (id) DO NOTHING;
  `);

  // 2. Venues
  await client.query(`
    INSERT INTO venues (id, organizer_id, name, address, city, country, timezone, accessibility_notes) VALUES
    ('ven_vault', 'org_gatefold', 'The Brutalist Vault & Atrium', '48 Obermauerstraße', 'Berlin', 'Germany', 'Europe/Berlin', 'Step-free level access via West colonnade. Induction loop active in main chamber.'),
    ('ven_chapel', 'org_gatefold', 'St. Jude Acoustic Chapel', '14 Cowgate Wynd', 'Edinburgh', 'United Kingdom', 'Europe/London', 'Historic cobblestone entry; portable ramp and accessible restroom in North nave.'),
    ('ven_atelier', 'org_gatefold', 'Kinetics Press & Atelier', '72 Witte de Withstraat', 'Rotterdam', 'Netherlands', 'Europe/Amsterdam', 'Ground floor studio access with 90cm wide doors throughout.')
    ON CONFLICT (id) DO NOTHING;
  `);

  // 3. Events
  await client.query(`
    INSERT INTO events (id, organizer_id, venue_id, title, slug, short_description, description, category, status, timezone, hero_image, start_date, end_date, doors_open_time, cancellation_policy) VALUES
    ('evt_symposium', 'org_gatefold', 'ven_vault', 'Symposium on Acoustic Space & Materiality', 'acoustic-space-symposium', 'A three-day international symposium interrogating tactile acoustics, heavy timber resonance, and architectural void design.', 'The inaugural Gatefold Symposium gathers international architectural acoustic engineers, psychoacousticians, and electroacoustic composers for three days of rigorous keynote dialogues, physical material tests, and spatial sound diffusion sessions in Berlin.
    
Participants will examine how porous surface treatments, tuned Helmholtz resonators, and mass-timber diaphragms alter spatial perception. Daily morning lectures are followed by afternoon acoustic prober workshops and evening quadraphonic listening performances.', 'CULTURE', 'PUBLISHED', 'Europe/Berlin', '/images/hero_cultural_symposium_1792868294632.jpg', NOW() + INTERVAL '14 days', NOW() + INTERVAL '16 days', '09:30 CET', 'Cancellations accepted with full refund up to 7 days before symposium start. Transfers permitted up to 24 hours prior.'),
    
    ('evt_jazz', 'org_gatefold', 'ven_chapel', 'Kinetics: Tri-City Avant Ensemble', 'kinetics-avant-ensemble', 'An unamplified double acoustic quintet performing graphic scores and microtonal improvisations.', 'An evening of unamplified microtonal polyphony inside the stone acoustics of St. Jude Chapel. Featuring premier brass, prepared piano, and upright acoustic bass improvisers from Glasgow, London, and Manchester.
    
Acoustic instruments only; strictly limited capacity to preserve spatial intimacy and acoustic fidelity.', 'MUSIC', 'PUBLISHED', 'Europe/London', '/images/event_avant_jazz_1792868295525.jpg', NOW() + INTERVAL '21 days', NOW() + INTERVAL '21 days', '19:15 GMT', 'Full refund until 48 hours prior to performance. No late entry once overture commences.'),

    ('evt_lithography', 'org_gatefold', 'ven_atelier', 'Monotype & Woodblock Lithography Lab', 'woodblock-lithography-lab', 'Intensive tactile printmaking workshop with scarce studio press inventory.', 'A tactile, intensive full-day masterclass on 19th-century cast-iron press printing, soy-based ink formulations, and Japanese kozo paper handling. Limited to 4 workstations for precision instruction.', 'WORKSHOP', 'PUBLISHED', 'Europe/Amsterdam', '/images/event_printmaking_workshop_1792868296295.jpg', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days', '10:00 CET', 'Workshop materials are prepared to order. Cancellations non-refundable within 72 hours of session.'),

    ('evt_frequency', 'org_gatefold', 'ven_vault', 'Sub-Octave Frequency Pavilion', 'sub-octave-frequency-pavilion', 'Infrasound and physical tactile resonance exhibition exploring wave propagation through concrete.', 'A sensory spatial exhibition examining human perception of sound below 20Hz through tuned seismic transducers mounted to reinforced concrete floor slabs.', 'EXHIBITION', 'PUBLISHED', 'Europe/Berlin', '/images/event_digital_art_summit_1792868296070.jpg', NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days', '14:00 CET', 'Timed ticket reservations strictly enforced.'),

    ('evt_cancelled', 'org_gatefold', 'ven_vault', 'Winter Microtonal Chamber Series', 'winter-microtonal-chamber', 'Cancelled winter chamber series postponed due to historical ceiling conservation works.', 'Postponed due to structural maintenance at the host venue. All previously confirmed ticket holders have been automatically refunded in simulated records.', 'MUSIC', 'CANCELLED', 'Europe/Berlin', '/images/event_avant_jazz_1792868295525.jpg', NOW() + INTERVAL '30 days', NOW() + INTERVAL '30 days', '19:00 CET', 'Event cancelled by organizer. Full simulated refunds issued.'),

    ('evt_draft', 'org_gatefold', 'ven_atelier', 'Emerging Graphic Scores Showcase', 'emerging-graphic-scores-showcase', 'Unpublished draft salon exploring visual notation.', 'Draft event under curation. Ticket tiers and schedules pending artistic committee approval.', 'CULTURE', 'DRAFT', 'Europe/Berlin', '/images/event_printmaking_workshop_1792868296295.jpg', NOW() + INTERVAL '45 days', NOW() + INTERVAL '45 days', '18:00 CET', 'Draft policy.')
    ON CONFLICT (id) DO NOTHING;
  `);

  // 4. Occurrences
  await client.query(`
    INSERT INTO event_occurrences (id, event_id, starts_at, ends_at, status) VALUES
    ('occ_symp_main', 'evt_symposium', NOW() + INTERVAL '14 days', NOW() + INTERVAL '16 days', 'SCHEDULED'),
    ('occ_jazz_main', 'evt_jazz', NOW() + INTERVAL '21 days', NOW() + INTERVAL '21 days', 'SCHEDULED'),
    ('occ_litho_main', 'evt_lithography', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days', 'SCHEDULED'),
    ('occ_freq_main', 'evt_frequency', NOW() + INTERVAL '5 days', NOW() + INTERVAL '5 days', 'SCHEDULED'),
    ('occ_canc_main', 'evt_cancelled', NOW() + INTERVAL '30 days', NOW() + INTERVAL '30 days', 'CANCELLED'),
    ('occ_draft_main', 'evt_draft', NOW() + INTERVAL '45 days', NOW() + INTERVAL '45 days', 'SCHEDULED')
    ON CONFLICT (id) DO NOTHING;
  `);

  // 5. Ticket Types
  await client.query(`
    INSERT INTO ticket_types (id, event_id, occurrence_id, name, description, currency, price_in_cents, sales_start, sales_end, visibility, max_per_order, status) VALUES
    ('tkt_symp_gen', 'evt_symposium', 'occ_symp_main', 'General Admission', 'Full access to all keynote sessions and exhibition hall for three days.', 'USD', 4800, NOW() - INTERVAL '30 days', NOW() + INTERVAL '13 days', 'PUBLIC', 4, 'ACTIVE'),
    ('tkt_symp_stu', 'evt_symposium', 'occ_symp_main', 'Student / Researcher Pass', 'Subsidized admission for active students and academic researchers.', 'USD', 2200, NOW() - INTERVAL '30 days', NOW() + INTERVAL '13 days', 'PUBLIC', 2, 'ACTIVE'),
    ('tkt_symp_pat', 'evt_symposium', 'occ_symp_main', 'Patron Full Pass', 'Includes reserved front-quadrant seating and invitation to opening reception.', 'USD', 12000, NOW() - INTERVAL '30 days', NOW() + INTERVAL '13 days', 'PUBLIC', 4, 'ACTIVE'),
    
    ('tkt_jazz_gen', 'evt_jazz', 'occ_jazz_main', 'General Entry', 'Numbered chapel bench seating with unhindered acoustic sightlines.', 'USD', 3400, NOW() - INTERVAL '20 days', NOW() + INTERVAL '20 days', 'PUBLIC', 4, 'ACTIVE'),
    ('tkt_jazz_sup', 'evt_jazz', 'occ_jazz_main', 'Supporting Patron', 'Front two stone rows plus commemorative program print.', 'USD', 6500, NOW() - INTERVAL '20 days', NOW() + INTERVAL '20 days', 'PUBLIC', 2, 'ACTIVE'),

    ('tkt_litho_scarce', 'evt_lithography', 'occ_litho_main', 'Intensive Workstation (Scarce)', 'Single dedicated press workstation, brayers, and archival paper stock.', 'USD', 14500, NOW() - INTERVAL '10 days', NOW() + INTERVAL '6 days', 'PUBLIC', 2, 'ACTIVE'),

    ('tkt_freq_sold', 'evt_frequency', 'occ_freq_main', 'Timed Entry', 'Timed gallery session with acoustic prober transducer pack.', 'USD', 1800, NOW() - INTERVAL '15 days', NOW() + INTERVAL '4 days', 'PUBLIC', 4, 'SOLD_OUT')
    ON CONFLICT (id) DO NOTHING;
  `);

  // 6. Ticket Inventory (Crucial: chk_capacity constraint held + sold <= capacity)
  // Lithography has capacity=4, sold=2, held=0 -> exactly 2 remaining tickets! Ideal for testing the 20-thread race condition!
  await client.query(`
    INSERT INTO ticket_inventory (id, occurrence_id, ticket_type_id, capacity, held, sold, version) VALUES
    ('inv_symp_gen', 'occ_symp_main', 'tkt_symp_gen', 250, 0, 42, 1),
    ('inv_symp_stu', 'occ_symp_main', 'tkt_symp_stu', 50, 0, 18, 1),
    ('inv_symp_pat', 'occ_symp_main', 'tkt_symp_pat', 30, 0, 8, 1),
    ('inv_jazz_gen', 'occ_jazz_main', 'tkt_jazz_gen', 90, 0, 24, 1),
    ('inv_jazz_sup', 'occ_jazz_main', 'tkt_jazz_sup', 20, 0, 12, 1),
    ('inv_litho_scarce', 'occ_litho_main', 'tkt_litho_scarce', 4, 0, 2, 1),
    ('inv_freq_sold', 'occ_freq_main', 'tkt_freq_sold', 60, 0, 60, 1)
    ON CONFLICT (id) DO NOTHING;
  `);

  // 7. Seed sample confirmed reservation and tickets with signed QR codes
  const sampleResId = 'res_seed_001';
  const samplePublicToken = 'tok_seed_7f8a9b0c1d2e';
  await client.query(`
    INSERT INTO reservations (id, public_token, event_id, buyer_name, buyer_email, buyer_notes, status, hold_expires_at, total_amount_in_cents, currency, created_at, confirmed_at)
    VALUES ('${sampleResId}', '${samplePublicToken}', 'evt_symposium', 'Dr. Julian Vane', 'julian.vane@arch-acoustics.ac.uk', 'Requires acoustic sensor loaner', 'CONFIRMED', NOW() + INTERVAL '10 minutes', 9600, 'USD', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days')
    ON CONFLICT (id) DO NOTHING;
  `);

  await client.query(`
    INSERT INTO reservation_lines (id, reservation_id, ticket_type_id, occurrence_id, quantity, price_per_unit_in_cents)
    VALUES ('rline_seed_001', '${sampleResId}', 'tkt_symp_gen', 'occ_symp_main', 2, 4800)
    ON CONFLICT (id) DO NOTHING;
  `);

  // Two issued tickets: one already checked in, one valid and unverified
  const secretKey = 'gatefold_prod_signature_secret_key';
  const tkt1PubId = 'GF-SYM-9481A';
  const tkt2PubId = 'GF-SYM-9481B';
  const sig1 = crypto.createHmac('sha256', secretKey).update(tkt1PubId).digest('hex');
  const sig2 = crypto.createHmac('sha256', secretKey).update(tkt2PubId).digest('hex');

  await client.query(`
    INSERT INTO issued_tickets (id, public_id, reservation_id, reservation_line_id, ticket_type_id, occurrence_id, attendee_name, attendee_email, status, qr_payload, signature, issued_at)
    VALUES 
    ('tkt_seed_001', '${tkt1PubId}', '${sampleResId}', 'rline_seed_001', 'tkt_symp_gen', 'occ_symp_main', 'Dr. Julian Vane', 'julian.vane@arch-acoustics.ac.uk', 'CHECKED_IN', 'GF:${tkt1PubId}:${sig1}', '${sig1}', NOW() - INTERVAL '2 days'),
    ('tkt_seed_002', '${tkt2PubId}', '${sampleResId}', 'rline_seed_001', 'tkt_symp_gen', 'occ_symp_main', 'Claire Montrose', 'claire.m@arch-acoustics.ac.uk', 'VALID', 'GF:${tkt2PubId}:${sig2}', '${sig2}', NOW() - INTERVAL '2 days')
    ON CONFLICT (id) DO NOTHING;
  `);

  // First ticket check-in record
  await client.query(`
    INSERT INTO check_ins (id, ticket_id, scanned_at, scanned_by_staff_id, scanned_by_staff_name, gate_or_device, notes)
    VALUES ('chk_seed_001', 'tkt_seed_001', NOW() - INTERVAL '1 hour', 'usr_staff', 'Sofia Alvarez (Gate Staff)', 'North Colonnade Reader 1', 'VIP badge issued')
    ON CONFLICT (id) DO NOTHING;
  `);

  // 8. Seed sample audit logs
  await client.query(`
    INSERT INTO audit_events (id, organizer_id, actor_id, actor_email, action, target_type, target_id, metadata_json, created_at)
    VALUES
    ('aud_001', 'org_gatefold', 'usr_owner', 'elena@gatefold-arts.org', 'EVENT_PUBLISHED', 'EVENT', 'evt_symposium', '{"status": "PUBLISHED", "initial_capacity": 330}', NOW() - INTERVAL '30 days'),
    ('aud_002', 'org_gatefold', 'usr_manager', 'marcus@gatefold-arts.org', 'INVENTORY_RECONFIGURED', 'TICKET_TYPE', 'tkt_litho_scarce', '{"action": "capacity_restricted", "new_capacity": 4}', NOW() - INTERVAL '10 days'),
    ('aud_003', 'org_gatefold', 'usr_staff', 'sofia@gatefold-arts.org', 'TICKET_CHECKED_IN', 'TICKET', 'tkt_seed_001', '{"gate": "North Colonnade Reader 1"}', NOW() - INTERVAL '1 hour')
    ON CONFLICT (id) DO NOTHING;
  `);
}
