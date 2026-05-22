<div align="center">

# Jain Autocars

### A pre-owned car dealership platform with a custom editorial design system.

**[Live site](https://jainautocars.in)** &nbsp;·&nbsp; React 19 &nbsp;·&nbsp; Firebase &nbsp;·&nbsp; Tailwind &nbsp;·&nbsp; Framer Motion

---

</div>

End-to-end production app for a real Mysore-based dealership: a browsable inventory of 20+ live listings, a customer-facing inquiry / test-drive / sell-your-car funnel, a moderated testimonial system, and a full admin back-office for inventory, leads, bookings, and showroom settings — all powered by a single Firestore back-end and deployed on Firebase Hosting.

The interface is built on a custom *editorial* design language — warm ivory, deep ink, champagne accents, an Instrument-Serif display face, mono eyebrows — rather than a stock dashboard kit. The intent was to make a used-car platform feel closer to a printed motoring magazine than a classifieds site.

<br>

## ✨ Highlights

| | |
| :-- | :-- |
| **Editorial design system** | Hand-rolled token set in `tailwind.config.js` — `ivory` / `ink` / `champagne` palette, Instrument Serif display + Geist Mono eyebrows, custom `shadow-editorial` and `tracking-tightest`. Applied consistently across 15+ pages. |
| **Public inventory** | Firestore-backed listings with multi-facet filtering (price, km, make, body, fuel, transmission, owners, year), live faceted counts, debounced URL-synced search, pagination, comparison drawer (up to 3), local favorites, recently-viewed memory, and an Instagram-style horizontal-scroll rail for featured cars. |
| **Lead capture suite** | Four contextual forms — General inquiry, Test-drive booking, Sell-your-car valuation, and Offer/EMI modal — all with honeypot anti-spam, chip-style type pickers, and direct WhatsApp / `tel:` / `mailto:` deep-linking. |
| **Admin back-office** | Six-screen editorial admin — Dashboard with live KPIs and an SVG activity chart, Cars with bulk operations (`writeBatch`), Inquiries / Test-drives / Testimonials moderation queues with optimistic updates, and a Showroom-settings editor with live preview. |
| **Image pipeline** | Drag-to-reorder photo dropzone with Cloudinary delivery + Firebase Storage fallback, transformed on-the-fly to WebP. |
| **SEO & performance** | Per-route meta via `react-helmet`, programmatically generated `sitemap.xml`, semantic HTML, deferred image loading, and Firebase Hosting CDN-edged rewrites. |
| **Security model** | Firestore rules enforce public-read / auth-write boundaries per collection; testimonials gate on an `approved` flag; admin routes wrapped in `<ProtectedRoute>` against Firebase Auth. |

<br>

## 🛠 Tech stack

**Front-end**
- **React 19** with `react-router-dom@7` and `react-helmet` for routing + per-page SEO
- **Tailwind CSS v3** with `@tailwindcss/forms`, `@tailwindcss/container-queries`, custom token theme, and `tailwind-merge` for safe utility merging
- **Framer Motion** for page transitions, the floating compare bar, and reveal-on-scroll
- **Lucide React** as the canonical icon set

**Back-end & infra**
- **Firebase** — Auth (admin login), Firestore (5 collections), Storage, Hosting, Analytics
- **Cloud Functions** scaffolded (`functions/`) for future server-side hooks
- **Cloudinary** for image transformation + delivery; Firebase Storage as the source of truth
- **Custom localStorage event bus** (`jain:storage`) for buyer-side persistence that survives across tabs

**Tooling**
- Create React App 5 build pipeline, PostCSS + autoprefixer, ESLint on the Cloud Functions package
- Node-driven sitemap generator (`generate-sitemap.js`) wired into `npm run generate-sitemap`

<br>

## 🧭 Routes

```
Public
  /                          → Editorial homepage (hero, featured rail, stats, brands, stories)
  /used-cars-in-mysore       → Inventory browser with sidebar filters + URL sync
  /car/:carId                → Listing detail (gallery, specs, EMI calc, related, inquiry CTA)
  /compare                   → Side-by-side spec table (up to 3 cars)
  /favorites                 → Local shortlist powered by localStorage
  /contact                   → Showroom info, map, multi-form contact, testimonial submission, FAQ

Admin (Firebase Auth required)
  /admin                     → Dashboard — KPIs, top-viewed, recent inquiries, 7-day activity chart
  /admin/cars                → Inventory CRUD — table + mobile cards, bulk ops, 6-section form
  /admin/inquiries           → Lead inbox — expandable cards, status pipeline, internal notes
  /admin/test-drives         → Booking queue — list & week views, status workflow
  /admin/testimonials        → Review moderation — inline edit, approve/feature/delete
  /admin/settings            → Showroom info editor with live Contact-page preview
```

<br>

## 📁 Project structure

```
src/
├── components/
│   ├── auth/            ProtectedRoute
│   ├── cars/            EditorialCarCard, CompareBar, EmiCalculator
│   ├── common/          FaqAccordion
│   ├── forms/           InquiryForm, TestDriveForm, TestimonialForm,
│   │                    AdminCarForm, OfferModal, ImageUpload, Honeypot
│   └── layout/          Layout, AdminLayout, Navbar, Footer
├── pages/               Home, BrowseCars, CarDetail, Compare, Favorites, ContactUs,
│                        AdminDashboard, AdminCars, AdminInquiries, AdminTestDrives,
│                        AdminTestimonials, AdminSettings, AdminLogin
├── router/              AppRouter.js   (single source of truth for route → layout wiring)
├── firebase/            firebase.js    (single Firebase init — never re-init elsewhere)
├── utils/               favorites.js, openingHours.js, showroomInfo.js
├── assets/images/       hero_editorial.png
└── index.js / index.css

public/
├── index.html, sitemap.xml, robots.txt, favicon.*

firestore.rules · storage.rules · firebase.json · generate-sitemap.js
```

<br>

## 🚀 Getting started

```bash
# 1.  Install
npm install

# 2.  Configure Firebase
cp .env.example .env       # then fill in REACT_APP_FIREBASE_* keys

# 3.  Run locally
npm start                  # http://localhost:3000

# 4.  Production build
npm run build              # → ./build/
npm run generate-sitemap   # regenerate public/sitemap.xml when routes change

# 5.  Deploy (firebase-tools CLI required)
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only storage
```

<br>

## 🎨 Design tokens

The editorial palette and type stack live in [`tailwind.config.js`](tailwind.config.js):

```
Colors    ivory      #F4F0E8 · #EFEAE0 · #E7E1D3
          ink        #0E0E0C · #1A1A17 · #5C5A52 · #8A8678
          champagne  #B8956A · #9A7748 · #D6B98F

Fonts     display    Instrument Serif      (page titles, prices, big numbers)
          sans       Inter / Geist         (body)
          mono       Geist Mono            (eyebrows, IDs, labels)

Shadows   shadow-editorial   (24px / 60px hero soft drop)
```

Status pills use a shared four-tone scale (pending amber / confirmed blue / completed green / cancelled red) applied across inquiries, test drives, and testimonials.

<br>

## 🔐 Security model

Firestore rules (`firestore.rules`):

| Collection | Public read | Public create | Auth-only write/delete |
| :-- | :-: | :-: | :-: |
| `cars` | ✅ | — | ✅ |
| `inquiries` | — | ✅ | ✅ |
| `testimonials` | only if `approved == true` | ✅ | ✅ |
| `testDrives` | — | ✅ | ✅ |
| `showroomInfo` | ✅ | — | ✅ |

Admin pages are double-gated: route-level `<ProtectedRoute>` checks Firebase Auth state, and the same rules enforce it on the database side.

<br>

## 🧪 Engineering notes

- **Optimistic UI** for every admin mutation (status flips, featured toggles, note saves) with explicit rollback on Firestore error
- **`writeBatch`** used for inventory bulk operations (mark sold / delete / toggle featured across N rows)
- **URL-synced state** on the browse page — search and filter chips deep-link cleanly and survive refresh
- **Compute on read** — `kmComputed`, `relativeTime`, `parseBookingDate`, derived KPIs — keeps the document model lean
- **A single `jain:storage` event** is dispatched on every favorites/compare write so the floating CompareBar, Favorites page, and CarCard hearts all stay in sync across tabs without redux/zustand
- **No state-management library** — composition + custom events + URL params were enough; the app stays under React's primitives

<br>

## 📋 Roadmap

- Cloud Functions for transactional email on new inquiry / test-drive booking
- Algolia-backed search on top of Firestore for fuzzier inventory queries
- Owner Portal — return customers can claim past purchases, schedule servicing
- A/B testing harness via Firebase Remote Config

<br>

<div align="center">

Built with care by **Pruthvi Jain** &nbsp;·&nbsp; [GitHub](https://github.com/pruthvi41) &nbsp;·&nbsp; [Email](mailto:pruthvijain1111@gmail.com)

</div>
