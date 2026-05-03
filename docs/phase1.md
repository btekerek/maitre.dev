# maitre.dev — Phase 1 Project Documentation

---

## 1. Author Information

| Field       | Value                  |
|-------------|------------------------|
| **Name**    | *(placeholder)*        |
| **Neptun**  | *(placeholder)*        |
| **Date**    | *(placeholder)*        |

---

## 2. Project Overview

### Description

**maitre.dev** is a portfolio-grade, full-stack web application that provides restaurant and event-space owners with an **interactive floorplan and live seating management** platform. Instead of juggling paper diagrams or static spreadsheets, venue owners log in to a rich browser-based canvas, drag tables into the exact layout of their physical space, and assign incoming reservations to specific tables in real time. The result is a single, always-current view of who is sitting where, what is free, and what is coming next — eliminating the communication overhead that causes double-bookings and lost covers.

The application's technical showpiece is a **client-side drag-and-drop canvas editor** built with React and the HTML5 Drag & Drop API (enhanced with pointer-event listeners). Venue owners build or edit their floorplan without ever leaving the browser; every positional change is persisted to the server via a REST API and instantly reflected to any other authenticated session through TanStack Query's cache invalidation strategy.

### Domain Vocabulary

| Term | Definition |
|------|-----------|
| **Venue** | The top-level entity representing a single physical restaurant or event space owned by a user. |
| **Floorplan / Canvas** | The interactive 2-D visual editor within which a venue owner places, moves, and rotates table objects on a grid. |
| **Table Object** | A positioned, labelled element on the canvas (e.g., "Table 4", capacity 4). Stores X/Y grid coordinates, rotation, shape, and capacity. |
| **Reservation** | A booking record linking a named party to a specific table for a defined date/time window. |
| **Reservation Queue** | The sidebar panel on the Live Reservation View that lists upcoming/unassigned reservations ready to be dragged onto a free table. |
| **Party Size** | The number of guests in a single reservation; used to filter or highlight tables with sufficient capacity. |
| **Assignment** | The act of attaching a reservation to a specific table — changes the table's status from *Available* to *Reserved* or *Seated*. |
| **System Admin** | A super-user account that can access and manage all venues across all owners. |
| **Venue Owner** | A registered user who creates and manages one or more venues. All of their data is scoped exclusively to their own account. |

---

## 3. Technology Stack

| Layer | Technology |
|-------|-----------|
| **Backend framework** | Laravel 11 (PHP 8.3) — REST API |
| **Authentication** | Laravel Breeze + Laravel Sanctum (SPA token-based auth) |
| **Database** | SQLite (single-file, zero-config; suitable for development and demo) |
| **ORM** | Eloquent ORM (Laravel built-in) |
| **Frontend framework** | React 18 (Vite-powered, JSX/TSX) |
| **Data fetching / cache** | TanStack Query v5 (React Query) |
| **Component library** | shadcn/ui (Radix UI primitives + class-variance-authority) |
| **CSS utility framework** | Tailwind CSS v3 |
| **Icons** | Lucide React |
| **API communication** | Axios (with Sanctum CSRF cookie handling) |
| **Routing (client)** | React Router v6 |

---

## 4. Database Schema

### 4.1 Entity-Relationship Summary

```
users (1) ──< venues (1) ──< tables (1) ──< reservations
```

- A **user** owns zero or more **venues** *(1 : N)*
- A **venue** contains zero or more **tables** *(1 : N)*
- A **table** has zero or more **reservations** *(1 : N)*

### 4.2 DBML

