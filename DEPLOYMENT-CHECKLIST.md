# ScaleGrid launch checklist

## Before publishing
- [ ] Confirm the GitHub repository names and expected Pages URLs.
- [ ] Confirm the Firebase project shown in `firebase-config.js` is the intended existing project.
- [ ] Export/backup the existing Realtime Database data.
- [ ] Enable the intended Firebase Authentication providers.
- [ ] Add the GitHub Pages domain to Firebase Authentication Authorized domains.
- [ ] Create the first admin in Firebase Authentication.
- [ ] Add the first UID to `adminUids` and create the matching `admins/{UID}` super-admin record.
- [ ] Review and publish the supplied Realtime Database rules.
- [ ] Sign in to the Admin Panel and confirm the signed-in UID is the one allowlisted.
- [ ] Install editable starter content only after confirming the correct Firebase project.

## Before opening the public site
- [ ] Confirm the WhatsApp link opens the intended ScaleGrid conversation.
- [ ] Update the public site URL in Admin Panel → Site Settings.
- [ ] Replace or remove every concept portfolio entry when real work is ready.
- [ ] Review all service descriptions, FAQs, process steps and page sections.
- [ ] Add only social links and business email addresses that are real and controlled by ScaleGrid.
- [ ] Check every external link and image URL.
- [ ] Test adding, editing, hiding, reordering and deleting content.
- [ ] Test with a normal admin and confirm the assigned permissions work.
- [ ] Test an unapproved sign-in and confirm it cannot write to Firebase.
- [ ] Test on a phone, tablet and desktop.
- [ ] Check the custom 404 page and GitHub Pages publishing root.

## Remaining launch work / limitations
- Live Firebase Authentication, Realtime Database rules and GitHub Pages cannot be verified from a generated ZIP alone; complete the checks above in your Firebase/GitHub accounts.
- Image management currently uses public image URLs. Secure binary image uploads need a separately designed and tested Storage authorization policy.
- Add privacy/terms wording that matches the actual business and data practices before collecting personal information.
- Consider Firebase App Check, database backups, uptime monitoring and an agreed maintenance process before scaling traffic.


## Realtime Database rules deployment
The repository includes `firebase.json`, `.firebaserc`, and `database.rules.json` for `scalegrid-1c506`. Verify the Super Admin allowlist/profile and export live data before deploying. From either repository (only once): `firebase use scalegrid-1c506` then `firebase deploy --only database`. Do not deploy rules before confirming that the existing Super Admin is allowlisted.
