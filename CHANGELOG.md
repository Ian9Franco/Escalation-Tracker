# Changelog

All notable changes to the **Escalation Tracker** will be documented in this file.

## [2026-02-11] - UI Overhaul & Internal Utility Branding

### Added

- **Premium Home Page**: A new landing page (`/`) explaining the tool's purpose, the "Why" behind its creation, and basic usage logic.
- **Dashboard Route**: Moved the main tracker logic to `/dashboard` for better structural organization.
- **Branding Integration**: Added personal branding for `fanger.design` and integrated the company logo into the navigation bar.
- **Vibrant Interactive Elements**: Added orange glow shadows and hover borders to all dashboard cards for a more "Performance Dashboard" feel.
- **Aesthetic Refinement**: Implemented a "Retina-ready" palette with deep blacks, zinc grays, and vibrant orange accents.

### Changed

- **Navigation Flow**: Reorganized routing so the brand logo now points back to the Home page.
- **Typography**: Updated headings to use a strategic bold/italic/uppercase style.
- **Progress Bars**: Increased thickness (14px) and added linear gradients for better visibility and a more "widgety" look.
- **Tone & Voice**: Removed commercial/marketing-heavy language, refocusing the app as an internal utility for personal and colleague use.

### Fixed

- **Light Mode Build Issue**: Corrected the theme initialization script to ensure Light Mode works properly and consistently across sessions.
- **TypeScript Exports**: Fixed `CampaignType` export issues in `lib/types.ts` that were causing build failures.
- **Build Compatibility**: Simplified `globals.css` to standard CSS to avoid @apply issues with Next.js Turbo.
- **Vercel Prerendering**: Fixed the hard crash during deployment by adding safety checks for `NEXT_PUBLIC_SUPABASE_URL` during build-time static generation and marking pages as `force-dynamic`.
