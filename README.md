<h1 align="center">BrandForge Frontend</h1>

<div align="center">

> The single-page **React** client for **BrandForge** — a platform that connects **brands** and **content creators** through structured campaigns, contests, and submissions.

![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-7-CA4245?style=flat-square&logo=reactrouter&logoColor=white)
![Axios](https://img.shields.io/badge/Axios-1.x-5A29E4?style=flat-square&logo=axios&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat-square&logo=vercel&logoColor=white)

</div>

This repository contains the **frontend only**. It is a Vite-powered React SPA that talks to the BrandForge REST API over HTTPS using cookie-based JWT authentication. The backend lives in a separate repository (`BrandForge_backend`) deployed on Render at `https://brandforge-backend.onrender.com`.

<img width="1622" height="902" alt="image" src="https://github.com/user-attachments/assets/edf2a494-2ba8-4642-a04a-0a111ef2b9ff" />

---

<h2 align="center">Table of Contents</h2>

- [Overview](#overview)
- [Feature Highlights](#feature-highlights)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Application Bootstrap](#application-bootstrap)
- [Routing & Guards](#routing--guards)
- [Project Structure](#project-structure)
- [Component Architecture](#component-architecture)
- [Authentication Flow](#authentication-flow)
- [Admin Dashboard](#admin-dashboard)
- [Brand Dashboard](#brand-dashboard)
- [Creator Dashboard](#creator-dashboard)
- [API Integration Map](#api-integration-map)
- [Client-Side Validation](#client-side-validation)
- [Cold-Start Resilience](#cold-start-resilience)
- [Winner Selection Flow](#winner-selection-flow)
- [Styling & Design System](#styling--design-system)
- [Codebase Distribution](#codebase-distribution)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Conventions](#conventions)
- [Known Limitations](#known-limitations)
- [Roadmap](#roadmap)
- [Contributing](#contributing)

---

<h2 align="center">Overview</h2>

BrandForge's frontend is a **role-aware SPA**: after login, every user lands on one of three bespoke dashboards —

- **Brands** launch campaign briefs (title, description, reward, deadline), watch them go through admin approval, review creator pitches, and crown winners.
- **Creators** browse approved campaign briefs, submit content links, and track their wins and earnings.
- **Admins** review the queue of pending campaigns and approve them into the public marketplace.

The app is deliberately lightweight — **no state-management library, no TypeScript**. It relies on React 19 function components with hooks, one shared axios instance, one AuthContext, and a hybrid styling layer: **Tailwind CSS 4** wired in through Vite, plus a ~4,000-line hand-written **purple/white glassmorphic stylesheet**.

<h3 align="center">At a Glance</h3>

| Property | Value |
| --- | --- |
| App type | Single-page application (SPA) |
| Entry point | `src/main.jsx` |
| UI library | React 19 (function components + hooks only) |
| Routing | React Router 7 (`BrowserRouter`) |
| HTTP client | Single axios instance with `withCredentials: true` |
| Authentication | JWT in `httpOnly` cookie — never touched by JS |
| State management | Local `useState` + one `AuthContext` |
| Styling | Tailwind CSS 4 (`@tailwindcss/vite`) + hand-written glassmorphic CSS |
| Notifications | react-hot-toast (top-right, white theme, 3.5s auto-close) |
| Celebrations | react-confetti (winner selection) |
| Dev server | `http://localhost:5173` (Vite default) |
| Production | Vercel — `https://brand-forge-frontend.vercel.app` |
| API base URL | `https://brandforge-backend.onrender.com` (Render, free tier) |

---

<h2 align="center">Feature Highlights</h2>

<h3 align="center">Authentication &amp; Session</h3>
- Split-screen Login/Register with a glass showcase panel (metric pills + testimonial)
- **Quick Test Login** buttons that autofill seeded demo accounts for all three roles
- Real-time, field-level form validation with `touched` / `error` state and valid/invalid styling
- Registration with tailored **Creator / Brand role cards**, a live password-strength meter, and a terms checkbox — admin is deliberately not offered in the UI
- Session restore on every reload via a single-shot `GET /api/auth/me`, with a branded spinner while it resolves
- Logout confirmation modal ("Are you sure you want to log out?") with Escape-key dismiss

<h3 align="center">Role Dashboards</h3>
- **Admin** — moderation explorer with search, sort (newest / highest reward / urgent deadline), and pending-vs-all pills; executive metrics bar; one-click approval; inspector modal
- **Brand** — campaign brief launcher modal with full client-side validation, metrics bar, searchable campaign explorer, submissions view with a winner spotlight and 5-second confetti celebration
- **Creator** — open-opportunity / pitch / win / earnings metrics, marketplace explorer with filter pills, brief inspector, and a pitch modal with URL validation and content guidelines

<h3 align="center">Platform UX</h3>
- Role-based redirect from `/` straight to the correct dashboard
- Route guards that trust `AuthContext` — unauthenticated or wrong-role users go to `/login` before any dashboard renders
- Toast notifications (`react-hot-toast`) for every API success/failure
- Free-tier cold-start handling: the 12s axios timeout turns a sleeping Render instance into a fast logged-out state instead of a hung UI
- Role-aware navbar with a profile capsule, initials avatar, and color-coded role pill
- Fully responsive layouts with mobile breakpoints

---

<h2 align="center">Tech Stack</h2>

| Layer | Technology | Version | Purpose |
| --- | --- | --- | --- |
| UI library | React + React DOM | `^19.2.0` | Component rendering, hooks |
| Bundler / dev server | Vite | `^7.2.4` | Dev server with HMR, production builds |
| Vite plugin | @vitejs/plugin-react | `^5.1.1` | JSX transform + Fast Refresh |
| Routing | react-router-dom | `^7.11.0` | `BrowserRouter`, `Routes`, `Navigate` |
| HTTP client | axios | `^1.13.2` | API calls with cookie credentials; 12s timeout |
| Notifications | react-hot-toast | `^2.4.1` | Success/error toasts (`<Toaster position="top-right">`, 3.5s) |
| Celebration | react-confetti | `^6.4.0` | Confetti burst on winner selection |
| Styling | Tailwind CSS 4 | `^4.1.18` | Utility classes, `@import "tailwindcss"` in `global.css` |
| Styling (build) | @tailwindcss/vite | `^4.1.18` | Tailwind Vite plugin |
| Custom CSS | Vanilla CSS | — | Hand-written glassmorphic theme in one global stylesheet |
| Linting | ESLint (flat config) | `^9.39.1` | `eslint-plugin-react-hooks`, `react-refresh` |
| Language | JavaScript (ES modules) | — | No TypeScript |
| Deployment | Vercel | — | Static hosting with SPA rewrites |

> There is no test framework configured. `npm run lint` is the only static check. The older `react-toastify` (`^11.0.5`) is still listed in `package.json` but is no longer imported anywhere — all notifications go through `react-hot-toast`.

---

<h2 align="center">System Architecture</h2>

```mermaid
flowchart LR
    subgraph BROWSER["User's Browser"]
        direction TB
        R["React 19 SPA<br/>routes · dashboards · forms"]
        AC["AuthContext<br/>single-shot session restore"]
        AX["axios instance<br/>withCredentials: true"]
        R --> AC
        R --> AX
        AC --> AX
    end

    CDN[("Vercel CDN<br/>static build + SPA rewrites")]
    API["BrandForge Express API<br/>Render · free tier"]
    DB[("MongoDB Atlas")]

    CDN -->|"index.html + JS bundle"| BROWSER
    AX -->|"HTTPS · JSON · JWT cookie"| API
    API -->|"queries"| DB
```

**Key ideas**

- The SPA is served as static files from Vercel; all data is fetched from the Render-hosted API at runtime.
- Authentication rides entirely on the `token` **httpOnly cookie** — the frontend never reads, stores, or transmits the JWT itself; axios simply sends `withCredentials: true`.
- Every page-level component owns its local state; the only shared state is the authenticated `user` in `AuthContext`.

---

<h2 align="center">Application Bootstrap</h2>

```mermaid
flowchart TD
    MAIN["main.jsx<br/>ReactDOM.createRoot"] --> BR["BrowserRouter"]
    BR --> AP["AuthProvider"]
    MAIN --> TOASTER["react-hot-toast Toaster<br/>top-right · 3.5s"]

    AP --> FU{"GET /api/auth/me<br/>single attempt on mount"}
    FU -- "200 OK" --> USER["user = profile<br/>role = brand | creator | admin"]
    FU -- "401 · network error<br/>12s timeout" --> NULL["user = null"]
    USER & NULL --> LD["loading = false"]

    AP -. "while loading" .-> LS["LoadingSpinner<br/>'Checking authentication...'"]

    LD --> APP["App renders"]
    APP --> NAV["Navbar"]
    APP --> ROUTES["Routes<br/>/ · /login · /register · /signup<br/>/admin · /brand · /creator · *"]
```

Session restore is a **single-shot** `GET /api/auth/me` guarded by an `isMounted` flag — there is **no retry loop**. If the free-tier Render instance is asleep, axios aborts after its **12-second timeout** and the app falls back to the logged-out state, showing the login page instead of hanging on a splash screen. The branded `LoadingSpinner` covers the initial check; dashboard fetches that hit a cold start surface a toast and the user retries manually.

---

<h2 align="center">Routing &amp; Guards</h2>

<h3 align="center">Route Table</h3>

| Path | Component | Access |
| --- | --- | --- |
| `/` | `HomeRedirect` | Redirects by role (or to `/login`) |
| `/login` | `Login` | Public |
| `/register` | `Register` | Public |
| `/signup` | `Register` | Public alias of `/register` |
| `/admin` | `AdminDashboard` | `ProtectedRoute role="admin"` |
| `/brand` | `BrandDashboard` | `ProtectedRoute role="brand"` |
| `/creator` | `CreatorDashboard` | `ProtectedRoute role="creator"` |
| `*` | — | `Navigate` back to `/` (then role redirect) |

<h3 align="center">Guard Decision Flow</h3>

```mermaid
flowchart TD
    NAV["User navigates to /brand"] --> PR["ProtectedRoute role='brand'"]
    PR --> LD{"AuthContext.loading?"}
    LD -- "yes" --> SPIN["LoadingSpinner<br/>'Verifying session...'"]
    LD -- "no" --> AUTH{"user?"}
    AUTH -- "null" --> DENY["Navigate to /login"]
    AUTH -- "present" --> ROLE{"user.role === 'brand'?"}
    ROLE -- "no" --> DENY
    ROLE -- "yes" --> CHILD["render BrandDashboard"]
```

`ProtectedRoute` is a pure context consumer: it never calls the API itself, it only reads `user` and `loading` from `AuthContext`, which performs the single `/api/auth/me` request. `HomeRedirect` shows the same spinner (`"Checking authentication..."`) until loading settles, then switches on role — admin → `/admin`, brand → `/brand`, creator → `/creator`, otherwise → `/login`. Unknown paths hit the catch-all and re-enter that same redirect.

---

<h2 align="center">Project Structure</h2>

```text
BrandForge_Frontend/
├── index.html                    # Shell: favicon, viewport, #root mount
├── vercel.json                   # SPA rewrite: all routes → /index.html
├── vite.config.js                # Vite + React + Tailwind plugins
├── eslint.config.js              # ESLint 9 flat config
├── public/                       # favicon.png, logo.png, vite.svg
└── src/
    ├── main.jsx                  # Bootstrap: BrowserRouter → AuthProvider → App + Toaster
    ├── App.jsx                   # Route table, /signup alias, catch-all, role home redirect
    ├── api/
    │   └── axios.js              # Single axios instance (baseURL + credentials + 12s timeout)
    ├── auth/
    │   ├── Login.jsx             # Split-screen login + demo quick-fill + validation
    │   └── Register.jsx          # Registration: role cards, password strength, validation
    ├── components/
    │   ├── Navbar.jsx            # Brand bar, profile capsule, logout modal
    │   ├── ProtectedRoute.jsx    # Role guard backed by AuthContext (no API call)
    │   ├── LoadingSpinner.jsx    # Branded spinner for session checks
    │   └── ServerLoadingScreen.jsx # Legacy warm-up screen — no longer imported
    ├── context/
    │   └── AuthContext.jsx       # user state, single-shot session restore, logout
    ├── pages/
    │   ├── AdminDashboard.jsx    # Pending campaign review + approval
    │   ├── BrandDashboard.jsx    # Campaign creation, submissions, winner selection
    │   └── CreatorDashboard.jsx  # Brief marketplace, submissions, wins & earnings
    ├── utils/
    │   └── creatorPrizes.js      # Prize parsing, currency totals, win→campaign resolution
    └── styles/
        └── global.css            # Tailwind import + theme variables, navbar, auth, shared UI
```

---

<h2 align="center">Component Architecture</h2>

```mermaid
flowchart TD
    MAIN["main.jsx"] --> AP["AuthProvider<br/>(AuthContext)"]
    MAIN --> TOAST["react-hot-toast Toaster"]
    AP --> APP["App"]

    APP --> HR["HomeRedirect"]
    APP --> LOGIN["Login"]
    APP --> REGISTER["Register<br/>(/register · /signup)"]

    APP --> PR1["ProtectedRoute admin"] --> ADMIN["AdminDashboard"]
    APP --> PR2["ProtectedRoute brand"] --> BRAND["BrandDashboard"]
    APP --> PR3["ProtectedRoute creator"] --> CREATOR["CreatorDashboard"]

    APP --> NAV["Navbar"]
    AP -. "loading" .-> LS["LoadingSpinner"]
    HR -. "loading" .-> LS
    PR1 & PR2 & PR3 -. "loading" .-> LS

    CREATOR --> CP["creatorPrizes.js<br/>prizeForWin · titleForWin · totalWonSummary"]
    AP & LOGIN & REGISTER & BRAND & ADMIN & CREATOR --> API["api/axios.js"]
    API --> BE["BrandForge API on Render"]
```

`LoadingSpinner` (a 34-line branded spinner with a "B" core and dot bar) is the only loading UI still referenced — `ServerLoadingScreen` remains on disk but nothing imports it. `Navbar` is display-only: it reads the user from context and renders the profile capsule, with no data fetching of its own.

<h3 align="center">Navbar</h3>

| Element | Behavior |
| --- | --- |
| Logo badge | SVG stack icon + "BrandForge" / "Collab Hub" wordmark; links to the role's dashboard |
| Guest actions | Sign In link + Get Started CTA when no user is signed in |
| Profile capsule | Initials avatar, display name (falls back to the email prefix), role pill, connection dot |
| Role pill | 👑 Admin · 🏢 Brand · 🎨 Creator, each with its own color treatment |
| Logout | Opens the confirmation modal; Escape closes it; the button shows "Logging out..." until the request settles |

---

<h2 align="center">Authentication Flow</h2>

```mermaid
sequenceDiagram
    autonumber
    participant U as User
    participant SPA as React SPA
    participant API as Express API (Render)

    Note over U,SPA: Registration
    U->>SPA: Name, email, password + role card (creator | brand)
    SPA->>SPA: Field validation · strength meter · terms checkbox
    SPA->>API: POST /api/auth/register
    API-->>SPA: 201 Created
    SPA-->>U: Toast + redirect to /login

    Note over U,SPA: Login (or Quick Test Login)
    U->>SPA: Email + password (demo buttons autofill a seeded account)
    SPA->>API: POST /api/auth/login
    API-->>SPA: Set-Cookie: token (httpOnly, Secure, SameSite=None)
    SPA->>API: GET /api/auth/me
    API-->>SPA: {id, name, email, role}
    SPA->>SPA: setUser(me) in AuthContext
    SPA-->>U: Personalized toast + redirect by role

    Note over U,SPA: Session restore (every reload)
    SPA->>API: GET /api/auth/me (cookie sent automatically)
    alt server awake
        API-->>SPA: 200 profile → user restored
    else 401 / network error / 12s timeout
        SPA-->>U: Logged-out state → /login
    end

    Note over U,SPA: Logout
    U->>SPA: Logout → confirmation modal
    SPA->>API: POST /api/auth/logout (clears cookie)
    SPA->>SPA: setUser(null) → redirect /login
```

**Notes**

- The JWT never appears in JS — the browser stores it as an `httpOnly` cookie and axios attaches it via `withCredentials: true`.
- Registration offers **Creator** and **Brand** only; admin accounts are not creatable from the UI.
- **Quick Test Login** fills `creator@brandforge.io`, `brand@brandforge.io`, or `admin@brandforge.io` — all with password `Password123!` (seeded demo accounts).
- Login performs a follow-up `/api/auth/me` call so the context holds the full profile, not just the login response, then shows a personalized toast and redirects by role.
- Logout tolerates network failure: the local session is cleared and the user is returned to `/login` even if the API call fails.

---

<h2 align="center">Admin Dashboard</h2>

**Route:** `/admin` · **Data:** `GET /api/campaigns/pending` + `GET /api/campaigns`

| UI Section | Behavior |
| --- | --- |
| Control header | "Admin Oversight & Moderation" banner with a **Refresh Queue** button |
| Metrics bar | Pending Approval · Verified & Live · Pending Reward Pool (₹ sum across the queue) · System Health |
| Moderation explorer | Search by title / description / reward; sort **Newest First / Highest Reward / Urgent Deadline**; filter pills for **Pending** vs **All Campaigns** |
| Campaign cards | Title, truncated description, offered reward, deadline, status badge — open the inspector or approve inline |
| Approve & Publish | `PUT /api/campaigns/:id/approve` → toast, card removed optimistically from the pending queue, counts update |
| Inspector modal | Reward Pool, Deadline, Moderation Status + the full description |
| Empty state | "Queue is completely clear!" (pending) or "No campaigns found" (all) |

---

<h2 align="center">Brand Dashboard</h2>

**Route:** `/brand` · **Data:** `GET /api/campaigns`, `GET /api/submissions/campaign/:id`, `PUT /api/submissions/:id/winner`, `POST /api/campaigns`

<h3 align="center">Metrics Bar</h3>

Four stat cards: **Total Campaigns**, **Live & Approved**, **Pending Review**, and an **Instant Action** card that opens the campaign launcher.

<h3 align="center">Campaign Brief Launcher</h3>

Creation happens in a modal ("New Launch" badge) opened from the header or the Instant Action card.

| Field | Client-side rules |
| --- | --- |
| `title` | Required; 5–100 characters after trim |
| `description` | Required; 20–2,000 characters after trim |
| `reward` | Required; parsed numeric value ≥ **₹500** |
| `deadline` | Required; date input with `min` = tomorrow; must be tomorrow or later |

Submit → `POST /api/campaigns` → toast "Campaign created successfully! (Pending admin review) 🚀" → form reset → list refresh.

<h3 align="center">Campaign Explorer</h3>

Search across titles and descriptions, plus status pills for **All / Approved / Pending**. Each card shows the offer, deadline, status badge, and a **Submissions** action.

<h3 align="center">Submissions &amp; Winner Selection</h3>

1. "Submissions" on an owned campaign → `GET /api/submissions/campaign/:id` swaps the explorer for a detail view with a **"Back to All Campaigns"** breadcrumb
2. If a winner already exists, a **Winner Spotlight** banner shows the creator's name, "View Winning Content ↗", and a **Celebrate 🎉** button
3. The submissions grid lists every pitch — creator name, avatar initial, content link, and status (Reviewing / 🏆 Winner)
4. "Select Winner" → `PUT /api/submissions/:id/winner` → toast "🏆 Winner crowned successfully!" → spotlight replaces the grid and a **5-second confetti burst** plays (`react-confetti`)

---

<h2 align="center">Creator Dashboard</h2>

**Route:** `/creator` · **Data:** `GET /api/campaigns`, `GET /api/submissions/mine`, `GET /api/submissions/my-wins`, `POST /api/submissions`

| UI Section | Behavior |
| --- | --- |
| Metrics bar | **Open Opportunities** (approved campaigns not yet pitched), **Pitches Submitted**, **Crowned Wins**, **Total Earnings** |
| Wins spotlight | Banner when `wins.length > 0`, summing awarded earnings with a **🏆 Celebrate Wins (n)** toggle |
| Campaign marketplace | Approved campaigns with search + filter pills **All / Open to Pitch (n) / Submitted / Wins**; already-pitched cards show a green **Submitted** badge |
| Brief modal | Full campaign brief (reward, deadline, description) with a **Submit Pitch Now 🚀** action |
| Pitch modal | Content-URL field with inline validation, plus submission guidelines (1080p, stable footage, audio quality, brief match, public link) → `POST /api/submissions` |

Earnings math lives in [`src/utils/creatorPrizes.js`](src/utils/creatorPrizes.js): it resolves a win's campaign reference against the campaign list (falls back when the API returns an unpopulated id), parses numeric rewards (₹ prefix, `en-IN` locale formatting), and either sums numeric prizes or joins non-numeric ones with `+`. The metrics bar and wins spotlight both feed from the same helper.

---

<h2 align="center">API Integration Map</h2>

The frontend consumes **13 of the backend's 24 endpoints**. Dashboard statistics are computed client-side from list endpoints — the backend `/api/analytics/*` routes are currently unused.

```mermaid
flowchart LR
    subgraph FE["Frontend components"]
        RC["Register"]
        LG["Login"]
        ACX["AuthContext"]
        NB["Navbar"]
        AD["AdminDashboard"]
        BD["BrandDashboard"]
        CD["CreatorDashboard"]
    end

    subgraph API["BrandForge API endpoints"]
        E1["POST /api/auth/register"]
        E2["POST /api/auth/login"]
        E3["GET /api/auth/me"]
        E4["POST /api/auth/logout"]
        E5["GET /api/campaigns/pending"]
        E6["GET /api/campaigns"]
        E7["PUT /api/campaigns/:id/approve"]
        E8["POST /api/campaigns"]
        E9["GET /api/submissions/campaign/:id"]
        E10["PUT /api/submissions/:id/winner"]
        E11["POST /api/submissions"]
        E12["GET /api/submissions/mine"]
        E13["GET /api/submissions/my-wins"]
    end

    RC --> E1
    LG --> E2
    LG --> E3
    ACX --> E3
    ACX --> E4
    NB --> E6
    NB --> E13
    AD --> E5
    AD --> E6
    AD --> E7
    BD --> E6
    BD --> E8
    BD --> E9
    BD --> E10
    CD --> E6
    CD --> E11
    CD --> E12
    CD --> E13
```

<h3 align="center">Endpoint Usage by Role</h3>

| Endpoint | Register/Login | Navbar | Admin | Brand | Creator |
| --- | :---: | :---: | :---: | :---: | :---: |
| `POST /api/auth/register` | ✓ | | | | |
| `POST /api/auth/login` | ✓ | | | | |
| `GET /api/auth/me` | ✓ (Login, ProtectedRoute, AuthContext) | | | | |
| `POST /api/auth/logout` | | ✓ (via AuthContext) | | | |
| `GET /api/campaigns` | | ✓ | ✓ | ✓ | ✓ |
| `GET /api/campaigns/pending` | | | ✓ | | |
| `PUT /api/campaigns/:id/approve` | | | ✓ | | |
| `POST /api/campaigns` | | | | ✓ | |
| `GET /api/submissions/campaign/:id` | | | | ✓ | |
| `PUT /api/submissions/:id/winner` | | | | ✓ | |
| `POST /api/submissions` | | | | | ✓ |
| `GET /api/submissions/mine` | | | | | ✓ |
| `GET /api/submissions/my-wins` | | ✓ | | | ✓ |

> Unused backend capabilities: `PUT /api/auth/profile`, `PUT /api/auth/password`, `PUT /api/campaigns/:id` (edit), `PUT /api/campaigns/:id/complete`, `PUT /api/campaigns/:id/reject`, `DELETE /api/campaigns/:id`, `PUT /api/submissions/:id/review`, and all three `/api/analytics/*` routes.

---

<h2 align="center">Client-Side Validation</h2>

All forms follow the same **touched/error pattern**: a field validates only after first blur; from then on it re-validates on every keystroke; submitting re-validates every field and refuses to advance while any error remains. Submit buttons disable while a request is in flight.

```mermaid
flowchart TD
    IN["User types in field"] --> CH{"field touched?"}
    CH -- "no" --> OK["no error shown yet"]
    CH -- "yes" --> V["run validator(field)"]
    V --> E{"error?"}
    E -- "yes" --> RED["is-invalid styling<br/>inline message · submit blocked"]
    E -- "no" --> GRN["is-valid styling"]
    BLUR["onBlur"] --> T["mark touched"] --> V
    SUB["onSubmit"] --> A["validate all fields"] --> E
```

<h3 align="center">Validation Matrix</h3>

| Form | Field | Rule |
| --- | --- | --- |
| Login | email | Required; regex `^[^\s@]+@[^\s@]+\.[^\s@]+$` |
| Login | password | Required; ≥ 6 characters |
| Register | name | Required; 2–50 characters after trim; letters, spaces, `.`, `'`, `-` only |
| Register | email | Required; same email regex |
| Register | password | Required; ≥ 6 characters; must mix letters with a number or symbol; feeds the strength meter |
| Register | confirmPassword | Required; must match password; re-checked live when the password changes |
| Register | role | Role cards: `creator` \| `brand` (no admin) |
| Register | agreeTerms | Must be checked before submit (amber warning toast otherwise) |
| Brand campaign | title | Required; 5–100 characters after trim |
| Brand campaign | description | Required; 20–2,000 characters after trim |
| Brand campaign | reward | Required; parsed numeric value ≥ **₹500** |
| Brand campaign | deadline | Required; tomorrow or later (`min` attribute blocks past dates in the picker) |
| Creator submit | contentUrl | Required; must start with `http://` or `https://` and its hostname must contain a dot |

<h3 align="center">Frontend vs Backend Bounds</h3>

The client applies its own rules — deliberately stricter or more structured than the API schema; the backend remains the source of truth:

| Field | Frontend | Backend |
| --- | --- | --- |
| Campaign title | 5–100 chars | 3–150 chars |
| Campaign description | 20–2,000 chars | 10–3000 chars |
| Campaign deadline | tomorrow+ | ≥ 1 hour ahead |
| Password | ≥ 6 chars + letter + number/symbol | ≥ 6 chars + one letter + one number |
| Submission URL | `http(s)://` + dotted hostname | server re-validates the format |

---

<h2 align="center">Cold-Start Resilience</h2>

The backend runs on Render's free tier, which spins down after ~15 minutes of inactivity and can take 20–50 seconds to answer its first request. The current build handles this with **time boxing rather than polling** — every request is capped by axios at 12 seconds, and session restore makes exactly one attempt:

```mermaid
flowchart TD
    LOAD["App loads · route guard"] --> REQ["GET /api/auth/me<br/>(single attempt)"]
    REQ --> RES{"Response?"}
    RES -- "200" --> LIVE["Session restored · render dashboard"]
    RES -- "401" --> GUEST["user = null"]
    RES -- "network error / 5xx<br/>/ 12s timeout" --> GUEST
    LOAD -. "while loading" .-> SPIN["LoadingSpinner<br/>'Checking authentication...'"]
    GUEST --> LOGIN["HomeRedirect → /login"]
```

Earlier versions polled `/api/auth/me` up to 15 times × 2s behind a full-screen "warming up the server" splash. That has been removed: the app now resolves to the logged-out state quickly, and if the API wakes up afterwards the login form simply works. The trade-off is that a sleeping server during a **dashboard** fetch produces an error toast instead of an automatic retry — the user refreshes or resubmits (tracked in [Known Limitations](#known-limitations)).

---

<h2 align="center">Winner Selection Flow</h2>

The flagship end-to-end interaction across all three roles:

```mermaid
sequenceDiagram
    autonumber
    participant Ad as Admin
    participant Br as Brand
    participant Cr as Creator
    participant SPA as React SPA
    participant API as Express API

    Br->>SPA: Launch campaign brief (validated form)
    SPA->>API: POST /api/campaigns
    API-->>SPA: 201 (status: pending)

    Ad->>SPA: Open /admin
    SPA->>API: GET /api/campaigns/pending
    Ad->>SPA: Approve
    SPA->>API: PUT /api/campaigns/:id/approve
    API-->>SPA: 200 (status: approved)

    Cr->>SPA: Browse briefs → Submit Pitch
    SPA->>API: POST /api/submissions {campaignId, contentUrl}
    API-->>SPA: 201 (status: pending)

    Br->>SPA: View Submissions
    SPA->>API: GET /api/submissions/campaign/:id
    Br->>SPA: Select Winner
    SPA->>API: PUT /api/submissions/:id/winner
    API-->>SPA: 200 (status: winner)
    SPA-->>Br: Winner spotlight + 5s confetti

    Cr->>SPA: Reload /creator
    SPA->>API: GET /api/submissions/my-wins
    SPA-->>Cr: Win card, Crowned Wins + Total Earnings metrics
```

---

<h2 align="center">Styling &amp; Design System</h2>

A single **purple / white glass** design system (the stylesheet's own header reads "PURPLE, WHITE & BLACK"), expressed in two layers:

1. **Global stylesheet** — [`src/styles/global.css`](src/styles/global.css) (~4,018 lines) beginning with `@import "tailwindcss"`: design tokens, reset, navbar, split-screen auth layout, dashboard grids, modals, and keyframe animations.
2. **Tailwind CSS 4** — wired through `@tailwindcss/vite` in [`vite.config.js`](vite.config.js). Utilities are available everywhere but used sparingly; components rely on semantic class names for the heavy lifting.

There are **no inline `<style>` blocks** left in any component — all styling now lives in the global sheet.

| Design token | Value | Role |
| --- | --- | --- |
| `--purple`, `--purple-dark`, `--purple-light` | `#8b5cf6`, `#7c3aed`, `#a78bfa` | Primary accent, gradients, links |
| `--black`, `--white` | `#0a0a0a`, `#ffffff` | Text and surfaces |
| `--light-bg`, `--card-bg` | `#f8f9fa`, `#ffffff` | Page and card backgrounds |
| `--text`, `--text-light` | `#1f2937`, `#6b7280` | Body and muted text |
| `--border` | `#e5e7eb` | Hairline borders |

**Signature elements**

- **Inter** as the single typeface (system fallbacks); `en-IN` formatting for rupee amounts
- Purple→indigo gradient actions (`#8b5cf6 → #7c3aed → #4f46e5`) with hover lift
- Frosted white navbar: `rgba(255,255,255,0.88)` + `backdrop-filter: blur(16px)`
- Fixed **ambient glow blobs** (blurred purple radial gradients with 10–12s float loops) and a dotted mesh overlay behind auth and dashboard pages
- Dark indigo/violet **showcase panels** paired with white form panels in the split-screen auth card
- Metric stat cards with status badges ("Needs Action", "Live", "Escrow Pool"), winner spotlight with a glow pulse, modal pop-in animations, and a form-error shake
- Scrollbars are hidden globally (scrolling still works) for a cleaner surface
- Responsive breakpoints at 1024, 920, 900, 768, 600, and 480 px

---

<h2 align="center">Codebase Distribution</h2>

~**6,200 lines** of source across 14 files. The dashboards are the heart of the app — the three page components plus their inline styles account for roughly half the codebase.

```mermaid
pie showData
    title Source lines by area
    "Pages (3 dashboards)" : 3074
    "Global stylesheet" : 2170
    "Auth screens" : 587
    "Shared components" : 201
    "Core (App, main, context, api)" : 132
    "Utils (creatorPrizes)" : 60
```

```mermaid
pie showData
    title Lines per dashboard page
    "BrandDashboard.jsx" : 1270
    "CreatorDashboard.jsx" : 1095
    "AdminDashboard.jsx" : 709
```

> Note: each dashboard's inline `<style>` block is included in its line count — the rendered UI plus `global.css` make CSS roughly half the project.

---

<h2 align="center">Getting Started</h2>

<h3 align="center">Prerequisites</h3>

- **Node.js 20.19+** (or 22.12+) — required by Vite 7
- The BrandForge backend running locally (`http://localhost:5000`) or reachable at its Render URL — see the backend repository's README for setup

<h3 align="center">Installation</h3>

```bash
# 1. Clone the repository
git clone <repository-url>
cd BrandForge_Frontend

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

The app runs at `http://localhost:5173`.

> **Local API note:** the axios base URL is hardcoded to the deployed backend. To develop against a local backend, change `baseURL` in [`src/api/axios.js`](src/api/axios.js) to `http://localhost:5000` — and make sure the backend's CORS allowlist already includes `http://localhost:5173` (it does).

<h3 align="center">Available Scripts</h3>

| Command | Description |
| --- | --- |
| `npm run dev` | Vite dev server with Fast Refresh |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | ESLint over the project |

---

<h2 align="center">Configuration</h2>

There are **no environment variables** in use. All runtime configuration lives in [`src/api/axios.js`](src/api/axios.js):

```js
const api = axios.create({
  baseURL: "https://brandforge-backend.onrender.com",
  withCredentials: true, // sends the httpOnly JWT cookie
  timeout: 12000, // 12s cap — a cold Render instance surfaces as a toast
});
```

Changing environments means editing the `baseURL` line (see [Roadmap](#roadmap) for the planned `VITE_API_URL` migration). The 12-second timeout is what makes Render's free-tier cold starts fail fast into a toast instead of hanging the UI indefinitely.

---

<h2 align="center">Deployment</h2>

The frontend deploys to **Vercel** as a static SPA.

1. Import the repository into Vercel — the Vite preset is auto-detected (`npm run build` → `dist/`).
2. [`vercel.json`](vercel.json) rewrites every path to `/index.html` so React Router owns client-side navigation:

   ```json
   { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
   ```

3. The live origin (`https://brand-forge-frontend.vercel.app`) is already on the backend's CORS allowlist.
4. HTTPS is mandatory: the auth cookie is `Secure; SameSite=None`, which browsers only accept cross-site over HTTPS. (localhost is treated as a secure context.)

---

<h2 align="center">Conventions</h2>

- **Components** — one default-exported function component per file; hooks only; no classes.
- **Data fetching** — always through the shared `api` instance; never raw `fetch`; errors surface as toasts with `err.response?.data?.message` preferred.
- **Validation** — the touched/error pattern (see [Client-Side Validation](#client-side-validation)); every form disables its submit button while invalid.
- **Styling** — global.css for shared chrome; namespaced inline `<style>` blocks with a per-dashboard prefix for dashboard themes; class names follow the prefix (`b-`, `c-`, `admin-`).
- **IDs** — user and object ids can arrive as `_id`, `id`, or populated objects; use the `getIdValue` / `getCampaignIdFromRef` coercion helpers rather than assuming a shape.
- **Dates & money** — `toLocaleDateString` for deadlines; `toLocaleString("en-IN")` for rupee amounts.

---

<h2 align="center">Known Limitations</h2>

1. **API base URL is hardcoded** in `src/api/axios.js` — switching between local and deployed backends requires a code edit.
2. **Dashboard stats are client-computed.** The backend's `/api/analytics/*` endpoints are unused; win counts and campaign totals derive from list endpoints.
3. **Brand "Remaining Budget" is cosmetic** — a ₹50,000 baseline minus 3% commission per campaign, with no backend wallet to back it.
4. **Validation lives inside each component** — Login, Register, and the campaign form duplicate similar logic instead of sharing validators.
5. **Cold-start retry is fixed** at 15 × 2s and applies only to `/api/auth/me`; other dashboards' initial fetches can fail with an error toast during a cold start.
6. **Campaign editing, rejection, completion, deletion, and submission review/feedback have no UI** — those backend endpoints are unexposed.
7. **No TypeScript, no test suite, no CI** — `npm run lint` is the only static check.
8. **Inline `<style>` blocks bloat the page components** (~600–900 lines each); they ship with the JS bundle and are re-parsed per mount.

---

<h2 align="center">Roadmap</h2>

- [ ] Move the API base URL to a `VITE_API_URL` environment variable
- [ ] Extract a shared form-validation utility (reusable touched/error pattern)
- [ ] Surface the backend analytics endpoints in the dashboards
- [ ] Add submission review/feedback UI for brands
- [ ] Add campaign edit/complete/reject actions to the brand and admin dashboards
- [ ] Extract dashboard inline styles into CSS modules
- [ ] Add an error boundary around route outlets
- [ ] Add Playwright/Vitest smoke tests for auth and the three dashboards
- [ ] Toast-driven retry for cold-start failures on dashboard fetches

---

<h2 align="center">Contributing</h2>

1. Branch from `main` using a descriptive name (e.g., `validations`, `feat/xyz`).
2. Follow the existing commit style: `feat(scope): summary`, `fix(scope): summary`, `style(scope): summary`.
3. Keep the touched/error validation pattern for any new form.
4. Route all HTTP through the shared axios instance.
5. Run `npm run lint` before opening a pull request.
