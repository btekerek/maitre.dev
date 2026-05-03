/**
 * CanvasEditor.jsx
 * Screen 2 – Drag-and-Drop Floorplan Canvas Editor
 *
 * Self-contained mockup component.
 * Requires: react, tailwindcss (CDN or build), lucide-react
 *
 * The component demonstrates:
 *  - A CSS-Grid-based canvas where tables are positioned by (col, row) cell indices
 *  - HTML5 drag-and-drop: drag a table, hover cells highlight, drop to reposition
 *  - A right-hand properties sidebar showing selected table details
 *  - "Save Layout" toolbar button (active when isDirty = true)
 *  - Visual distinction between rectangle / circle / bar table shapes
 *  - Status colour coding: available (green), reserved (amber), seated (red)
 */

import React, { useReducer, useRef, useState } from "react";
import {
  Save,
  PlusCircle,
  RotateCw,
  Trash2,
  ChevronLeft,
  Utensils,
  Table2,
  Users,
  Info,
  Move,
  Settings2,
  Undo2,
} from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────
const GRID_COLS = 14;
const GRID_ROWS = 10;
const CELL_PX = 60; // px per grid cell (rendered via inline style)

const STATUS_COLORS = {
  available: {
    bg: "bg-emerald-900/60",
    border: "border-emerald-500",
    text: "text-emerald-300",
    dot: "bg-emerald-400",
  },
  reserved: {
    bg: "bg-amber-900/60",
    border: "border-amber-500",
    text: "text-amber-300",
    dot: "bg-amber-400",
  },
  seated: {
    bg: "bg-red-900/60",
    border: "border-red-500",
    text: "text-red-300",
    dot: "bg-red-400",
  },
};

// ─── Initial tables dummy data ────────────────────────────────────────────────
const INITIAL_TABLES = [
  { id: 1, label: "T-1", capacity: 2, shape: "circle", pos_x: 1, pos_y: 1, rotation: 0, status: "available" },
  { id: 2, label: "T-2", capacity: 4, shape: "rectangle", pos_x: 3, pos_y: 1, rotation: 0, status: "reserved" },
  { id: 3, label: "T-3", capacity: 4, shape: "rectangle", pos_x: 6, pos_y: 1, rotation: 0, status: "seated" },
  { id: 4, label: "T-4", capacity: 6, shape: "rectangle", pos_x: 9, pos_y: 1, rotation: 90, status: "available" },
  { id: 5, label: "T-5", capacity: 2, shape: "circle", pos_x: 1, pos_y: 4, rotation: 0, status: "available" },
  { id: 6, label: "T-6", capacity: 4, shape: "rectangle", pos_x: 4, pos_y: 4, rotation: 0, status: "reserved" },
  { id: 7, label: "Bar", capacity: 8, shape: "bar", pos_x: 7, pos_y: 7, rotation: 0, status: "available" },
  { id: 8, label: "T-8", capacity: 4, shape: "rectangle", pos_x: 11, pos_y: 4, rotation: 0, status: "seated" },
  { id: 9, label: "T-9", capacity: 2, shape: "circle", pos_x: 1, pos_y: 7, rotation: 0, status: "available" },
  { id: 10, label: "T-10", capacity: 6, shape: "rectangle", pos_x: 3, pos_y: 7, rotation: 0, status: "available" },
];

// ─── Reducer ──────────────────────────────────────────────────────────────────
function canvasReducer(state, action) {
  switch (action.type) {
    case "MOVE_TABLE": {
      return {
        ...state,
        isDirty: true,
        tables: state.tables.map((t) =>
          t.id === action.id
            ? { ...t, pos_x: action.pos_x, pos_y: action.pos_y }
            : t
        ),
      };
    }
    case "ROTATE_TABLE": {
      return {
        ...state,
        isDirty: true,
        tables: state.tables.map((t) =>
          t.id === action.id
            ? { ...t, rotation: (t.rotation + 90) % 360 }
            : t
        ),
      };
    }
    case "SELECT_TABLE":
      return { ...state, selectedTableId: action.id };
    case "DESELECT":
      return { ...state, selectedTableId: null };
    case "MARK_CLEAN":
      return { ...state, isDirty: false };
    case "DELETE_TABLE":
      return {
        ...state,
        isDirty: true,
        selectedTableId:
          state.selectedTableId === action.id ? null : state.selectedTableId,
        tables: state.tables.filter((t) => t.id !== action.id),
      };
    default:
      return state;
  }
}

