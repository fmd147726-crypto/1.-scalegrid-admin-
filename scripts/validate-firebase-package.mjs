import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const config = readFileSync(resolve(root, "firebase-config.js"), "utf8");
const rulesText = readFileSync(resolve(root, "database.rules.json"), "utf8");
const firebaseJson = JSON.parse(readFileSync(resolve(root, "firebase.json"), "utf8"));
const firebaserc = JSON.parse(readFileSync(resolve(root, ".firebaserc"), "utf8"));
const rules = JSON.parse(rulesText);

const failures = [];
if (!/projectId:\s*"scalegrid-1c506"/.test(config)) failures.push("Firebase web config does not target scalegrid-1c506.");
if (!/databaseURL:\s*"https:\/\/scalegrid-1c506-default-rtdb\.asia-southeast1\.firebasedatabase\.app"/.test(config)) failures.push("Realtime Database URL does not match the expected project/region.");
if (firebaserc.projects?.default !== "scalegrid-1c506") failures.push(".firebaserc default project is not scalegrid-1c506.");
if (firebaseJson.database?.rules !== "database.rules.json") failures.push("firebase.json does not point to database.rules.json.");
if (rules.rules?.[".read"] !== false || rules.rules?.[".write"] !== false) failures.push("Root Realtime Database read/write must remain denied.");
if (rules.rules?.publicContent?.[".read"] !== true) failures.push("publicContent must remain publicly readable.");
if (!rules.rules?.adminUids || !rules.rules?.admins || !rules.rules?.siteContent) failures.push("Required authorization/content paths are missing.");

if (failures.length) {
  for (const failure of failures) console.error("FAIL:", failure);
  process.exitCode = 1;
} else {
  console.log("Firebase package checks passed (static configuration and JSON checks only).");
}
