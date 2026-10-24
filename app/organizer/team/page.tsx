import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { query } from '@/lib/db/database';
import { getCurrentUser } from '@/lib/auth/session';
import { ArrowLeft, Users, Shield, UserCheck } from 'lucide-react';
import TeamClient from '@/components/TeamClient';

export const dynamic = 'force-dynamic';

export default async function TeamPage() {
  const currentUser = await getCurrentUser();
  const usersRes = await query(`SELECT * FROM users ORDER BY created_at ASC`);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-6">
        <div>
          <Link
            href="/organizer"
            className="text-xs font-mono text-stone-600 hover:text-stone-900 inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Organizer Console</span>
          </Link>
        </div>

        <TeamClient
          currentUser={currentUser}
          teamMembers={usersRes.rows}
        />
      </main>

      <Footer />
    </div>
  );
}
