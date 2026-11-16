import test from "node:test";
import assert from "node:assert/strict";
import { buildPublicProjection, isPublishable } from "../content-projection.js";

test("publishability excludes hidden, draft and archived records", () => {
  assert.equal(isPublishable({ enabled: true, status: "published" }), true);
  assert.equal(isPublishable({ enabled: false }), false);
  assert.equal(isPublishable({ status: "draft" }), false);
  assert.equal(isPublishable({ status: "archived" }), false);
});

test("projection filters disabled categories and dependent content", () => {
  const result = buildPublicProjection({
    serviceCategories: { active: { name: "Active" }, hidden: { name: "Hidden", enabled: false } },
    services: {
      valid: { title: "Valid", categoryId: "active" },
      hiddenCategory: { title: "Hidden category", categoryId: "hidden" },
      draft: { title: "Draft", status: "draft" }
    },
    pages: { home: { title: "Home", sections: { visible: { type: "richText" }, hidden: { type: "richText", enabled: false } } } }
  });
  assert.deepEqual(Object.keys(result.services), ["valid"]);
  assert.deepEqual(Object.keys(result.serviceCategories), ["active"]);
  assert.deepEqual(Object.keys(result.pages.home.sections), ["visible"]);
});

test("legacy FAQ categories are projected without mutating source", () => {
  const source = { faqs: { q1: { question: "Q?", answer: "A.", category: "Billing" } } };
  const result = buildPublicProjection(source);
  assert.equal(result.faqs.q1.categoryId, "legacy-billing");
  assert.equal(result.faqCategories["legacy-billing"].name, "Billing");
  assert.equal(source.faqs.q1.categoryId, undefined);
});

test("private settings are excluded from public projection", () => {
  const result = buildPublicProjection({ settings: { brandName: "ScaleGrid", secretKey: "private" } });
  assert.equal(result.settings.brandName, "ScaleGrid");
  assert.equal("secretKey" in result.settings, false);
});
