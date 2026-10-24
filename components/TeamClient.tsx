'use client';

import React, { useState } from 'react';
import { Shield, UserCheck, Check, AlertCircle } from 'lucide-react';
import type { User, OrganizerRole } from '@/lib/types';

interface TeamClientProps {
  currentUser: User;
  teamMembers: User[];
}

export default function TeamClient({ currentUser, teamMembers }: TeamClientProps) {
  const [switching, setSwitching] = useState(false);

  const handleSwitch = async (role: OrganizerRole) => {
    setSwitching(true);
    try {
      await fetch('/api/auth/demo-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      window.location.reload();
    } catch {
      // Ignore
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-stone-200 pb-4">
        <span className="text-2xs font-mono uppercase tracking-widest text-stone-400">Team & Governance</span>
        <h1 className="text-2xl font-serif font-bold text-stone-900 mt-1">
          Authorized Staff & Role Scoping
        </h1>
        <p className="text-xs text-stone-600 mt-1">
          Gatefold enforces server-side role isolation. Gate staff may only verify passes, while event managers and owners configure inventory and publishing.
        </p>
      </div>

      {/* Demo Persona Switcher Banner */}
      <div className="bg-stone-900 text-white rounded-xl p-6 shadow-xs space-y-4">
        <div>
          <span className="text-2xs font-mono uppercase tracking-widest text-stone-400">Demo Persona Switcher</span>
          <h2 className="text-base font-serif font-bold text-stone-100 mt-1">
            Simulate Different Operational Roles
          </h2>
          <p className="text-xs text-stone-300 mt-0.5">
            Select an account below to test the platform as an Owner, Event Manager, or Gate Check-in Staff member:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <button
            type="button"
            disabled={switching}
            onClick={() => handleSwitch('OWNER')}
            className={`p-3.5 rounded-lg border text-left transition-all ${
              currentUser.role === 'OWNER'
                ? 'bg-stone-800 border-white/60 ring-1 ring-white/60'
                : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-stone-100">
              <span>Elena Rostova</span>
              {currentUser.role === 'OWNER' && <Check className="w-4 h-4 text-emerald-400" />}
            </div>
            <span className="text-2xs font-mono text-stone-400 block mt-1">OWNER (Full Admin)</span>
          </button>

          <button
            type="button"
            disabled={switching}
            onClick={() => handleSwitch('EVENT_MANAGER')}
            className={`p-3.5 rounded-lg border text-left transition-all ${
              currentUser.role === 'EVENT_MANAGER'
                ? 'bg-stone-800 border-white/60 ring-1 ring-white/60'
                : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-stone-100">
              <span>Marcus Thorne</span>
              {currentUser.role === 'EVENT_MANAGER' && <Check className="w-4 h-4 text-emerald-400" />}
            </div>
            <span className="text-2xs font-mono text-stone-400 block mt-1">EVENT_MANAGER</span>
          </button>

          <button
            type="button"
            disabled={switching}
            onClick={() => handleSwitch('STAFF')}
            className={`p-3.5 rounded-lg border text-left transition-all ${
              currentUser.role === 'STAFF'
                ? 'bg-stone-800 border-white/60 ring-1 ring-white/60'
                : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold text-stone-100">
              <span>Sofia Alvarez</span>
              {currentUser.role === 'STAFF' && <Check className="w-4 h-4 text-emerald-400" />}
            </div>
            <span className="text-2xs font-mono text-stone-400 block mt-1">STAFF (Scanner Only)</span>
          </button>
        </div>
      </div>

      {/* Permissions Matrix Card */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-xs space-y-4">
        <span className="text-2xs font-mono uppercase tracking-widest text-stone-400">Security Architecture</span>
        <h2 className="text-base font-serif font-bold text-stone-900">Role Permissions Matrix</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-stone-200 text-stone-400 text-2xs uppercase">
                <th className="py-2">Capability</th>
                <th className="py-2">Owner</th>
                <th className="py-2">Event Manager</th>
                <th className="py-2">Gate Staff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-2xs">
              <tr>
                <td className="py-2.5 font-sans font-medium text-stone-900">Gate Ticket Scanning</td>
                <td className="py-2.5 text-emerald-700 font-bold">YES</td>
                <td className="py-2.5 text-emerald-700 font-bold">YES</td>
                <td className="py-2.5 text-emerald-700 font-bold">YES</td>
              </tr>
              <tr>
                <td className="py-2.5 font-sans font-medium text-stone-900">Attendee Roster Inspection</td>
                <td className="py-2.5 text-emerald-700 font-bold">YES</td>
                <td className="py-2.5 text-emerald-700 font-bold">YES</td>
                <td className="py-2.5 text-stone-400">REDUCED</td>
              </tr>
              <tr>
                <td className="py-2.5 font-sans font-medium text-stone-900">Publish / Edit Events</td>
                <td className="py-2.5 text-emerald-700 font-bold">YES</td>
                <td className="py-2.5 text-emerald-700 font-bold">YES</td>
                <td className="py-2.5 text-red-700">NO</td>
              </tr>
              <tr>
                <td className="py-2.5 font-sans font-medium text-stone-900">Cancel Events & Release Holds</td>
                <td className="py-2.5 text-emerald-700 font-bold">YES</td>
                <td className="py-2.5 text-red-700">NO</td>
                <td className="py-2.5 text-red-700">NO</td>
              </tr>
              <tr>
                <td className="py-2.5 font-sans font-medium text-stone-900">Manage Team & Assign Roles</td>
                <td className="py-2.5 text-emerald-700 font-bold">YES</td>
                <td className="py-2.5 text-red-700">NO</td>
                <td className="py-2.5 text-red-700">NO</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