// ─── TableShape helper ────────────────────────────────────────────────────────
function TableShape({ table, selected, onDragStart, onClick }) {
  const s = STATUS_COLORS[table.status];
  const isCircle = table.shape === "circle";
  const isBar = table.shape === "bar";

  // bar spans 2 columns visually via wider width
  const widthCells = isBar ? 2 : 1;
  const heightCells = isBar ? 1 : 1;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={(e) => {
        e.stopPropagation();
        onClick(table.id);
      }}
      style={{
        gridColumnStart: table.pos_x + 1,
        gridColumnEnd: table.pos_x + 1 + widthCells,
        gridRowStart: table.pos_y + 1,
        gridRowEnd: table.pos_y + 1 + heightCells,
        transform: `rotate(${table.rotation}deg)`,
        cursor: "grab",
      }}
      className={`
        z-10 flex flex-col items-center justify-center select-none
        border-2 transition-all duration-150
        ${isCircle ? "rounded-full" : isBar ? "rounded-lg" : "rounded-xl"}
        ${s.bg} ${s.border} ${s.text}
        ${selected ? "ring-2 ring-white ring-offset-1 ring-offset-slate-900 shadow-lg scale-105" : "hover:scale-105"}
      `}
      title={`${table.label} — ${table.status}`}
    >
      <span className="text-xs font-bold leading-none">{table.label}</span>
      <span className="text-[9px] mt-0.5 opacity-70 flex items-center gap-0.5">
        <Users className="h-2 w-2" />
        {table.capacity}
      </span>
      <span className={`h-1.5 w-1.5 rounded-full mt-1 ${s.dot}`} />
    </div>
  );
}