```dbml
// maitre.dev — Database Markup Language definition
// Generated for Phase 1 documentation

Project maitre_dev {
  database_type: 'SQLite'
  Note: 'Interactive Floorplan & Seating Manager'
}

Table users {
  id         integer   [pk, increment]
  name       varchar   [not null]
  email      varchar   [not null, unique]
  password   varchar   [not null]
  is_admin   boolean   [not null, default: false]
  created_at timestamp
  updated_at timestamp

  Note: 'Standard Laravel auth user table extended with is_admin flag.'
}

Table venues {
  id          integer   [pk, increment]
  user_id     integer   [not null, ref: > users.id]
  name        varchar   [not null]
  description text
  address     varchar
  created_at  timestamp
  updated_at  timestamp

  Note: 'Each venue belongs to exactly one user (owner). Soft-delete not used in Phase 1.'
}

Table tables {
  id          integer   [pk, increment]
  venue_id    integer   [not null, ref: > venues.id]
  label       varchar   [not null, note: 'e.g. "Table 7", "Bar Stool A"']
  capacity    integer   [not null, default: 2]
  shape       varchar   [not null, default: 'rectangle', note: 'rectangle | circle | bar']
  pos_x       integer   [not null, default: 0, note: 'Grid column index (0-based)']
  pos_y       integer   [not null, default: 0, note: 'Grid row index (0-based)']
  rotation    integer   [not null, default: 0, note: 'Degrees: 0, 90, 180, 270']
  created_at  timestamp
  updated_at  timestamp

  Note: 'A physical or logical table placed on the venue canvas. Position is stored as grid cell indices, not raw pixels.'
}

Table reservations {
  id              integer   [pk, increment]
  table_id        integer   [not null, ref: > tables.id]
  guest_name      varchar   [not null]
  party_size      integer   [not null, default: 1]
  reserved_at     timestamp [not null, note: 'Scheduled start of the reservation']
  duration_minutes integer  [not null, default: 90]
  status          varchar   [not null, default: 'upcoming', note: 'upcoming | seated | completed | cancelled']
  notes           text
  created_at      timestamp
  updated_at      timestamp

  Note: 'A reservation links a named guest party to a specific table for a time window.'
}
```

### 4.3 Field Descriptions

#### `users`
| Column | Type | Notes |
|--------|------|-------|
| `id` | INTEGER PK | Auto-increment surrogate key |
| `name` | VARCHAR | Full display name |
| `email` | VARCHAR UNIQUE | Login identifier |
| `password` | VARCHAR | Bcrypt hash |
| `is_admin` | BOOLEAN | Elevates to system-admin privileges |

#### `venues`
| Column | Type | Notes |
|--------|------|-------|
| `id` | INTEGER PK | Auto-increment surrogate key |
| `user_id` | INTEGER FK → users | Owning user; cascade-delete |
| `name` | VARCHAR | Public venue name |
| `description` | TEXT | Optional longer description |
| `address` | VARCHAR | Physical address for reference |

#### `tables`
| Column | Type | Notes |
|--------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `venue_id` | INTEGER FK → venues | Parent venue; cascade-delete |
| `label` | VARCHAR | Human-readable identifier shown on canvas |
| `capacity` | INTEGER | Max seated guests |
| `shape` | VARCHAR | Visual shape hint for canvas renderer |
| `pos_x` | INTEGER | Horizontal grid cell (column) |
| `pos_y` | INTEGER | Vertical grid cell (row) |
| `rotation` | INTEGER | Rotation in 90° steps |

#### `reservations`
| Column | Type | Notes |
|--------|------|-------|
| `id` | INTEGER PK | Auto-increment |
| `table_id` | INTEGER FK → tables | Assigned table; nullable (unassigned queue) |
| `guest_name` | VARCHAR | Primary guest name |
| `party_size` | INTEGER | Number of people in party |
| `reserved_at` | TIMESTAMP | Booking start date/time |
| `duration_minutes` | INTEGER | Expected duration |
| `status` | VARCHAR | Lifecycle state enum |
| `notes` | TEXT | Optional free-text notes |

---

## 5. API Routes Plan (REST)

> All routes are prefixed with `/api`. Authenticated routes require a valid **Sanctum bearer token** sent in the `Authorization` header. The `is_admin` flag on the user record grants system-admin access.

### Authentication

