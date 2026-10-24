'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, UserCheck } from 'lucide-react';
import type { OrganizerRole } from '@/lib/types';

export default function Navbar() {
  const pathname = usePathname();
  const [role, setRole] = useState<OrganizerRole>(() => {
    if (typeof document === 'undefined') return 'OWNER';
    const match = document.cookie.match(/gatefold_role=([^;]+)/);
    if (match && (match[1] === 'OWNER' || match[1] === 'EVENT_MANAGER' || match[1] === 'STAFF')) {
      return match[1] as OrganizerRole;
    }
    return 'OWNER';
  });
  const [switching, setSwitching] = useState(false);

  const handleRoleChange = async (newRole: OrganizerRole) => {
    setSwitching(true);
    try {
      await fetch('/api/auth/demo-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      setRole(newRole);
      window.location.reload();
    } catch {
      // Ignore
    } finally {
      setSwitching(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-stone-900 whitespace-nowrap shrink-0 hover:text-red-700 transition-colors flex items-center gap-2"
        >
          <span className="font-serif tracking-tighter text-2xl">GATEFOLD</span>
          <span className="text-xs uppercase tracking-widest text-stone-400 font-mono hidden sm:inline">OPS</span>
        </Link>

        {/* Zone 2: Single-line Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
          <Link
            href="/"
            className={`whitespace-nowrap shrink-0 hover:text-stone-900 transition-colors ${
              pathname === '/' ? 'text-stone-950 font-semibold' : ''
            }`}
          >
            Discovery
          </Link>
          <Link
            href="/events"
            className={`whitespace-nowrap shrink-0 hover:text-stone-900 transition-colors ${
              pathname.startsWith('/events') ? 'text-stone-950 font-semibold' : ''
            }`}
          >
            Programme
          </Link>
          <Link
            href="/organizer"
            className={`whitespace-nowrap shrink-0 hover:text-stone-900 transition-colors ${
              pathname.startsWith('/organizer') && !pathname.includes('/check-in')
                ? 'text-stone-950 font-semibold'
                : ''
            }`}
          >
            Organizer Console
          </Link>
          <Link
            href="/organizer/events/evt_symposium/check-in"
            className={`whitespace-nowrap shrink-0 hover:text-stone-900 transition-colors flex items-center gap-1.5 ${
              pathname.includes('/check-in') ? 'text-stone-950 font-semibold' : ''
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-red-600" />
            Scanner
          </Link>
        </nav>

        {/* Zone 3: 1 Primary Action (Persona Switcher) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 bg-stone-100 p-1 rounded-lg border border-stone-200/60 text-xs">
            <span className="text-stone-500 pl-1.5 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-stone-600" />
              <span className="hidden sm:inline">Role:</span>
            </span>
            <select
              aria-label="Select demo role persona"
              value={role}
              disabled={switching}
              onChange={(e) => handleRoleChange(e.target.value as OrganizerRole)}
              className="bg-white border-0 py-1 px-2 rounded font-medium text-stone-900 shadow-xs focus:ring-1 focus:ring-red-500 text-xs cursor-pointer"
            >
              <option value="OWNER">Elena (Owner)</option>
              <option value="EVENT_MANAGER">Marcus (Manager)</option>
              <option value="STAFF">Sofia (Staff)</option>
            </select>
          </div>
          <Link
            href="/organizer/events/new"
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-stone-900 hover:bg-red-700 transition-colors rounded-md shadow-xs whitespace-nowrap shrink-0 hidden sm:inline-block"
          >
            Publish Event
          </Link>
        </div>
      </div>
    </header>
  );
}
