# Garget Register — Project TODO

## Phase 3: Database Schema & Design System
- [x] Define full database schema (assets, ownership, verification, stolen reports, users, plans)
- [x] Run migrations via webdev_execute_sql
- [x] Set up global design tokens (colors, fonts, spacing) in index.css
- [x] Configure Google Fonts (Inter + Space Grotesk) in index.html
- [x] Install qrcode and crypto dependencies

## Phase 4: Public Landing Page & Auth
- [x] Build elegant public landing page with hero, features, pricing tiers
- [x] Uganda-specific pricing copy (UGX amounts, Free/Premium/Business)
- [x] User registration form with NIN verification step
- [x] Role-based routing (Owner, Buyer, Law Enforcement, Admin)
- [x] Dashboard layout with role-aware sidebar navigation
- [x] Auth context and protected routes

## Phase 5: Asset Registration & Hierarchy
- [x] Asset registration form (category, serial/IMEI, make, model, color)
- [x] Proof-of-ownership file upload with SHA-256 hashing
- [x] QR code generation per asset
- [x] Parent-child asset hierarchy (vehicle + parts)
- [x] Asset status display (ACTIVE, RETIRED, DISPUTED)
- [x] Asset list/detail pages for owner dashboard

## Phase 6: Ownership Verification Workflow
- [x] Buyer scan page (QR code / IMEI lookup)
- [x] Verification request sent to owner (one-tap approve/reject)
- [x] Result display: CLEAN, STOLEN, PENDING, UNVERIFIED
- [x] Signed receipt generation for buyer
- [x] Rate limiting and blocked scanner handling
- [x] Ownership transfer initiation and confirmation flow

## Phase 7: Stolen Item Reporting & Integrations
- [x] Stolen report form (police case number or witness signatures)
- [x] UPF crime report submission (POST /crime-reports)
- [x] UCC Simu Klear IMEI blacklist (POST /devices/blacklist)
- [x] Evidence file upload with SHA-256 hashing + signed URLs
- [x] Stolen status inheritance in parent-child hierarchy
- [x] Resolve/revoke stolen report workflow

## Phase 8: Admin Dashboard & Law Enforcement Portal
- [x] Admin analytics dashboard (total assets, stolen reports, verifications)
- [x] User management (suspend, ban, role assignment)
- [x] Fraud monitor with risk scoring and event feed
- [x] Law enforcement portal with warrant-based lookup
- [x] Evidence export package generation
- [x] Case workspace with dual-authorization flow

## Phase 9: Notifications, Maps & Billing
- [x] Real-time push notifications for scan alerts and stolen reports
- [x] SMS alert integration for mobile-first Uganda users
- [x] Interactive map showing last-known location of stolen assets
- [x] Location updates pushed to UPF for active cases
- [x] Billing/subscription pages (Free, Premium UGX 10,000/yr, Business)
- [x] Mobile money payment integration (MTN/Airtel placeholder)

## Phase 10: Polish & Delivery
- [x] Mobile responsiveness audit across all pages
- [x] Loading states, empty states, error boundaries
- [x] Vitest unit tests for core procedures (23 tests, all passing)
- [x] TypeScript strict mode — 0 errors
- [x] Final checkpoint and delivery

## Phase 11: Comprehensive Category & Parts Registry
- [x] Define full category catalog (vehicle, motorcycle, phone, laptop, desktop, tablet, tv, generator, fridge, washing_machine, camera, bicycle, other_electronics, other)
- [x] Define removable parts checklist per category (vehicles: engine, gearbox, doors, tyres, battery, etc.)
- [x] Create shared CATEGORY_PARTS catalog file used by both frontend and backend
- [x] Update RegisterAsset page: dynamic parts checklist appears when category is selected
- [x] Parts are registered as child assets linked to the parent with their own serial/label fields
- [x] Asset detail page shows expandable parts list with individual statuses
- [x] Assets list page shows part count badge per asset
- [x] Stolen report: option to mark specific parts as stolen (not just the whole asset)
- [x] Admin panel: category breakdown stats

## Phase 12: Camera-Based QR Scanner on Verify Page
- [x] Install html5-qrcode package
- [x] Build reusable QrScanner component with camera permission handling, torch/flashlight toggle, camera flip (front/back), and scan feedback
- [x] Integrate scanner into Verify page: tab between "Scan QR" and "Type Code/IMEI" modes
- [x] Show live camera viewfinder with scanning overlay (animated corner brackets)
- [x] On successful scan, auto-populate the code field and trigger verification
- [x] Handle camera permission denied gracefully with fallback instructions
- [x] Handle no-camera devices (desktop) by hiding the scan tab
- [x] Ensure scanner stops cleanly when navigating away or switching tabs

## Phase 13: Mobile Money Payment Gateway (Flutterwave)
- [x] Add FLUTTERWAVE_SECRET_KEY secret to environment
- [x] Add payments table to schema (id, userId, plan, amount, currency, txRef, flwRef, status, provider, phone, createdAt)
- [x] Add subscriptions table (userId, plan, status, startedAt, expiresAt, lastPaymentId)
- [x] Server: payment.initiate procedure — create tx record, call Flutterwave charge mobile money API
- [x] Server: payment.verify procedure — poll Flutterwave verify endpoint, activate subscription on success
- [x] Server: payment.webhook POST handler — receive Flutterwave webhook, verify signature, activate subscription
- [x] Server: payment.mySubscription query — return current user plan and expiry
- [x] Server: payment.history query — return user payment history
- [x] UI: Pricing page — replace static CTAs with real "Upgrade" buttons that open payment modal
- [x] UI: PaymentModal component — plan summary, phone number input (MTN/Airtel), OTP prompt, status polling
- [x] UI: Subscription status badge in DashboardShell sidebar (Free/Premium/Business + expiry)
- [x] UI: Subscription page (/billing) showing current plan, payment history, and upgrade options
- [x] Enforce plan limits in backend (asset count, verification count per plan tier)