// ─── PropertiesSidebar ────────────────────────────────────────────────────────
function PropertiesSidebar({ table, onRotate, onDelete }) {
  if (!table) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3 p-6">
        <Move className="h-8 w-8 opacity-40" />
        <p className="text-sm text-center">
          Click a table on the canvas to view its properties.
        </p>
      </div>
    );
  }
  const s = STATUS_COLORS[table.status];
  return (
    <div className="p-5 flex flex-col gap-5">
      <div>
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Table Properties
        </h3>
        <div className={`rounded-xl border ${s.border} ${s.bg} p-4 flex items-center gap-3`}>
          <Table2 className={`h-6 w-6 ${s.text}`} />
          <div>
            <p className={`font-semibold ${s.text}`}>{table.label}</p>
            <p className="text-xs text-slate-400 capitalize">{table.status}</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 text-sm">
        {[
          { label: "Shape", value: table.shape },
          { label: "Capacity", value: `${table.capacity} guests` },
          { label: "Position", value: `Col ${table.pos_x}, Row ${table.pos_y}` },
          { label: "Rotation", value: `${table.rotation}°` },
        ].map((row) => (
          <div key={row.label} className="flex justify-between">
            <span className="text-slate-400">{row.label}</span>
            <span className="text-slate-200 font-medium">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-700 pt-4 space-y-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Actions
        </p>
        <button
          onClick={onRotate}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm transition-colors"
        >
          <RotateCw className="h-4 w-4" />
          Rotate 90°
        </button>
        <button
          onClick={onDelete}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-red-900/30 hover:bg-red-900/60 text-red-400 text-sm transition-colors border border-red-800/50"
        >
          <Trash2 className="h-4 w-4" />
          Remove from Canvas
        </button>
      </div>

      {/* Legend */}
      <div className="border-t border-slate-700 pt-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Status Legend
        </p>
        {Object.entries(STATUS_COLORS).map(([status, c]) => (
          <div key={status} className="flex items-center gap-2 mb-2">
            <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
            <span className="text-xs text-slate-300 capitalize">{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CanvasEditor() {
  const [state, dispatch] = useReducer(canvasReducer, {
    tables: INITIAL_TABLES,
    isDirty: false,
    selectedTableId: null,
  });

  const draggedIdRef = useRef(null);
  const dragOffsetRef = useRef({ col: 0, row: 0 });
  const [hoveredCell, setHoveredCell] = useState(null);
  const [saving, setSaving] = useState(false);

  const selectedTable = state.tables.find(
    (t) => t.id === state.selectedTableId
  ) || null;

  // ── Drag handlers ──
  function handleDragStart(table, e) {
    draggedIdRef.current = table.id;
    dragOffsetRef.current = { col: 0, row: 0 };
    dispatch({ type: "SELECT_TABLE", id: table.id });
    e.dataTransfer.effectAllowed = "move";
  }

  function handleCellDragOver(col, row, e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setHoveredCell({ col, row });
  }

  function handleCellDrop(col, row, e) {
    e.preventDefault();
    if (draggedIdRef.current !== null) {
      dispatch({ type: "MOVE_TABLE", id: draggedIdRef.current, pos_x: col, pos_y: row });
      draggedIdRef.current = null;
    }
    setHoveredCell(null);
  }

  function handleDragEnd() {
    draggedIdRef.current = null;
    setHoveredCell(null);
  }

  // ── Save simulation ──
  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      dispatch({ type: "MARK_CLEAN" });
      setSaving(false);
    }, 900);
  }

  // Build set of occupied cells for quick lookup
  const occupiedCells = new Set(
    state.tables.map((t) => `${t.pos_x}-${t.pos_y}`)
  );

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
          <span className="text-slate-500 text-xs">/ Canvas Editor</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {state.isDirty && (
            <span className="text-xs text-amber-400 flex items-center gap-1 mr-1">
              <Info className="h-3.5 w-3.5" />
              Unsaved changes
            </span>
          )}
          <button
            onClick={() => dispatch({ type: "MARK_CLEAN" })}
            disabled={!state.isDirty}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:bg-slate-800 text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Undo2 className="h-4 w-4" />
            Undo
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm transition-colors">
            <PlusCircle className="h-4 w-4 text-indigo-400" />
            Add Table
          </button>
          <button
            onClick={handleSave}
            disabled={!state.isDirty || saving}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-white text-sm font-semibold transition-all
              ${state.isDirty && !saving
                ? "bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-900/40"
                : "bg-slate-700 cursor-not-allowed opacity-50"
              }`}
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Save Layout"}
          </button>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas area */}
        <div
          className="flex-1 overflow-auto p-8 bg-slate-950"
          onClick={() => dispatch({ type: "DESELECT" })}
        >
          <div
            className="relative mx-auto"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${GRID_COLS}, ${CELL_PX}px)`,
              gridTemplateRows: `repeat(${GRID_ROWS}, ${CELL_PX}px)`,
              width: GRID_COLS * CELL_PX,
              height: GRID_ROWS * CELL_PX,
              background: "repeating-linear-gradient(#1e293b 0 1px, transparent 1px 100%), repeating-linear-gradient(90deg, #1e293b 0 1px, transparent 1px 100%)",
              backgroundSize: `${CELL_PX}px ${CELL_PX}px`,
              border: "1px solid #334155",
              borderRadius: "12px",
            }}
            onDragLeave={() => setHoveredCell(null)}
          >
            {/* Grid cells (drop targets) */}
            {Array.from({ length: GRID_ROWS }, (_, row) =>
              Array.from({ length: GRID_COLS }, (_, col) => {
                const key = `${col}-${row}`;
                const isHovered =
                  hoveredCell?.col === col && hoveredCell?.row === row;
                const isOccupied = occupiedCells.has(key);
                return (
                  <div
                    key={key}
                    style={{
                      gridColumn: col + 1,
                      gridRow: row + 1,
                    }}
                    onDragOver={(e) => handleCellDragOver(col, row, e)}
                    onDrop={(e) => handleCellDrop(col, row, e)}
                    className={`transition-colors duration-100 ${
                      isHovered
                        ? isOccupied
                          ? "bg-red-500/20"
                          : "bg-indigo-500/20"
                        : ""
                    }`}
                  />
                );
              })
            )}

            {/* Table objects */}
            {state.tables.map((table) => (
              <TableShape
                key={table.id}
                table={table}
                selected={state.selectedTableId === table.id}
                onDragStart={(e) => handleDragStart(table, e)}
                onClick={(id) => dispatch({ type: "SELECT_TABLE", id })}
              />
            ))}
          </div>

          {/* Drag hint */}
          <p className="text-center text-xs text-slate-600 mt-5 flex items-center justify-center gap-1.5">
            <Move className="h-3.5 w-3.5" />
            Drag tables to reposition them on the grid. Click a table to select it.
          </p>
        </div>

        {/* Properties sidebar */}
        <aside className="w-64 shrink-0 border-l border-slate-800 bg-slate-900 overflow-y-auto">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-800">
            <Settings2 className="h-4 w-4 text-indigo-400" />
            <span className="text-sm font-semibold text-slate-200">
              Properties
            </span>
          </div>
          <PropertiesSidebar
            table={selectedTable}
            onRotate={() =>
              selectedTable &&
              dispatch({ type: "ROTATE_TABLE", id: selectedTable.id })
            }
            onDelete={() =>
              selectedTable &&
              dispatch({ type: "DELETE_TABLE", id: selectedTable.id })
            }
          />
        </aside>
      </div>

      {/* ── Status bar ── */}
      <footer className="h-8 border-t border-slate-800 bg-slate-900 px-5 flex items-center gap-6 text-xs text-slate-500">
        <span>{state.tables.length} tables on canvas</span>
        <span>Grid: {GRID_COLS} × {GRID_ROWS}</span>
        {state.isDirty && (
          <span className="text-amber-500 font-medium">● Modified</span>
        )}
        {!state.isDirty && (
          <span className="text-emerald-500 font-medium">✓ Saved</span>
        )}
      </footer>
    </div>
  );
}