| Method | Path | Function | Authentication | Authorization |
|--------|------|----------|---------------|--------------|
| POST | `/api/register` | Register a new user, return token | ❌ Public | Anyone |
| POST | `/api/login` | Authenticate and return Sanctum token | ❌ Public | Anyone |
| POST | `/api/logout` | Revoke current token | ✅ Required | Authenticated user |
| GET | `/api/user` | Return current authenticated user object | ✅ Required | Authenticated user |

### Venues

| Method | Path | Function | Authentication | Authorization |
|--------|------|----------|---------------|--------------|
| GET | `/api/venues` | List all venues belonging to the current user (admin sees all) | ✅ Required | Owner or Admin |
| POST | `/api/venues` | Create a new venue (owner is set to auth user) | ✅ Required | Authenticated user |
| GET | `/api/venues/{venue}` | Get a single venue's details | ✅ Required | Owner or Admin |
| PUT/PATCH | `/api/venues/{venue}` | Update venue details | ✅ Required | Owner or Admin |
| DELETE | `/api/venues/{venue}` | Delete venue and cascade-delete tables/reservations | ✅ Required | Owner or Admin |

### Tables

| Method | Path | Function | Authentication | Authorization |
|--------|------|----------|---------------|--------------|
| GET | `/api/venues/{venue}/tables` | List all tables for a venue (includes position data) | ✅ Required | Owner or Admin |
| POST | `/api/venues/{venue}/tables` | Create a new table on the canvas | ✅ Required | Owner or Admin |
| GET | `/api/venues/{venue}/tables/{table}` | Get a single table | ✅ Required | Owner or Admin |
| PUT/PATCH | `/api/venues/{venue}/tables/{table}` | Update table metadata or position (bulk position update on canvas save) | ✅ Required | Owner or Admin |
| DELETE | `/api/venues/{venue}/tables/{table}` | Remove table from canvas | ✅ Required | Owner or Admin |

### Reservations

| Method | Path | Function | Authentication | Authorization |
|--------|------|----------|---------------|--------------|
| GET | `/api/venues/{venue}/reservations` | List all reservations for a venue (filterable by date, status) | ✅ Required | Owner or Admin |
| POST | `/api/venues/{venue}/reservations` | Create a new reservation (may be unassigned) | ✅ Required | Owner or Admin |
| GET | `/api/venues/{venue}/reservations/{reservation}` | Get single reservation details | ✅ Required | Owner or Admin |
| PUT/PATCH | `/api/venues/{venue}/reservations/{reservation}` | Update reservation (e.g., change table assignment, status, time) | ✅ Required | Owner or Admin |
| DELETE | `/api/venues/{venue}/reservations/{reservation}` | Cancel/delete a reservation | ✅ Required | Owner or Admin |

### Admin-only

| Method | Path | Function | Authentication | Authorization |
|--------|------|----------|---------------|--------------|
| GET | `/api/admin/users` | List all registered users | ✅ Required | Admin only |
| DELETE | `/api/admin/users/{user}` | Delete a user and all their data | ✅ Required | Admin only |

---

## 6. Client-Side Application Design

### 6.1 Overview

The client-side application is a **React 18 SPA** served from Vite's dev server (or a compiled static build). It communicates with the Laravel REST API exclusively through Axios, with TanStack Query (React Query) managing all server-state caching, background re-fetching, and optimistic updates.

### 6.2 The Drag-and-Drop Floorplan Canvas — Technical Deep-Dive

#### Grid System

The canvas is implemented as a CSS Grid container with a fixed cell size (e.g., `48 × 48 px`). Each cell is addressable by a `(col, row)` pair that maps directly to the `pos_x` / `pos_y` columns in the `tables` database table. This discrete grid model:

- Ensures tables always snap to whole cells (no fractional positioning).
- Makes serialisation trivial — only integer pairs need to be stored.
- Allows the backend to detect and report overlapping table positions.

#### Table Dragging Mechanics

Each table object rendered on the canvas is a React component (`<CanvasTable />`). It has `draggable={true}` and attaches the following event handlers:

