# Realtime Database security rules

The deployable rules are in `database.rules.json`; the same file is shipped in the User Site repository. Root reads and writes are denied. The only public read paths are `publicContent`, the legacy `notifications` stream, and the legacy public `pages` and `categories` paths. Legacy paths are read-only to clients under this ruleset.

## Authorization model
- An authenticated account must have `adminUids/{auth.uid} = true`.
- `admins/{uid}` is readable by that UID and by Super Admins; only Super Admins can change administrator profiles.
- Only Super Admins can write `adminUids`.
- `siteContent` is private working data. Collection reads and writes require the corresponding granular permission or the `content` permission where supported. `publishing` grants read access to working collections and write access to the published projection, not arbitrary working-content edits.
- Page metadata writes require `pages`; page-section writes require `sections`.
- `publicContent` is publicly readable and writable only by an allowlisted Super Admin or an administrator with `publishing`.
- Legacy `notifications` remains publicly readable and is writable only by an administrator with `notifications` or a Super Admin.
- `adminActivity` entries are append-only for allowlisted administrators; the records are client-generated and are not tamper-proof.
- `siteContentHistory` is permission-gated and append-only.

## Deployment sequence
1. Export the live database and keep the export offline.
2. Verify the existing Super Admin Authentication UID and profile. Add the exact `adminUids/{uid}` and `admins/{uid}` records only if missing.
3. Confirm the Super Admin can sign in.
4. Deploy `database.rules.json` with Firebase CLI or paste it in Realtime Database → Rules.
5. Test with Firebase Emulator Suite and real owner-controlled accounts before production use.

## Known limitations
- These rules have been checked for JSON syntax and static policy expectations, but Firebase Emulator Suite execution was not available in this environment. Do not treat static validation as a full authorization test.
- Realtime Database rules cannot make browser-side publishing fully trusted. A Cloud Function or other trusted backend is needed for server-authoritative publishing, concurrency locking, and tamper-resistant audit logs.
- Firebase Storage uploads are not enabled; the Media Library stores references/URLs.
- This package does not modify the live Firebase project.
