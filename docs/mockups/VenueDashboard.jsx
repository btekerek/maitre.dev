/**
 * VenueDashboard.jsx
 * Screen 1 – Venue Dashboard
 *
 * Self-contained mockup component.
 * Requires: react, tailwindcss (CDN or build), lucide-react
 *
 * Usage:
 *   import VenueDashboard from './VenueDashboard';
 *   <VenueDashboard />
 */

import React, { useState } from "react";
import {
  LayoutGrid,
  CalendarDays,
  PlusCircle,
  MapPin,
  Table2,
  Users,
  ChevronRight,
  LogOut,
  Settings,
  Bell,
  Search,
  Utensils,
  Trash2,
  Edit3,
} from "lucide-react";

// ─── Dummy data ──────────────────────────────────────────────────────────────
const CURRENT_USER = { name: "Alex Morgan", email: "alex@maitre.dev" };

const VENUES = [
  {
    id: 1,
    name: "La Petit Bistro",
    address: "14 Rue de Rivoli, Paris",
    tableCount: 18,
    upcomingReservations: 7,
    todayCovers: 42,
    status: "active",
  },
  {
    id: 2,
    name: "The Grand Hall",
    address: "5 Victoria Embankment, London",
    tableCount: 34,
    upcomingReservations: 12,
    todayCovers: 89,
    status: "active",
  },
  {
    id: 3,
    name: "Rooftop Terrace",
    address: "88 Andrássy út, Budapest",
    tableCount: 11,
    upcomingReservations: 3,
    todayCovers: 18,
    status: "active",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────
function Avatar({ name }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold select-none">
      {initials}
    </div>
  );
}

function StatBadge({ icon: Icon, value, label, color }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`p-1.5 rounded-md ${color}`}>
        <Icon className="h-3.5 w-3.5 text-white" />
      </div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-100">{value}</p>
      </div>
    </div>
  );
}

function VenueCard({ venue, onEdit, onDelete }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex flex-col gap-4 hover:border-indigo-500 transition-colors group">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
            <Utensils className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors">
              {venue.name}
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <MapPin className="h-3 w-3" />
              {venue.address}
            </p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(venue)}
            className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(venue)}
            className="p-1.5 rounded-lg hover:bg-red-900/40 text-slate-400 hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 border-t border-slate-700 pt-4">
        <StatBadge
          icon={Table2}
          value={venue.tableCount}
          label="Tables"
          color="bg-indigo-600"
        />
        <StatBadge
          icon={CalendarDays}
          value={venue.upcomingReservations}
          label="Upcoming"
          color="bg-amber-500"
        />
        <StatBadge
          icon={Users}
          value={venue.todayCovers}
          label="Today's Covers"
          color="bg-emerald-500"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-auto">
        <a
          href={`/venues/${venue.id}/canvas`}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium hover:bg-indigo-600/40 transition-colors"
        >
          <LayoutGrid className="h-4 w-4" />
          Canvas Editor
        </a>
        <a
          href={`/venues/${venue.id}/reservations`}
          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 text-sm font-medium hover:bg-emerald-600/40 transition-colors"
        >
          <CalendarDays className="h-4 w-4" />
          Live Seating
        </a>
      </div>
    </div>
  );
}

function NewVenueModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Create New Venue
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Venue Name
            </label>
            <input
              type="text"
              placeholder="e.g. La Petite Bistro"
              className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-2.5 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Address
            </label>
            <input
              type="text"
              placeholder="Street, City, Country"
              className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-2.5 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Description (optional)
            </label>
            <textarea
              rows={3}
              placeholder="A short description of your venue…"
              className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-2.5 text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors"
          >
            Create Venue
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function VenueDashboard() {
  const [showNewVenueModal, setShowNewVenueModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredVenues = VENUES.filter((v) =>
    v.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalTables = VENUES.reduce((s, v) => s + v.tableCount, 0);
  const totalUpcoming = VENUES.reduce(
    (s, v) => s + v.upcomingReservations,
    0
  );
  const totalCovers = VENUES.reduce((s, v) => s + v.todayCovers, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* ── Navbar ── */}
      <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Utensils className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">maitre.dev</span>
          </div>
          <div className="hidden md:flex items-center gap-1 bg-slate-800 rounded-xl px-3 py-1.5 w-64">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Search venues…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none w-full ml-2"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-indigo-500 rounded-full" />
            </button>
            <button className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors">
              <Settings className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-slate-700">
              <Avatar name={CURRENT_USER.name} />
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-slate-200 leading-none">
                  {CURRENT_USER.name}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {CURRENT_USER.email}
                </p>
              </div>
              <button className="ml-1 p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-red-400 transition-colors">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Page content ── */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Header row */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">
              My Venues
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage your floorplans and reservations
            </p>
          </div>
          <button
            onClick={() => setShowNewVenueModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/30"
          >
            <PlusCircle className="h-4 w-4" />
            New Venue
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            {
              label: "Total Venues",
              value: VENUES.length,
              icon: Utensils,
              color: "text-indigo-400",
              bg: "bg-indigo-600/10 border-indigo-500/20",
            },
            {
              label: "Total Tables",
              value: totalTables,
              icon: Table2,
              color: "text-amber-400",
              bg: "bg-amber-500/10 border-amber-500/20",
            },
            {
              label: "Today's Covers",
              value: totalCovers,
              icon: Users,
              color: "text-emerald-400",
              bg: "bg-emerald-600/10 border-emerald-500/20",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={`flex items-center gap-4 p-4 rounded-2xl border ${s.bg}`}
            >
              <s.icon className={`h-8 w-8 ${s.color}`} />
              <div>
                <p className="text-2xl font-bold text-slate-100">{s.value}</p>
                <p className="text-sm text-slate-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Venue grid */}
        {filteredVenues.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredVenues.map((venue) => (
              <VenueCard
                key={venue.id}
                venue={venue}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            ))}
            {/* Add venue placeholder */}
            <button
              onClick={() => setShowNewVenueModal(true)}
              className="border-2 border-dashed border-slate-700 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 text-slate-500 hover:border-indigo-500 hover:text-indigo-400 transition-colors min-h-[200px]"
            >
              <PlusCircle className="h-8 w-8" />
              <span className="text-sm font-medium">Add another venue</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <Utensils className="h-12 w-12 mb-4 opacity-30" />
            <p className="text-lg font-medium">No venues found</p>
            <p className="text-sm mt-1">
              Try adjusting your search or create a new venue.
            </p>
          </div>
        )}
      </main>

      {/* ── Modal ── */}
      {showNewVenueModal && (
        <NewVenueModal onClose={() => setShowNewVenueModal(false)} />
      )}
    </div>
  );
}
