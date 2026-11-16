# Firebase seed and starter content

No importable database seed JSON is included in this repository.

The live Realtime Database export was not available for a safe comparison. A root-level or partial seed import could overwrite existing content or administrator records, so this repository deliberately avoids shipping a misleading import file.

## Safe first-time content setup

1. Back up the live Realtime Database.
2. Confirm the Admin Panel is connected to Firebase project `scalegrid-1c506`.
3. Confirm the existing Super Admin can sign in and is correctly allowlisted.
4. Open the Admin Panel dashboard and use **Install starter content**.
5. This action fills missing `siteContent` records only; it does not overwrite existing values or modify `admins`, `adminUids`, legacy `pages`, `categories`, or `notifications`.
6. Review the generated content and publish it from **Review & publish**.

The starter content source is `starter-content.js`. The public website reads the published `publicContent` projection, not private working data.

Never import a guessed seed over the live database. See `FIREBASE-SETUP.md`, `MIGRATION-GUIDE.md`, and `SECURITY-RULES.md`.
