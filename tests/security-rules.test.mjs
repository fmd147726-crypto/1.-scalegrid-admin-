import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const rules = JSON.parse(readFileSync(new URL("../database.rules.json", import.meta.url), "utf8")).rules;
const app = readFileSync(new URL("../app.js", import.meta.url), "utf8");

test("database root is closed by default", () => {
  assert.equal(rules[".read"], false);
  assert.equal(rules[".write"], false);
});

test("admin access is UID-based and supports multiple Super Admins", () => {
  assert.equal(rules.adminUids[".read"], false);
  assert.match(rules.adminUids.$uid[".write"], /role/);
  assert.match(rules.admins.$uid[".write"], /role/);
  assert.doesNotMatch(rules.adminUids.$uid[".write"], /fmd147726|fmd541616/);
  assert.match(app, /function sendAdminInvitation\(form\)/);
  assert.match(app, /function acceptAdminInvitation\(context\)/);
  assert.match(app, /function deleteAdminInvitation\(key\)/);
  assert.match(app, /adminInvitations/);
  assert.doesNotMatch(app, /adminRequests/);
});

test("email invitations require verified email claims and Super Admin approval", () => {
  assert.match(rules.adminInvitations.$emailKey[".read"], /email_verified/);
  assert.match(rules.adminInvitations.$emailKey[".write"], /role.*super/);
  assert.match(rules.adminInvitations.$emailKey[".write"], /claimedUid/);
  assert.match(app, /No UID is needed/);
});

test("multiple Super Admins can be managed without removing the last one", () => {
  assert.match(app, /Manage Super Admin/);
  assert.match(app, /last remaining Super Admin/);
  assert.ok(app.includes("admins/${activeUid}"));
});

test("published website content is public but publishing is restricted", () => {
  assert.equal(rules.publicContent[".read"], true);
  assert.match(rules.publicContent[".write"], /adminUids/);
  assert.match(rules.publicContent[".write"], /publishing/);
});

test("private working content has no broad parent access", () => {
  assert.equal(rules.siteContent[".read"], undefined);
  assert.equal(rules.siteContent[".write"], undefined);
  assert.match(rules.siteContent.services[".read"], /adminUids/);
  assert.match(rules.siteContent.services[".write"], /permissions/);
});

test("publishing reads individual collections, not the protected parent", () => {
  assert.match(app, /publishCollections\.map\(key => get\(ref\(database,/);
  assert.doesNotMatch(app, /get\(ref\(database,"siteContent"\)\)/);
});

test("legacy public paths remain read-only", () => {
  assert.equal(rules.pages[".read"], true);
  assert.equal(rules.pages[".write"], false);
  assert.equal(rules.categories[".read"], true);
  assert.equal(rules.categories[".write"], false);
});
