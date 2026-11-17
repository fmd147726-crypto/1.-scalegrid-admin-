export function isPublishable(item) {
  return !!item && item.enabled !== false && item.status !== "draft" && item.status !== "archived";
}
export function buildPublicProjection(source) {
  const publicKeys = ["navigation","serviceCategories","services","portfolioCategories","portfolio","faqCategories","faqs","process","features","socialLinks","media","pages"];
  const out = {};
  for (const key of publicKeys) out[key] = structuredClone(source?.[key] || {});
  const allowedSettings = ["brandName","siteTitle","tagline","siteDescription","seoDescription","publicSiteUrl","whatsappNumber","whatsappMessage","showWhatsApp","contactEmail","contactInfo","footerText","ogImage","canonicalUrl"];
  out.settings = Object.fromEntries(allowedSettings.filter(key => source?.settings && Object.prototype.hasOwnProperty.call(source.settings,key)).map(key => [key,source.settings[key]]));
  // Compatibility projection: keep older portfolio categories independent without rewriting source records.
  for (const [id,project] of Object.entries(out.portfolio || {})) {
    const legacy = source?.serviceCategories?.[project?.categoryId];
    if (project?.categoryId && legacy && !out.portfolioCategories?.[project.categoryId]) {
      out.portfolioCategories[project.categoryId] = {name:legacy.name || project.categoryId,description:legacy.description || "",icon:legacy.icon || "",order:legacy.order || 999,enabled:legacy.enabled !== false};
    }
  }
  // Compatibility projection for legacy FAQ category strings.
  for (const [id,faq] of Object.entries(out.faqs || {})) {
    if (!faq?.categoryId && faq?.category) {
      const categoryId = `legacy-${String(faq.category).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,60) || "general"}`;
      out.faqCategories[categoryId] ||= {name:String(faq.category),description:"Migrated display group",order:999,enabled:true};
      out.faqs[id] = {...faq,categoryId};
    }
  }
  for (const key of ["serviceCategories","portfolioCategories","faqCategories","services","portfolio","faqs","process","features","socialLinks","navigation","media"]) {
    const collection = out[key] || {};
    const active = {};
    for (const [id,item] of Object.entries(collection)) {
      if (!isPublishable(item)) continue;
      if (key === "services" && item.categoryId && !isPublishable(out.serviceCategories?.[item.categoryId])) continue;
      if (key === "portfolio" && item.categoryId && !isPublishable(out.portfolioCategories?.[item.categoryId])) continue;
      if (key === "portfolio" && item.serviceCategoryId && !isPublishable(out.serviceCategories?.[item.serviceCategoryId])) continue;
      if (key === "faqs" && item.categoryId && !isPublishable(out.faqCategories?.[item.categoryId])) continue;
      if (key === "faqs") {
        const assignedIds = [...new Set([...(Array.isArray(item.serviceCategoryIds) ? item.serviceCategoryIds : []), ...(item.serviceCategoryId ? [item.serviceCategoryId] : [])])];
        const visibleIds = assignedIds.filter(categoryId => isPublishable(out.serviceCategories?.[categoryId]));
        active[id] = {...item,serviceCategoryIds:visibleIds,showOnHome:item.showOnHome !== false};
        delete active[id].serviceCategoryId;
        continue;
      }
      active[id] = item;
    }
    out[key] = active;
  }
  const pages = {};
  for (const [id,page] of Object.entries(out.pages || {})) {
    if (!isPublishable(page) || (id === "home" && page.enabled === false)) continue;
    const sections = {};
    for (const [sectionId,section] of Object.entries(page.sections || {})) if (isPublishable(section)) sections[sectionId] = section;
    pages[id] = {...page, sections};
  }
  out.pages = pages;
  return out;
}