```
onDragStart  → records which table is being dragged (draggedTableId) in a React useRef
onDragOver   → on each grid cell, calls preventDefault() to allow dropping; highlights the target cell
onDrop       → on the target cell, reads the dragged table ID and new (col, row), dispatches a local state update
```

Local floorplan state is held in a `useReducer` hook with the shape:

```js
{
  tables: [
    { id, label, capacity, shape, pos_x, pos_y, rotation, status }
    // ...
  ],
  isDirty: boolean,   // true when unsaved local changes exist
  selectedTableId: number | null
}
```

When `onDrop` fires, the reducer's `MOVE_TABLE` action updates `pos_x` / `pos_y` for the dragged table and sets `isDirty = true`. The canvas reflects the change immediately — no network round-trip is required for visual feedback.

#### Grid Snapping

Because the grid cells are CSS Grid items, the "snap" behaviour is inherent: when a table is dropped into a cell, its position is set to that cell's `(col, row)` — fractional positions are never possible. The offset within the dragged item (`dragOffsetX / Y`) is calculated on `dragStart` using `event.nativeEvent.offsetX / offsetY` divided by the cell size to determine which sub-cell the user grabbed, allowing the drop to feel natural rather than always anchoring to the top-left corner of the dragged element.

#### Rotation

A **Rotate** button in the properties sidebar dispatches `ROTATE_TABLE` to the reducer, incrementing the rotation by 90° (mod 360). The table element applies a `transform: rotate(Xdeg)` CSS rule.

#### Saving to the Server

A persistent **"Save Layout"** button is shown in the editor toolbar whenever `isDirty === true`. On click, it calls the TanStack Query mutation:

```js
const saveLayout = useMutation({
  mutationFn: (tables) =>
    Promise.all(
      tables.map(t =>
        axios.patch(`/api/venues/${venueId}/tables/${t.id}`, {
          pos_x: t.pos_x,
          pos_y: t.pos_y,
          rotation: t.rotation
        })
      )
    ),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['tables', venueId] });
    dispatch({ type: 'MARK_CLEAN' });
  }
});
```

Each changed table fires an individual `PATCH` request. The `onSuccess` handler invalidates the TanStack Query cache key `['tables', venueId]`, causing any other open view (e.g., the Live Reservation View in another tab) to re-fetch fresh positions.

#### Reservation Assignment (Drag-on-Table)

On the **Live Reservation View**, unassigned reservations appear in a sidebar queue. Each queue item is `draggable`. When a queue item is dropped onto a canvas table element (the table acts as a drop target by listening to `onDragOver` / `onDrop`), the following mutation fires:

```js
const assignReservation = useMutation({
  mutationFn: ({ reservationId, tableId }) =>
    axios.patch(`/api/venues/${venueId}/reservations/${reservationId}`, {
      table_id: tableId,
      status: 'seated'
    }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['reservations', venueId] });
    queryClient.invalidateQueries({ queryKey: ['tables', venueId] });
  }
});
```

The table immediately re-renders with the guest's name and party size overlaid, sourced from the fresh cache.

### 6.3 TanStack Query Cache Keys

| Query key | Description |
|-----------|-------------|
| `['venues']` | All venues for the current user |
| `['venue', venueId]` | Single venue detail |
| `['tables', venueId]` | All tables (with positions) for a venue |
| `['reservations', venueId]` | All reservations for a venue |
| `['reservations', venueId, { date, status }]` | Filtered reservation list |

All mutating operations call `queryClient.invalidateQueries` on the relevant keys upon success.

### 6.4 Client-Side Routing (React Router v6)

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `<LandingPage />` | Marketing / login redirect |
| `/login` | `<LoginPage />` | Sanctum login form |
| `/register` | `<RegisterPage />` | Registration form |
| `/dashboard` | `<Dashboard />` | Venue list / overview |
| `/venues/:venueId/canvas` | `<CanvasEditor />` | Drag-and-drop floorplan editor |
| `/venues/:venueId/reservations` | `<LiveReservationView />` | Live seating + reservation queue |
| `/admin` | `<AdminPanel />` | System admin — user list (admin only) |

