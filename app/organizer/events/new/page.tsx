'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowLeft, Plus, Trash2, Calendar, ShieldCheck } from 'lucide-react';

export default function NewEventPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('CULTURE');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [doorsOpenTime, setDoorsOpenTime] = useState('18:00 CET');
  const [cancellationPolicy, setCancellationPolicy] = useState('Full refund up to 48 hours prior to start.');

  const [ticketTypes, setTicketTypes] = useState([
    { name: 'General Admission', description: 'Standard admission pass', priceInCents: 3500, capacity: 50, maxPerOrder: 4 },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addTicketType = () => {
    setTicketTypes((prev) => [
      ...prev,
      { name: 'Patron Pass', description: 'Reserved front section seating', priceInCents: 7500, capacity: 20, maxPerOrder: 2 },
    ]);
  };

  const removeTicketType = (index: number) => {
    if (ticketTypes.length <= 1) return;
    setTicketTypes((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTicketType = (index: number, field: string, val: any) => {
    setTicketTypes((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const startIso = startDate ? new Date(startDate).toISOString() : new Date(Date.now() + 86400000 * 10).toISOString();
      const endIso = endDate ? new Date(endDate).toISOString() : new Date(Date.now() + 86400000 * 11).toISOString();

      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          shortDescription,
          description,
          category,
          startDate: startIso,
          endDate: endIso,
          doorsOpenTime,
          cancellationPolicy,
          ticketTypes: ticketTypes.map((t) => ({
            name: t.name,
            description: t.description,
            priceInCents: Number(t.priceInCents),
            capacity: Number(t.capacity),
            maxPerOrder: Number(t.maxPerOrder),
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create event.');
      }

      router.push(`/events/${data.slug}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
        <div>
          <Link
            href="/organizer"
            className="text-xs font-mono text-stone-600 hover:text-stone-900 inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Organizer Console</span>
          </Link>
        </div>

        <div className="border-b border-stone-200 pb-4">
          <span className="text-2xs font-mono uppercase tracking-widest text-stone-400">Event Publishing</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 mt-1">
            Publish New Cultural Programme
          </h1>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Overview */}
          <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4 shadow-xs">
            <h2 className="text-base font-serif font-bold text-stone-900">Event Information</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-2xs font-mono uppercase text-stone-500 mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quadraphonic Chamber Installation"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-hidden focus:border-stone-500"
                />
              </div>

              <div>
                <label className="block text-2xs font-mono uppercase text-stone-500 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-hidden focus:border-stone-500 font-mono"
                >
                  <option value="CULTURE">Culture & Dialogues</option>
                  <option value="MUSIC">Acoustic Music</option>
                  <option value="WORKSHOP">Tactile Workshop</option>
                  <option value="EXHIBITION">Spatial Exhibition</option>
                  <option value="CONFERENCE">Symposium</option>
                </select>
              </div>

              <div>
                <label className="block text-2xs font-mono uppercase text-stone-500 mb-1">Doors Open Time</label>
                <input
                  type="text"
                  placeholder="e.g. 19:30 CET"
                  value={doorsOpenTime}
                  onChange={(e) => setDoorsOpenTime(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-hidden focus:border-stone-500"
                />
              </div>

              <div>
                <label className="block text-2xs font-mono uppercase text-stone-500 mb-1">Starts At</label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-hidden focus:border-stone-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-2xs font-mono uppercase text-stone-500 mb-1">Ends At</label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-hidden focus:border-stone-500 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-2xs font-mono uppercase text-stone-500 mb-1">Short Description</label>
                <input
                  type="text"
                  required
                  placeholder="One sentence summary for catalog cards"
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-hidden focus:border-stone-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-2xs font-mono uppercase text-stone-500 mb-1">Editorial Narrative & Details</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Full curatorial narrative, schedule breakdowns, and artist notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-xs text-stone-900 focus:bg-white focus:outline-hidden focus:border-stone-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Ticket Tiers & Capacities */}
          <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-serif font-bold text-stone-900">Ticket Inventory Tiers</h2>
                <p className="text-2xs text-stone-500 font-mono">
                  Invariant: 0 &lt;= held + sold &lt;= capacity strictly enforced
                </p>
              </div>
              <button
                type="button"
                onClick={addTicketType}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-2xs font-semibold rounded-md transition-colors inline-flex items-center gap-1 font-mono"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tier</span>
              </button>
            </div>

            <div className="space-y-4">
              {ticketTypes.map((tkt, idx) => (
                <div key={idx} className="p-4 bg-stone-50 rounded-lg border border-stone-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-mono font-bold text-stone-700 uppercase">
                      Tier #{idx + 1}
                    </span>
                    {ticketTypes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTicketType(idx)}
                        className="text-stone-400 hover:text-red-700 transition-colors p-1"
                        aria-label="Remove ticket tier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-2xs text-stone-500 mb-1">Tier Name</label>
                      <input
                        type="text"
                        required
                        value={tkt.name}
                        onChange={(e) => updateTicketType(idx, 'name', e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded px-2.5 py-1.5 text-xs text-stone-900"
                      />
                    </div>
                    <div>
                      <label className="block text-2xs text-stone-500 mb-1">Price (Cents)</label>
                      <input
                        type="number"
                        min="0"
                        required
                        value={tkt.priceInCents}
                        onChange={(e) => updateTicketType(idx, 'priceInCents', e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded px-2.5 py-1.5 text-xs text-stone-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-2xs text-stone-500 mb-1">Capacity</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={tkt.capacity}
                        onChange={(e) => updateTicketType(idx, 'capacity', e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded px-2.5 py-1.5 text-xs text-stone-900 font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Policies */}
          <div className="bg-white border border-stone-200 rounded-xl p-6 space-y-3 shadow-xs">
            <h2 className="text-base font-serif font-bold text-stone-900">Cancellation Policy</h2>
            <textarea
              rows={2}
              value={cancellationPolicy}
              onChange={(e) => setCancellationPolicy(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-md px-3 py-2 text-xs text-stone-900"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/organizer"
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
            >
              {loading ? 'Publishing Event...' : 'Publish Programme to Catalog'}
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
