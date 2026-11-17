// Targeted repair for required FAQ text in the editable starter pack.
// Empty fields are treated as missing, but non-empty administrator-written text is never overwritten.
export function buildBlankFaqTextRepair(existingFaqs = {}, starterFaqs = {}) {
  const repair = {};
  for (const [id, starterFaq] of Object.entries(starterFaqs || {})) {
    const existingFaq = existingFaqs?.[id];
    if (!existingFaq || typeof existingFaq !== "object" || Array.isArray(existingFaq)) continue;
    const fields = {};
    for (const key of ["question", "answer"]) {
      const currentValue = existingFaq[key];
      const starterValue = starterFaq?.[key];
      if (!String(currentValue ?? "").trim() && typeof starterValue === "string" && starterValue.trim()) {
        fields[key] = starterValue;
      }
    }
    if (Object.keys(fields).length) repair[id] = fields;
  }
  return repair;
}