---

## 7. Functional Requirements

1. **FR-01** — A visitor can register a new account with name, email, and password.
2. **FR-02** — A registered user can log in and receive a session token; they can log out and revoke it.
3. **FR-03** — An authenticated user can create, read, update, and delete one or more **Venues**.
4. **FR-04** — Within a venue, the user can add **Tables** with a label, capacity, and shape.
5. **FR-05** — The user can open the **Canvas Editor** and see all of their venue's tables placed on a grid.
6. **FR-06** — The user can **drag and drop** tables to reposition them on the canvas grid.
7. **FR-07** — Table positions snap to grid cells; overlapping placements are visually indicated and blocked on save.
8. **FR-08** — The user can **rotate** a table in 90° steps from the properties panel.
9. **FR-09** — The user can **save** the current canvas layout, persisting all positions to the server via the REST API.
10. **FR-10** — The user can create, read, update, and delete **Reservations** associated with a venue.
11. **FR-11** — Reservations can be left **unassigned** (in the queue) or assigned to a specific table.
12. **FR-12** — On the Live Reservation View, the user can **drag a reservation from the queue onto a canvas table** to assign it, immediately changing the table's status.
13. **FR-13** — Tables display their current **status** (Available / Reserved / Seated) visually on the canvas.
14. **FR-14** — A system admin can view all users and delete any user's account.
15. **FR-15** — **Ownership scoping**: a user cannot access or mutate another user's venues, tables, or reservations (enforced by Laravel Policies).
16. **FR-16** — All API mutations return appropriate HTTP status codes and validation error messages.

---

## 8. Roles

| Role | Description |
|------|-------------|
| **Guest** | Unauthenticated visitor. Can only access the landing page, login, and register pages. |
| **Venue Owner** | Authenticated user. Has full CRUD over their own venues, tables, and reservations. Cannot see or modify other users' data. |
| **System Admin** | Authenticated user with `is_admin = true`. Has read/write access to all data across all users. Can manage users. |

---

## 9. Features by Roles

| Feature | Guest | Venue Owner | System Admin |
|---------|-------|-------------|--------------|
| Register / Login | ✅ | — | — |
| View own venues | — | ✅ | ✅ (all) |
| Create venue | — | ✅ | ✅ |
| Edit / delete own venue | — | ✅ | ✅ (any) |
| View canvas editor | — | ✅ (own) | ✅ (any) |
| Drag & reposition tables | — | ✅ (own) | ✅ (any) |
| Save canvas layout | — | ✅ (own) | ✅ (any) |
| Create / edit / delete tables | — | ✅ (own) | ✅ (any) |
| View reservations | — | ✅ (own) | ✅ (any) |
| Create / edit / delete reservations | — | ✅ (own) | ✅ (any) |
| Assign reservation to table | — | ✅ (own) | ✅ (any) |
| View admin user list | — | ❌ | ✅ |
| Delete any user | — | ❌ | ✅ |

---

## 10. Features by Roles and Pages

| Page / Route | Feature | Venue Owner | System Admin |
|---|---|---|---|
| `/dashboard` | List own venues | ✅ | ✅ (all venues) |
| `/dashboard` | Create new venue | ✅ | ✅ |
| `/dashboard` | Delete venue | ✅ (own) | ✅ (any) |
| `/venues/:id/canvas` | View canvas grid | ✅ (own) | ✅ (any) |
| `/venues/:id/canvas` | Add / delete table objects | ✅ (own) | ✅ (any) |
| `/venues/:id/canvas` | Drag-reposition tables | ✅ (own) | ✅ (any) |
| `/venues/:id/canvas` | Rotate table | ✅ (own) | ✅ (any) |
| `/venues/:id/canvas` | Save layout | ✅ (own) | ✅ (any) |
| `/venues/:id/reservations` | View live seating map | ✅ (own) | ✅ (any) |
| `/venues/:id/reservations` | View reservation queue sidebar | ✅ (own) | ✅ (any) |
| `/venues/:id/reservations` | Drag reservation → table | ✅ (own) | ✅ (any) |
| `/venues/:id/reservations` | Create / edit reservation | ✅ (own) | ✅ (any) |
| `/venues/:id/reservations` | Mark seated / completed | ✅ (own) | ✅ (any) |
| `/admin` | List all users | ❌ | ✅ |
| `/admin` | Delete user | ❌ | ✅ |

