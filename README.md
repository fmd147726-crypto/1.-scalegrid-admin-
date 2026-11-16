# ScaleGrid Admin Panel

A static-hosted CMS dashboard for the existing Firebase project `scalegrid-1c506`.

## Features in this build
- Google and email/password sign-in with UID allowlist/profile checks.
- Role-aware navigation and collection permissions.
- Independent Service, Portfolio, and FAQ category managers.
- Services, portfolio, FAQs, pages, sections, process, features, navigation, social links, settings, announcements, and URL-based media references.
- Draft/published/archived status for core content, plus enabled/hidden controls.
- Private working data in `siteContent` and a separate public projection in `publicContent`.
- Review-and-publish workflow that filters drafts, archived, hidden, disabled-category, unpublished-page, and unpublished-section content.
- Pre-edit/pre-delete snapshots for collection records and a per-record History/Restore action.
- Client-generated activity log and Super Admin content backup export / selected-collection merge restore.
- Multi-Super-Admin role management with live profile refresh and last-Super-Admin protection.
- Firebase Realtime Database security rules, CLI deployment configuration, and a non-destructive starter-content installer in the Admin Panel.

## Start
Serve this directory from a local web server; do not open `index.html` as `file://`.
```bash
python -m http.server 8000
```
Open `http://localhost:8000`.

## First-time owner setup
Read `FIREBASE-SETUP.md`, `MIGRATION-GUIDE.md`, `SECURITY-RULES.md`, and `firebase-seed/README.md` before applying rules. The existing Super Admin identity is preserved. The legacy Normal Admin push key is not an Auth UID; obtain and verify the actual UID before allowlisting it. Never import seed JSON at database root.

## Content publishing
Changes are saved privately under `siteContent`. The public site reads only `publicContent`. Use **Review & publish** after reviewing content. The publish operation runs in the browser; use a trusted server-side function for strict multi-editor concurrency and tamper-resistant publisher attribution.

## Media
The Media Library stores public HTTPS URLs and repository-relative paths. It does not upload binary files to Firebase Storage.

## Development checks
```bash
npm test
npm run check
npm run validate:firebase
```
The tests cover projection filtering and legacy category compatibility. Firebase Emulator Suite and live Firebase tests still require owner-controlled setup; see `TESTING-REPORT.md`.

## Documentation
See `FIREBASE-SETUP.md`, `DATABASE-SCHEMA.md`, `MIGRATION-GUIDE.md`, `SECURITY-RULES.md`, `DEPLOYMENT-CHECKLIST.md`, `TESTING-REPORT.md`, and `RELEASE-READINESS.md`.
