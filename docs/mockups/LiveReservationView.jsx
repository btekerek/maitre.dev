/**
 * LiveReservationView.jsx
 * Screen 3 – Live Reservation View (Seating + Reservation Queue)
 *
 * Self-contained mockup component.
 * Requires: react, tailwindcss (CDN or build), lucide-react
 *
 * Features demonstrated:
 *  - Left: live canvas with colour-coded table status
 *  - Right: Reservation Queue sidebar with draggable reservation cards
 *  - Drag a reservation card from the queue → drop onto a canvas table to assign it
 *  - Table immediately updates status + shows guest name overlay
 *  - Filter bar to show upcoming / seated / all reservations
 */

import React, { useRef, useState } from "react";
import {
  Users,
  Clock,
  CalendarDays,
  Utensils,
  ChevronLeft,
  PlusCircle,
  GripVertical,
  CheckCircle2,
  XCircle,
  Info,
  Layers,
  Filter,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const GRID_COLS = 10;
const GRID_ROWS = 8;
const CELL_PX = 64;

const STATUS_STYLE = {
  available: { bg: "bg-emerald-900/50", border: "border-emerald-600", text: "text-emerald-300", label: "Available" },
  reserved:  { bg: "bg-amber-900/50",   border: "border-amber-500",   text: "text-amber-300",   label: "Reserved"  },
  seated:    { bg: "bg-red-900/50",      border: "border-red-500",     text: "text-red-300",     label: "Seated"    },
};

// ─── Dummy tables data ────────────────────────────────────────────────────────
const INITIAL_TABLES = [
  { id: 1,  label: "T-1",  capacity: 2, shape: "circle",    pos_x: 1, pos_y: 1, status: "available", guest: null, partySize: 0 },
  { id: 2,  label: "T-2",  capacity: 4, shape: "rectangle", pos_x: 3, pos_y: 1, status: "reserved",  guest: "Johnson, 2",  partySize: 2 },
  { id: 3,  label: "T-3",  capacity: 4, shape: "rectangle", pos_x: 6, pos_y: 1, status: "seated",    guest: "Williams, 3", partySize: 3 },
  { id: 4,  label: "T-4",  capacity: 6, shape: "rectangle", pos_x: 8, pos_y: 1, status: "available", guest: null, partySize: 0 },
  { id: 5,  label: "T-5",  capacity: 2, shape: "circle",    pos_x: 1, pos_y: 4, status: "seated",    guest: "Chen, 2",     partySize: 2 },
  { id: 6,  label: "T-6",  capacity: 4, shape: "rectangle", pos_x: 4, pos_y: 4, status: "available", guest: null, partySize: 0 },
  { id: 7,  label: "Bar",  capacity: 8, shape: "bar",       pos_x: 5, pos_y: 6, status: "reserved",  guest: "Taylor, 4",   partySize: 4 },
  { id: 8,  label: "T-8",  capacity: 4, shape: "rectangle", pos_x: 8, pos_y: 4, status: "seated",    guest: "Martinez, 4", partySize: 4 },
  { id: 9,  label: "T-9",  capacity: 2, shape: "circle",    pos_x: 1, pos_y: 6, status: "available", guest: null, partySize: 0 },
  { id: 10, label: "T-10", capacity: 6, shape: "rectangle", pos_x: 3, pos_y: 6, status: "available", guest: null, partySize: 0 },
];

// ─── Dummy reservation queue ──────────────────────────────────────────────────
const INITIAL_QUEUE = [
  { id: 101, guest: "Anderson",  partySize: 2, time: "18:00", duration: 90,  notes: "Anniversary dinner" },
  { id: 102, guest: "Thompson",  partySize: 4, time: "18:30", duration: 120, notes: "" },
  { id: 103, guest: "Garcia",    partySize: 3, time: "19:00", duration: 90,  notes: "Window seat preferred" },
  { id: 104, guest: "Lee",       partySize: 2, time: "19:00", duration: 60,  notes: "" },
  { id: 105, guest: "Robinson",  partySize: 6, time: "19:30", duration: 120, notes: "Allergy: nuts" },
  { id: 106, guest: "Nguyen",    partySize: 4, time: "20:00", duration: 90,  notes: "" },
];

// ─── TableCell ────────────────────────────────────────────────────────────────
function TableCell({ table, isDropTarget, onDragOver, onDrop, onDragLeave }) {
  const s = STATUS_STYLE[table.status];
  const isCircle = table.shape === "circle";
  const isBar = table.shape === "bar";
  const colSpan = isBar ? 2 : 1;

  return (
    <div
      style={{
        gridColumnStart: table.pos_x + 1,
        gridColumnEnd: table.pos_x + 1 + colSpan,
        gridRowStart: table.pos_y + 1,
        gridRowEnd: table.pos_y + 2,
      }}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={onDragLeave}
      className={`
        z-10 flex flex-col items-center justify-center select-none cursor-pointer
        border-2 transition-all duration-150
        ${isCircle ? "rounded-full" : isBar ? "rounded-lg" : "rounded-xl"}
        ${s.bg} ${s.border} ${s.text}
        ${isDropTarget ? "ring-2 ring-white scale-110 border-white bg-indigo-900/70" : "hover:scale-105"}
      `}
    >
      <span className="text-[11px] font-bold leading-none">{table.label}</span>
      {table.guest ? (
        <span className="text-[8px] mt-0.5 opacity-80 text-center px-0.5 leading-tight">
          {table.guest}
        </span>
      ) : (
        <span className="text-[8px] mt-0.5 opacity-50 flex items-center gap-0.5">
          <Users className="h-2 w-2" />{table.capacity}
        </span>
      )}
    </div>
  );
}

// ─── ReservationCard (draggable) ──────────────────────────────────────────────
function ReservationCard({ reservation, onDragStart, onRemove }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      className="bg-slate-800 border border-slate-700 rounded-xl p-3 cursor-grab active:cursor-grabbing hover:border-indigo-500 transition-colors group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-slate-500 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-slate-200">
              {reservation.guest}
            </p>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {reservation.partySize}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {reservation.time}
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {reservation.duration}m
              </span>
            </div>
            {reservation.notes && (
              <p className="text-[10px] text-amber-400 mt-1 italic flex items-center gap-1">
                <Info className="h-2.5 w-2.5 shrink-0" />
                {reservation.notes}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => onRemove(reservation.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-lg hover:bg-red-900/40 text-slate-500 hover:text-red-400"
        >
          <XCircle className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function LiveReservationView() {
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [queue, setQueue] = useState(INITIAL_QUEUE);
  const [dropTargetId, setDropTargetId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [lastAssigned, setLastAssigned] = useState(null);
  const draggedResRef = useRef(null);

  // Stats
  const available = tables.filter((t) => t.status === "available").length;
  const seated = tables.filter((t) => t.status === "seated").length;
  const reserved = tables.filter((t) => t.status === "reserved").length;

  // ── Drag from queue ──
  function handleResDragStart(res) {
    draggedResRef.current = res;
  }

  function handleTableDragOver(tableId, e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTargetId(tableId);
  }

  function handleTableDrop(tableId, e) {
    e.preventDefault();
    const res = draggedResRef.current;
    if (!res) return;
    setTables((prev) =>
      prev.map((t) =>
        t.id === tableId
          ? {
              ...t,
              status: "seated",
              guest: `${res.guest}, ${res.partySize}`,
              partySize: res.partySize,
            }
          : t
      )
    );
    setQueue((prev) => prev.filter((r) => r.id !== res.id));
    setLastAssigned({ guest: res.guest, table: tables.find((t) => t.id === tableId)?.label });
    draggedResRef.current = null;
    setDropTargetId(null);
    setTimeout(() => setLastAssigned(null), 3000);
  }

  function handleTableDragLeave() {
    setDropTargetId(null);
  }

  function handleRemoveFromQueue(resId) {
    setQueue((prev) => prev.filter((r) => r.id !== resId));
  }

  const filteredQueue = queue.filter((r) => {
    if (filter === "all") return true;
    if (filter === "large") return r.partySize >= 4;
    if (filter === "small") return r.partySize < 4;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      {/* ── Toolbar ── */}
      <header className="border-b border-slate-800 bg-slate-900 px-5 h-14 flex items-center gap-3 shrink-0">
        <a
          href="/dashboard"
          className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-sm mr-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Dashboard
        </a>
        <div className="h-5 w-px bg-slate-700" />
        <div className="flex items-center gap-1.5">
          <Utensils className="h-4 w-4 text-indigo-400" />
          <span className="font-semibold text-slate-200 text-sm">
            La Petit Bistro
          </span>
          <span className="text-slate-500 text-xs">/ Live Seating</span>
        </div>

        {/* Summary badges */}
        <div className="ml-auto flex items-center gap-3">
          {[
            { label: "Available", value: available, color: "text-emerald-400 bg-emerald-900/40 border-emerald-700" },
            { label: "Reserved",  value: reserved,  color: "text-amber-400  bg-amber-900/40  border-amber-700"  },
            { label: "Seated",    value: seated,    color: "text-red-400    bg-red-900/40    border-red-700"    },
          ].map((b) => (
            <span
              key={b.label}
              className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${b.color}`}
            >
              {b.value} {b.label}
            </span>
          ))}
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors">
            <PlusCircle className="h-4 w-4" />
            Add Reservation
          </button>
        </div>
      </header>

      {/* ── Body: canvas + sidebar ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 overflow-auto p-8 bg-slate-950 flex flex-col items-center">
          {/* Toast */}
          {lastAssigned && (
            <div className="mb-4 flex items-center gap-2 bg-emerald-900/60 border border-emerald-600 rounded-xl px-4 py-2 text-emerald-300 text-sm animate-pulse">
              <CheckCircle2 className="h-4 w-4" />
              {lastAssigned.guest} assigned to {lastAssigned.table}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${GRID_COLS}, ${CELL_PX}px)`,
              gridTemplateRows: `repeat(${GRID_ROWS}, ${CELL_PX}px)`,
              width: GRID_COLS * CELL_PX,
              height: GRID_ROWS * CELL_PX,
              background:
                "repeating-linear-gradient(#1e293b 0 1px, transparent 1px 100%), repeating-linear-gradient(90deg, #1e293b 0 1px, transparent 1px 100%)",
              backgroundSize: `${CELL_PX}px ${CELL_PX}px`,
              border: "1px solid #334155",
              borderRadius: "12px",
            }}
          >
            {/* Invisible drop-zone cells */}
            {Array.from({ length: GRID_ROWS }, (_, row) =>
              Array.from({ length: GRID_COLS }, (_, col) => (
                <div
                  key={`${col}-${row}`}
                  style={{ gridColumn: col + 1, gridRow: row + 1 }}
                />
              ))
            )}

            {/* Table objects */}
            {tables.map((table) => (
              <TableCell
                key={table.id}
                table={table}
                isDropTarget={dropTargetId === table.id}
                onDragOver={(e) => handleTableDragOver(table.id, e)}
                onDrop={(e) => handleTableDrop(table.id, e)}
                onDragLeave={handleTableDragLeave}
              />
            ))}
          </div>

          <p className="text-xs text-slate-600 mt-5 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" />
            Drag a reservation card from the queue onto an available table to seat guests.
          </p>
        </div>

        {/* Reservation Queue sidebar */}
        <aside className="w-72 shrink-0 border-l border-slate-800 bg-slate-900 flex flex-col overflow-hidden">
          {/* Sidebar header */}
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-indigo-400" />
              <span className="text-sm font-semibold text-slate-200">
                Reservation Queue
              </span>
              <span className="ml-1 text-xs bg-indigo-600 text-white rounded-full px-1.5 py-0.5 font-medium">
                {queue.length}
              </span>
            </div>
          </div>

          {/* Filter bar */}
          <div className="px-4 py-3 border-b border-slate-800 flex gap-1.5">
            <Filter className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
            {[
              { key: "all",   label: "All"    },
              { key: "small", label: "1–3"    },
              { key: "large", label: "4+"     },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                  filter === f.key
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Drag hint */}
          <div className="mx-4 mt-3 mb-2 text-xs text-slate-500 bg-slate-800/60 border border-dashed border-slate-700 rounded-xl px-3 py-2 flex items-center gap-2">
            <GripVertical className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
            Drag a card below onto the canvas to assign a table.
          </div>

          {/* Queue list */}
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2.5">
            {filteredQueue.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-600">
                <CheckCircle2 className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No reservations in queue</p>
              </div>
            ) : (
              filteredQueue.map((res) => (
                <ReservationCard
                  key={res.id}
                  reservation={res}
                  onDragStart={() => handleResDragStart(res)}
                  onRemove={handleRemoveFromQueue}
                />
              ))
            )}
          </div>

          {/* Sidebar footer stats */}
          <div className="border-t border-slate-800 px-5 py-3 grid grid-cols-2 gap-2 text-xs text-slate-400">
            <div>
              <p className="text-slate-300 font-semibold">{queue.length}</p>
              <p>Pending in queue</p>
            </div>
            <div>
              <p className="text-slate-300 font-semibold">
                {queue.reduce((s, r) => s + r.partySize, 0)}
              </p>
              <p>Total waiting covers</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