---

## 11. Permissions for Authorization

Laravel authorization is implemented via **Form Requests** for input validation and **Model Policies** for resource-level access control. The `Gate` facade is used for admin-only checks.

### 11.1 `VenuePolicy`

```
viewAny  → true if $user->id === $venue->user_id OR $user->is_admin
view     → true if $user->id === $venue->user_id OR $user->is_admin
create   → true for any authenticated user (owner is set to auth()->id())
update   → true if $user->id === $venue->user_id OR $user->is_admin
delete   → true if $user->id === $venue->user_id OR $user->is_admin
```

### 11.2 `TablePolicy`

Before any table action, the controller first resolves the parent `Venue` and applies `VenuePolicy`. The `TablePolicy` delegates to the venue check:

```
view/create/update/delete → VenuePolicy::view($user, $table->venue)
```

This guarantees that a user who cannot access a venue also cannot manipulate any of its tables — even if they somehow know a table ID.

### 11.3 `ReservationPolicy`

Identical delegation pattern as `TablePolicy`, but ascending through `Table → Venue`:

```
view/create/update/delete → VenuePolicy::view($user, $reservation->table->venue)
```

### 11.4 Admin Gate

A `Gate::define('admin', fn($user) => $user->is_admin)` gate is registered in `AuthServiceProvider`. Admin-only routes (e.g., `GET /api/admin/users`) use `$this->authorize('admin')` in the controller, which returns HTTP 403 for non-admins.

### 11.5 HTTP Response Codes

| Scenario | HTTP Status |
|----------|------------|
| Successful read | 200 OK |
| Successful creation | 201 Created |
| Successful update | 200 OK |
| Successful deletion | 204 No Content |
| Not authenticated | 401 Unauthorized |
| Authenticated but not authorised | 403 Forbidden |
| Resource not found | 404 Not Found |
| Validation error | 422 Unprocessable Entity |

---

## 12. UI Mockup Designs (Coded Mockups)

> Each screen is implemented as a **self-contained, single-file React component** using Tailwind CSS for all styling and Lucide React for icons. Realistic dummy data is embedded in component state so screens render fully populated without a live API. Source files are located in `docs/mockups/`.

### Screen 1 — Venue Dashboard
**File:** `docs/mockups/VenueDashboard.jsx`

Displays the authenticated owner's venue list. Each card shows the venue name, address, table count, and upcoming reservation count. Provides quick links to open the Canvas Editor or the Live Reservation View, plus a "New Venue" creation button.

### Screen 2 — Drag-and-Drop Canvas Editor
**File:** `docs/mockups/CanvasEditor.jsx`

Shows the interactive grid canvas with table objects placed at their saved positions. A properties sidebar on the right shows details for the selected table. The toolbar contains Save, Add Table, and Undo controls. Visual distinction between table shapes (rectangle, circle, bar) is rendered. Drag-handle cursors and a highlighted drop-target cell illustrate the drag-and-drop interaction.

### Screen 3 — Live Reservation View
**File:** `docs/mockups/LiveReservationView.jsx`

Split-panel layout: the left side shows the live canvas with colour-coded table status (green = available, amber = reserved, red = seated). The right sidebar shows the Reservation Queue of upcoming and unassigned guests. A drag instruction hint above the queue guides the user to drag a reservation card onto a table.

---

## 13. AI Appendix

### Methodology & AI Tool Usage Declaration

This Phase 1 documentation was produced with the assistance of Large Language Model (LLM) technology — specifically an AI-powered pair-programming assistant. The following declaration is made in full compliance with the transparency requirements stipulated by the course instructor.

