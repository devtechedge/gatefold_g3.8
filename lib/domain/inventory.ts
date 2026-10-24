import * as crypto from 'crypto';
import type { ReservationStatus, TicketStatus } from '../types';

export const HOLD_DURATION_SECONDS = 600; // 10 minutes
export const SIGNATURE_SECRET = process.env.GATEFOLD_TICKET_SECRET || 'gatefold_prod_signature_secret_key_v1';

export class DomainError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

/**
 * Validate that an inventory record satisfies the core invariant:
 * 0 <= held + sold <= capacity
 */
export function assertInventoryInvariant(inv: { capacity: number; held: number; sold: number }) {
  if (inv.held < 0) {
    throw new DomainError('INVARIANT_VIOLATION', `Held inventory cannot be negative: ${inv.held}`);
  }
  if (inv.sold < 0) {
    throw new DomainError('INVARIANT_VIOLATION', `Sold inventory cannot be negative: ${inv.sold}`);
  }
  if (inv.held + inv.sold > inv.capacity) {
    throw new DomainError(
      'INVARIANT_VIOLATION',
      `Total allocated tickets (${inv.held + inv.sold}) exceeds capacity (${inv.capacity})`
    );
  }
}

/**
 * Validates transition from current reservation state to target state
 */
export function validateReservationTransition(
  currentState: ReservationStatus,
  targetState: ReservationStatus,
  holdExpiresAt?: string | Date
): void {
  if (currentState === targetState) {
    return; // Idempotent no-op
  }

  if (currentState === 'CONFIRMED') {
    if (targetState === 'CANCELLED') {
      return; // Allowed under cancellation policy
    }
    throw new DomainError('INVALID_STATE', `Confirmed reservation cannot transition to ${targetState}`);
  }

  if (currentState === 'EXPIRED') {
    throw new DomainError('HOLD_EXPIRED', 'Expired hold cannot be confirmed or modified');
  }

  if (currentState === 'CANCELLED') {
    throw new DomainError('INVALID_STATE', 'Cancelled reservation cannot transition to any active state');
  }

  if (currentState === 'PENDING_HOLD') {
    if (targetState === 'CONFIRMED') {
      if (holdExpiresAt) {
        const expTime = new Date(holdExpiresAt).getTime();
        if (Date.now() > expTime) {
          throw new DomainError('HOLD_EXPIRED', 'The 10-minute inventory hold has expired');
        }
      }
      return;
    }
    if (targetState === 'EXPIRED' || targetState === 'CANCELLED') {
      return;
    }
  }

  throw new DomainError('INVALID_STATE', `Illegal reservation transition: ${currentState} -> ${targetState}`);
}

/**
 * Generate cryptographically signed QR code payload for a ticket
 */
export function signTicket(publicId: string): { qrPayload: string; signature: string } {
  const signature = crypto.createHmac('sha256', SIGNATURE_SECRET).update(publicId).digest('hex');
  const qrPayload = `GF:${publicId}:${signature}`;
  return { qrPayload, signature };
}

/**
 * Verify signed QR code payload
 */
export function verifyTicketSignature(qrPayload: string): { valid: boolean; publicId?: string } {
  const parts = qrPayload.trim().split(':');
  if (parts.length !== 3 || parts[0] !== 'GF') {
    return { valid: false };
  }
  const publicId = parts[1];
  const signature = parts[2];

  const expectedSig = crypto.createHmac('sha256', SIGNATURE_SECRET).update(publicId).digest('hex');
  const valid = crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSig, 'hex'));
  return { valid, publicId: valid ? publicId : undefined };
}

/**
 * Generate an unpredictable public ID for an issued ticket
 */
export function generateTicketPublicId(prefix: string = 'GF'): string {
  const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
  const checksum = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${prefix}-${randomPart}-${checksum}`;
}
