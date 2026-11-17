export const BACKUP_COLLECTIONS = [
  "settings", "navigation", "serviceCategories", "services", "portfolioCategories",
  "portfolio", "faqCategories", "faqs", "pages", "process", "features",
  "socialLinks", "media", "notifications"
];

export function validateScaleGridBackup(parsed, expectedProjectId) {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("The selected file must contain a JSON object.");
  }
  if (parsed.format !== "scalegrid-content-backup" || ![1, 2].includes(parsed.schemaVersion)) {
    throw new Error("This is not a supported ScaleGrid content backup (schema version 1 or 2).");
  }
  if (parsed.projectId !== expectedProjectId) {
    throw new Error("This backup belongs to a different Firebase project. Nothing has been changed.");
  }
  if (!parsed.content || typeof parsed.content !== "object" || Array.isArray(parsed.content)) {
    throw new Error("The backup is missing its content object.");
  }
  return { schemaVersion: parsed.schemaVersion, projectId: parsed.projectId };
}

export function buildBackupRestorePatch(content, selectedCollections) {
  const patch = {};
  const addLeaves = (path, value) => {
    if (value === null || value === undefined) return;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const [key, child] of Object.entries(value)) {
        if (!key || [...key].some(character => ".#$[]/".includes(character))) {
          throw new Error(`Backup contains an invalid Firebase key at ${path}.`);
        }
        addLeaves(`${path}/${key}`, child);
      }
      return;
    }
    patch[path] = value;
  };
  for (const key of selectedCollections) {
    if (!BACKUP_COLLECTIONS.includes(key)) throw new Error(`Unsupported backup collection: ${key}`);
    const value = content?.[key];
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const path = key === "notifications" ? "notifications" : `siteContent/${key}`;
    addLeaves(path, value);
  }
  return patch;
}
