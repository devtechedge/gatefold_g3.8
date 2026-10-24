'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, Search } from 'lucide-react';
import type { Event } from '@/lib/types';

interface HomeEventGridProps {
  initialEvents: Event[];
}

const CATEGORIES = [
  { id: 'ALL', label: 'All Disciplines' },
  { id: 'CULTURE', label: 'Culture & Dialogues' },
  { id: 'MUSIC', label: 'Acoustic Music' },
  { id: 'WORKSHOP', label: 'Tactile Workshops' },
  { id: 'EXHIBITION', label: 'Exhibitions' },
];

export default function HomeEventGrid({ initialEvents }: HomeEventGridProps) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    return initialEvents.filter((evt) => {
      const matchesCat = selectedCategory === 'ALL' || evt.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === '' ||
        evt.title.toLowerCase().includes(q) ||
        evt.shortDescription.toLowerCase().includes(q) ||
        evt.venue?.city.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [initialEvents, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Category Tabs and Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search events, cities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-stone-200 pl-8 pr-3 py-1.5 text-xs rounded-md placeholder-stone-400 text-stone-900 focus:outline-hidden focus:border-stone-500"
          />
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-stone-200 p-8">
          <p className="text-sm font-medium text-stone-900">No events found matching your filter criteria</p>
          <p className="text-xs text-stone-500 mt-1">Try resetting the category or clearing the search query.</p>
          <button
            onClick={() => {
              setSelectedCategory('ALL');
              setSearchQuery('');
            }}
            className="mt-4 px-3 py-1.5 text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md font-medium transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((evt) => {
            const isScarce = evt.slug === 'woodblock-lithography-lab';
            const isSoldOut = evt.slug === 'sub-octave-frequency-pavilion';

            return (
              <article
                key={evt.id}
                className="group bg-white border border-stone-200/90 rounded-xl overflow-hidden hover:border-stone-400 hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Event Thumbnail with zero-broken-image fallback */}
                  <div className="relative aspect-4/3 w-full bg-stone-100 overflow-hidden">
                    {evt.heroImage ? (
                      <Image
                        src={evt.heroImage}
                        alt={evt.title}
                        fill
                        className="object-cover group-hover:scale-102 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-stone-200 text-stone-400 text-xs font-mono">
                        GATEFOLD ARCHIVE
                      </div>
                    )}

                    {/* Clean unboxed availability indicator */}
                    <div className="absolute top-3 right-3">
                      {isSoldOut ? (
                        <span className="bg-stone-900/90 backdrop-blur-xs text-white text-2xs px-2.5 py-1 rounded font-mono uppercase tracking-wider font-semibold">
                          Sold Out
                        </span>
                      ) : isScarce ? (
                        <span className="bg-red-700 text-white text-2xs px-2.5 py-1 rounded font-mono uppercase tracking-wider font-semibold animate-pulse">
                          Scarce · 2 Left
                        </span>
                      ) : (
                        <span className="bg-white/95 backdrop-blur-xs text-stone-900 text-2xs px-2.5 py-1 rounded font-mono uppercase tracking-wider font-semibold border border-stone-200">
                          Available
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    {/* Unboxed metadata with typographic separators */}
                    <div className="flex items-center gap-2 text-2xs font-mono uppercase tracking-wider text-stone-500 mb-2">
                      <span>{evt.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{evt.venue?.city || 'Virtual'}</span>
                    </div>

                    <h3 className="text-lg font-serif font-bold text-stone-900 leading-snug group-hover:text-red-700 transition-colors">
                      <Link href={`/events/${evt.slug}`}>
                        {evt.title}
                      </Link>
                    </h3>

                    <p className="mt-2 text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      {evt.shortDescription}
                    </p>
                  </div>
                </div>

                {/* Footer details */}
                <div className="px-5 pb-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-600">
                  <div className="flex items-center gap-1.5 font-mono text-2xs">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>{new Date(evt.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </div>

                  <Link
                    href={`/events/${evt.slug}`}
                    className="font-medium text-stone-900 hover:text-red-700 transition-colors inline-flex items-center gap-1"
                  >
                    <span>View & Reserve</span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
