import { readFileSync } from "node:fs";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/inspect-database-export.mjs <database-export.json>");
  process.exit(2);
}
let data;
try { data = JSON.parse(readFileSync(file, "utf8")); }
catch (error) { console.error(`Could not read valid JSON: ${error.message}`); process.exit(1); }
if (!data || typeof data !== "object" || Array.isArray(data)) {
  console.error("Expected a Realtime Database export whose root is a JSON object.");
  process.exit(1);
}
const important = ["admins","adminUids","siteContent","publicContent","pages","categories","notifications"];
console.log("Read-only Firebase export inspection");
console.log(`Root keys: ${Object.keys(data).length}`);
for (const key of important) {
  const value = data[key];
  const count = value && typeof value === "object" ? Object.keys(value).length : 0;
  console.log(`- ${key}: ${value === undefined ? "absent" : Array.isArray(value) ? "array" : typeof value} (${count} direct entries)`);
}
console.log("No data was changed. Keep this export private and do not paste it into a public repository.");
