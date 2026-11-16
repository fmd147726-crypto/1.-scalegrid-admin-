import { readFileSync } from "node:fs";

const [file, uid, email] = process.argv.slice(2);
if (!file || !uid || !email) {
  console.error("Usage: node scripts/prepare-normal-admin-patch.mjs <database-export.json> <verified-auth-uid> <email>");
  process.exit(2);
}
if (uid === "-P6EIURxhvKTnOwy-8Ty") {
  console.error("Refusing the legacy push key. Supply the verified Firebase Authentication UID.");
  process.exit(1);
}
if (email.toLowerCase() !== "fmd541616@gmail.com") {
  console.error("The migration brief identifies fmd541616@gmail.com as the Normal Admin account. Verify the intended account before proceeding.");
  process.exit(1);
}
let data;
try { data = JSON.parse(readFileSync(file, "utf8")); }
catch (error) { console.error(`Could not read valid JSON: ${error.message}`); process.exit(1); }
if (!data || typeof data !== "object" || Array.isArray(data)) {
  console.error("Expected a Realtime Database export object.");
  process.exit(1);
}
if (data.adminUids?.[uid] === true || data.admins?.[uid]) {
  console.error("The verified UID already has an admin/allowlist record in this export. Review it manually; no patch was generated.");
  process.exit(1);
}
const patch = {
  adminUids: { [uid]: true },
  admins: {
    [uid]: {
      email,
      role: "normal",
      permissions: { faqs: true, portfolio: true, pricing: false, sections: false }
    }
  }
};
console.log(JSON.stringify(patch, null, 2));
console.error("Review this path-specific patch against the current live database before applying it. This script does not contact Firebase.");
