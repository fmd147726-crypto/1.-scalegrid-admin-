import test from "node:test";
import assert from "node:assert/strict";
import { BACKUP_COLLECTIONS, validateScaleGridBackup, buildBackupRestorePatch } from "../backup-utils.js";

const backup = {
  format: "scalegrid-content-backup",
  schemaVersion: 2,
  projectId: "scalegrid-1c506",
  content: {
    settings: { brandName: "ScaleGrid", nested: { tagline: "Build" } },
    pages: { home: { title: "Home", sections: { hero: { title: "Hello" } } } },
    notifications: { notice1: { message: "Hi" } },
    admins: { forbidden: true }
  }
};

test("accepts supported ScaleGrid backup for the connected project", () => {
  assert.deepEqual(validateScaleGridBackup(backup, "scalegrid-1c506"), {
    schemaVersion: 2, projectId: "scalegrid-1c506"
  });
});

test("rejects malformed, unsupported and cross-project backups", () => {
  assert.throws(() => validateScaleGridBackup(null, "scalegrid-1c506"), /JSON object/);
  assert.throws(() => validateScaleGridBackup({ ...backup, schemaVersion: 3 }, "scalegrid-1c506"), /supported ScaleGrid/);
  assert.throws(() => validateScaleGridBackup(backup, "another-project"), /different Firebase project/);
  assert.throws(() => validateScaleGridBackup({ ...backup, content: [] }, "scalegrid-1c506"), /content object/);
});

test("creates additive multi-location paths and never includes admin or public data", () => {
  const patch = buildBackupRestorePatch(backup.content, ["settings", "pages", "notifications"]);
  assert.deepEqual(patch, {
    "siteContent/settings/brandName": "ScaleGrid",
    "siteContent/settings/nested/tagline": "Build",
    "siteContent/pages/home/title": "Home",
    "siteContent/pages/home/sections/hero/title": "Hello",
    "notifications/notice1/message": "Hi"
  });
  assert.equal(Object.keys(patch).some(path => path.startsWith("admins/") || path.startsWith("adminUids/") || path.startsWith("publicContent/")), false);
});

test("rejects unsupported collection names and invalid Firebase keys", () => {
  assert.throws(() => buildBackupRestorePatch(backup.content, ["admins"]), /Unsupported backup collection/);
  assert.throws(() => buildBackupRestorePatch({ settings: { "bad/key": true } }, ["settings"]), /invalid Firebase key/);
  assert.deepEqual(BACKUP_COLLECTIONS.includes("notifications"), true);
});

test("does not turn null backup values into destructive deletes", () => {
  assert.deepEqual(buildBackupRestorePatch({ settings: { optional: null, value: "kept" } }, ["settings"]), {
    "siteContent/settings/value": "kept"
  });
});
