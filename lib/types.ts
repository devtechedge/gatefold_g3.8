export type PublicationStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
export type ReservationStatus = 'PENDING_HOLD' | 'CONFIRMED' | 'EXPIRED' | 'CANCELLED';
export type TicketStatus = 'VALID' | 'CHECKED_IN' | 'CANCELLED' | 'VOID';
export type OrganizerRole = 'OWNER' | 'EVENT_MANAGER' | 'STAFF';

export interface User {
  id: string;
  email: string;
  name: string;
  role: OrganizerRole;
  createdAt: string;
}

export interface Venue {
  id: string;
  organizerId: string;
  name: string;
  address: string;
  city: string;
  country: string;
  timezone: string;
  accessibilityNotes?: string;
}

export interface Event {
  id: string;
  organizerId: string;
  venueId: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: 'CULTURE' | 'MUSIC' | 'WORKSHOP' | 'EXHIBITION' | 'CONFERENCE';
  status: PublicationStatus;
  timezone: string;
  heroImage: string;
  startDate: string;
  endDate: string;
  doorsOpenTime?: string;
  cancellationPolicy: string;
  createdAt: string;
  updatedAt: string;
  venue?: Venue;
  ticketTypes?: TicketTypeWithInventory[];
}

export interface EventOccurrence {
  id: string;
  eventId: string;
  startsAt: string;
  endsAt: string;
  venueOverrideId?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
}

export interface TicketType {
  id: string;
  eventId: string;
  occurrenceId: string;
  name: string;
  description: string;
  currency: string;
  priceInCents: number;
  salesStart: string;
  salesEnd: string;
  visibility: 'PUBLIC' | 'HIDDEN';
  maxPerOrder: number;
  status: 'ACTIVE' | 'PAUSED' | 'SOLD_OUT';
}

export interface TicketInventory {
  id: string;
  occurrenceId: string;
  ticketTypeId: string;
  capacity: number;
  held: number;
  sold: number;
  version: number;
}

export interface TicketTypeWithInventory extends TicketType {
  inventory: TicketInventory;
  remainingCapacity: number;
}

export interface ReservationLine {
  id: string;
  reservationId: string;
  ticketTypeId: string;
  occurrenceId: string;
  quantity: number;
  pricePerUnitInCents: number;
  ticketTypeName?: string;
}

export interface Reservation {
  id: string;
  publicToken: string;
  eventId: string;
  buyerName: string;
  buyerEmail: string;
  buyerNotes?: string;
  status: ReservationStatus;
  holdExpiresAt: string;
  totalAmountInCents: number;
  currency: string;
  idempotencyKey?: string;
  createdAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  event?: Event;
  lines?: ReservationLine[];
  tickets?: IssuedTicket[];
}

export interface IssuedTicket {
  id: string;
  publicId: string;
  reservationId: string;
  reservationLineId: string;
  ticketTypeId: string;
  occurrenceId: string;
  attendeeName: string;
  attendeeEmail: string;
  status: TicketStatus;
  qrPayload: string;
  signature: string;
  issuedAt: string;
  revokedAt?: string;
  checkIn?: CheckIn;
  ticketType?: TicketType;
  event?: Event;
}

export interface CheckIn {
  id: string;
  ticketId: string;
  scannedAt: string;
  scannedByStaffId: string;
  scannedByStaffName: string;
  gateOrDevice: string;
  notes?: string;
}

export interface AuditEvent {
  id: string;
  organizerId: string;
  actorId: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  metadataJson: string;
  createdAt: string;
}