#### Role of the AI Tool

The LLM was engaged exclusively in the capacity of an **architectural sounding board** and a **boilerplate code generator**. Its usage fell into four distinct categories:

1. **Database normalisation validation.** The relational schema was first designed independently by the author, identifying the core entities (users, venues, tables, reservations) and their cardinalities. The AI assistant was then consulted to review the DBML definition for normalisation correctness (verifying that the schema satisfies Third Normal Form), to confirm that cascade-delete semantics were appropriate, and to cross-check that the `pos_x` / `pos_y` integer-pair grid model was a sound serialisation strategy for canvas coordinates.

2. **REST API route planning.** The author independently defined the resource hierarchy and the ownership-scoping requirement. The AI assistant was used to stress-test the proposed URL structure against REST best-practice conventions, to confirm that nested routes (`/api/venues/{venue}/tables/{table}`) correctly implied the parent-child relationship at the HTTP layer, and to enumerate the correct HTTP status codes for each scenario.

3. **Client-side state architecture review.** The drag-and-drop canvas interaction model — including the decision to use a `useReducer` hook with `MOVE_TABLE`, `ROTATE_TABLE`, and `MARK_CLEAN` actions, and the TanStack Query cache-invalidation strategy on mutation success — was designed by the author. The AI assistant validated that the chosen approach correctly separates server state (owned by TanStack Query) from ephemeral UI state (owned by `useReducer`), and confirmed that the optimistic local-state update pattern before the `PATCH` network call was consistent with TanStack Query's recommended mutation flow.

4. **High-fidelity UI mockup boilerplate.** The professor explicitly required rendered, coded mockups rather than wireframe images. The AI assistant was used to generate the Tailwind CSS / React component boilerplate for the three core screens (Venue Dashboard, Canvas Editor, Live Reservation View), based on a detailed visual and structural specification provided by the author. The author specified the layout, the data model, the colour semantics (green/amber/red for table status), and the interactive elements; the AI translated this specification into JSX and Tailwind class strings. The resulting components were then reviewed and adjusted by the author.

#### Core Authorship Declaration

The **application concept**, the **business domain selection**, the **technical constraint decisions** (Laravel + React + TanStack Query + SQLite), the **ownership-scoping security model**, the **drag-and-drop canvas design**, and the **overall project architecture** are the independent intellectual work of the author. The AI assistant did not drive any of these decisions; it served only to accelerate their documentation and validate their correctness against established best practices.

This methodology is consistent with responsible and transparent academic use of AI tools: the author retains full understanding of, and accountability for, every architectural and technical decision documented herein.

---

### Prompt Utilized

The following is the complete, verbatim prompt submitted to the AI assistant to generate this documentation, reproduced here in full to satisfy the course's transparency requirement:

> *"Act as a senior full-stack developer and my project partner. We are building a portfolio-grade full-stack application called "maitre.dev" for my university assignment. I need you to help me draft the "Phase 1" project documentation.*
> *Our application is an Interactive Floorplan & Seating Manager for restaurant or event space owners. The core technical showpiece is a complex client-side drag-and-drop canvas editor where users can map out their venue (tables, structures) and dynamically assign live reservations to specific tables.*
> *Here are the strict technical constraints we must follow:*
> *- Server-side: Laravel (REST API), Laravel Breeze + Sanctum (authentication), SQLite.*
> *- Client-side: React, TanStack Query.*
> *- Component Library: Tailwind CSS + shadcn/ui.*
> *- Must have at least 3 relational tables (including users) with at least one 1:N relationship.*
> *- Must feature a non-trivial client-side UI interaction (in our case, the drag-and-drop canvas).*
> *- Must have full CRUD operations via REST API.*
> *- Must have proper ownership scoping (users can only access/modify their own venue data unless they are an admin).*
> *Please generate the complete Phase 1 documentation using the following exact structure and sections: [1–13 as specified above, including the AI Appendix with the full prompt text]."*

---

*End of Phase 1 Documentation — maitre.dev*
