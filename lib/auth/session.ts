import { cookies } from 'next/headers';
import type { OrganizerRole, User } from '../types';

export const DEMO_USERS: Record<OrganizerRole, User> = {
  OWNER: {
    id: 'usr_owner',
    email: 'elena@gatefold-arts.org',
    name: 'Elena Rostova',
    role: 'OWNER',
    createdAt: '2026-01-15T00:00:00Z',
  },
  EVENT_MANAGER: {
    id: 'usr_manager',
    email: 'marcus@gatefold-arts.org',
    name: 'Marcus Thorne',
    role: 'EVENT_MANAGER',
    createdAt: '2026-02-01T00:00:00Z',
  },
  STAFF: {
    id: 'usr_staff',
    email: 'sofia@gatefold-arts.org',
    name: 'Sofia Alvarez',
    role: 'STAFF',
    createdAt: '2026-03-10T00:00:00Z',
  },
};

export async function getCurrentUser(): Promise<User> {
  const cookieStore = await cookies();
  const roleCookie = cookieStore.get('gatefold_role')?.value as OrganizerRole;
  if (roleCookie && DEMO_USERS[roleCookie]) {
    return DEMO_USERS[roleCookie];
  }
  return DEMO_USERS.OWNER;
}

export function canManageEvents(role: OrganizerRole): boolean {
  return role === 'OWNER' || role === 'EVENT_MANAGER';
}

export function canConfigureTickets(role: OrganizerRole): boolean {
  return role === 'OWNER' || role === 'EVENT_MANAGER';
}

export function canCheckIn(role: OrganizerRole): boolean {
  return role === 'OWNER' || role === 'EVENT_MANAGER' || role === 'STAFF';
}

export function canManageTeam(role: OrganizerRole): boolean {
  return role === 'OWNER';
}

export function canCancelEvents(role: OrganizerRole): boolean {
  return role === 'OWNER';
}
