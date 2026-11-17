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


test("FAQ projection normalizes multi-service assignments and preserves homepage defaults", () => {
  const result = buildPublicProjection({
    serviceCategories: { websites: { name: "Websites" }, apps: { name: "Apps" }, hidden: { name: "Hidden", enabled: false } },
    faqCategories: { general: { name: "General" } },
    faqs: {
      general: { question: "General?", answer: "Yes.", categoryId: "general" },
      assigned: { question: "Assigned?", answer: "Yes.", categoryId: "general", serviceCategoryIds: ["websites", "apps", "hidden"], showOnHome: true },
      notHome: { question: "Service only?", answer: "Yes.", categoryId: "general", serviceCategoryIds: ["apps"], showOnHome: false },
      legacy: { question: "Legacy?", answer: "Yes.", categoryId: "general", serviceCategoryId: "websites" }
    }
  });
  assert.deepEqual(result.faqs.assigned.serviceCategoryIds, ["websites", "apps"]);
  assert.equal(result.faqs.assigned.showOnHome, true);
  assert.deepEqual(result.faqs.legacy.serviceCategoryIds, ["websites"]);
  assert.equal(result.faqs.legacy.showOnHome, true);
  assert.deepEqual(result.faqs.general.serviceCategoryIds, []);
  assert.equal(result.faqs.general.showOnHome, true);
  assert.equal(result.faqs.notHome.showOnHome, false);
  assert.equal(result.faqs.legacy.serviceCategoryId, undefined);
});
