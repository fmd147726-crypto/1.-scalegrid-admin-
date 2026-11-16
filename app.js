import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup,
  signInWithEmailAndPassword, signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getDatabase, ref, get, set, update, push, remove, onValue
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-check.js";
import { firebaseConfig, expectedSiteUrl, appCheckSiteKey } from "./firebase-config.js";
import { starterContent } from "./starter-content.js";
import { buildPublicProjection, isPublishable } from "./content-projection.js";

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
if (appCheckSiteKey) initializeAppCheck(firebaseApp,{provider:new ReCaptchaV3Provider(appCheckSiteKey),isTokenAutoRefreshEnabled:true});
const auth = getAuth(firebaseApp);
const database = getDatabase(firebaseApp);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

const $ = (id) => document.getElementById(id);
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
const entries = (value) => value && typeof value === "object" ? Object.entries(value).sort((a,b) => (Number(a[1]?.order) || 0) - (Number(b[1]?.order) || 0)) : [];
const text = (value, fallback = "") => String(value ?? fallback).trim();
function mediaPreviewUrl(value) {
  const raw = text(value);
  if (!raw) return "";
  try {
    const base = expectedSiteUrl || location.href;
    const url = new URL(raw, base);
    return url.protocol === "https:" ? url.href : "";
  } catch { return ""; }
}
const safeKey = (value) => text(value).toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,60) || `item-${Date.now()}`;
const routeNames = {
  dashboard: ["Overview", "Your website at a glance"], pages: ["Pages & sections", "Build and organise your website pages"],
  serviceCategories: ["Service categories", "Create the categories visitors use to explore your services"], services: ["Services", "Manage the services displayed on your website"],
  portfolioCategories: ["Portfolio categories", "Organise portfolio projects independently"], portfolio: ["Portfolio", "Publish project work and clearly labelled concepts"], media: ["Media library", "Keep a reusable list of public image URLs for your site content"], faqCategories: ["FAQ categories", "Organise questions into independent groups"], faqs: ["FAQs", "Create and organise questions and answers"],
  process: ["Process steps", "Explain how a project moves from idea to delivery"], features: ["Why choose us", "Manage the differentiators and value points shown on your website"], socialLinks: ["Social links", "Manage the public social and contact links"],
  navigation: ["Navigation", "Control the links in your website menu"], settings: ["Site settings", "Manage brand details, contact information and SEO"],
  notifications: ["Announcements", "Manage the existing public notification stream"], adminAccess: ["Admin access", "Approve accounts and manage dashboard permissions"], backups: ["Backup & recovery", "Export and safely restore website content"], activity: ["Activity log", "Review administrator actions"], publish: ["Publishing", "Validate and publish the public website projection"], sections: ["Page sections", "Add, edit, reorder or hide individual page sections"]
};

const collectionSchemas = {
  serviceCategories: {
    label: "Service category", singular: "category", icon: "◈", permission: "serviceCategories", primary: "name", secondary: "description",
    fields: [
      { key:"name", label:"Category name", type:"text", required:true },
      { key:"slug", label:"URL-friendly slug", type:"text", help:"Used for organisation and future page links." },
      { key:"description", label:"Short description", type:"textarea" },
      { key:"icon", label:"Icon / symbol", type:"text", help:"An emoji or short symbol works well." },
      { key:"order", label:"Display order", type:"number", default:1 },
      { key:"enabled", label:"Visible on website", type:"checkbox", default:true }
    ]
  },
  services: {
    label: "Service", singular: "service", icon: "✳", permission: "services", primary: "title", secondary: "summary",
    fields: [
      { key:"title", label:"Service title", type:"text", required:true },
      { key:"categoryId", label:"Service category", type:"selectCategories", required:true },
      { key:"summary", label:"Short card description", type:"textarea", required:true },
      { key:"description", label:"Full description", type:"textarea" },
      { key:"priceLabel", label:"Pricing label (optional)", type:"text", help:"Examples: Starting at…, Custom quote, or Contact for pricing." },
      { key:"features", label:"Features (one per line)", type:"lines", help:"These appear as small tags on the public card." },
      { key:"icon", label:"Icon / symbol", type:"text", default:"✳" },
      { key:"imageMediaId", label:"Image from Media Library (optional)", type:"selectMedia", help:"Choose a saved image reference, or use the image URL field below." },
      { key:"imageUrl", label:"Direct image URL override (optional)", type:"text", help:"You can use a public HTTPS URL or a relative path to an image in this website repository." },
      { key:"imageAlt", label:"Image alternative text", type:"text" },
      { key:"ctaLabel", label:"Button label", type:"text", default:"Discuss this service" },
      { key:"ctaUrl", label:"Button link", type:"text", default:"#contact", help:"Use a page anchor or a full URL." },
      { key:"order", label:"Display order", type:"number", default:1 },
      { key:"status", label:"Publishing status", type:"select", options:[["draft","Draft"],["published","Published"],["archived","Archived"]], default:"published" },
      { key:"enabled", label:"Visible on website", type:"checkbox", default:true }
    ]
  },
  portfolioCategories: {
    label: "Portfolio category", singular: "category", icon: "▧", permission: "portfolioCategories", primary: "name", secondary: "description",
    fields: [
      { key:"name", label:"Category name", type:"text", required:true },
      { key:"description", label:"Description", type:"textarea" },
      { key:"icon", label:"Icon / symbol", type:"text" },
      { key:"order", label:"Display order", type:"number", default:1 },
      { key:"enabled", label:"Visible on website", type:"checkbox", default:true }
    ]
  },
  faqCategories: {
    label: "FAQ category", singular: "category", icon: "?", permission: "faqCategories", primary: "name", secondary: "description",
    fields: [
      { key:"name", label:"Category name", type:"text", required:true },
      { key:"description", label:"Description", type:"textarea" },
      { key:"order", label:"Display order", type:"number", default:1 },
      { key:"enabled", label:"Visible on website", type:"checkbox", default:true }
    ]
  },
  portfolio: {
    label: "Portfolio project", singular: "project", icon: "▧", permission: "portfolio", primary: "title", secondary: "summary",
    fields: [
      { key:"title", label:"Project title", type:"text", required:true },
      { key:"categoryId", label:"Portfolio category", type:"selectPortfolioCategories" },
      { key:"projectType", label:"Project type", type:"select", options:[["concept","Concept project"],["client","Client project"],["personal","Independent project"]], default:"concept", help:"Only select Client project when it is genuine and approved to display." },
      { key:"summary", label:"Short description", type:"textarea", required:true },
      { key:"description", label:"Project details", type:"textarea" },
      { key:"imageMediaId", label:"Image from Media Library (optional)", type:"selectMedia", help:"Choose a saved image reference, or use the direct URL field below." },
      { key:"imageUrl", label:"Direct preview image URL override (optional)", type:"text", help:"Use a public HTTPS URL or a relative path to an image in this website repository." },
      { key:"imageAlt", label:"Image alternative text", type:"text" },
      { key:"projectUrl", label:"Project link (optional)", type:"url" },
      { key:"tags", label:"Tags (comma-separated)", type:"tags" },
      { key:"order", label:"Display order", type:"number", default:1 },
      { key:"status", label:"Publishing status", type:"select", options:[["draft","Draft"],["published","Published"],["archived","Archived"]], default:"published" },
      { key:"enabled", label:"Visible on website", type:"checkbox", default:true }
    ]
  },
  media: {
    label: "Media item", singular: "media item", icon: "▧", permission: "media", primary: "label", secondary: "url",
    fields: [
      { key:"label", label:"Asset name", type:"text", required:true },
      { key:"url", label:"Public image URL or relative path", type:"text", required:true, help:"Use an HTTPS image URL or a path such as assets/project-preview.webp. Binary file uploads are not enabled in this build." },
      { key:"alt", label:"Alternative text", type:"text" },
      { key:"usage", label:"Usage / folder", type:"text", default:"General" },
      { key:"order", label:"Display order", type:"number", default:1 },
      { key:"enabled", label:"Available for selection", type:"checkbox", default:true }
    ]
  },
  faqs: {
    label: "FAQ", singular: "question", icon: "?", permission: "faqs", primary: "question", secondary: "answer",
    fields: [
      { key:"question", label:"Question", type:"text", required:true },
      { key:"answer", label:"Answer", type:"textarea", required:true },
      { key:"categoryId", label:"FAQ category", type:"selectFaqCategories", required:true },
      { key:"order", label:"Display order", type:"number", default:1 },
      { key:"status", label:"Publishing status", type:"select", options:[["draft","Draft"],["published","Published"],["archived","Archived"]], default:"published" },
      { key:"enabled", label:"Visible on website", type:"checkbox", default:true }
    ]
  },
  process: {
    label: "Process step", singular: "step", icon: "⇢", permission: "content", primary: "title", secondary: "description",
    fields: [
      { key:"title", label:"Step title", type:"text", required:true },
      { key:"description", label:"Description", type:"textarea", required:true },
      { key:"icon", label:"Icon / symbol", type:"text" },
      { key:"order", label:"Display order", type:"number", default:1 },
      { key:"enabled", label:"Visible on website", type:"checkbox", default:true }
    ]
  },
  features: {
    label: "Value point", singular: "value point", icon: "✧", permission: "content", primary: "title", secondary: "description",
    fields: [
      { key:"title", label:"Title", type:"text", required:true },
      { key:"description", label:"Description", type:"textarea", required:true },
      { key:"icon", label:"Icon / symbol", type:"text", default:"✧" },
      { key:"order", label:"Display order", type:"number", default:1 },
      { key:"enabled", label:"Visible on website", type:"checkbox", default:true }
    ]
  },
  socialLinks: {
    label: "Social / contact link", singular: "link", icon: "◎", permission: "content", primary: "label", secondary: "url",
    fields: [
      { key:"label", label:"Platform / link label", type:"text", required:true },
      { key:"url", label:"Full URL", type:"url", required:true },
      { key:"icon", label:"Icon / symbol", type:"text" },
      { key:"order", label:"Display order", type:"number", default:1 },
      { key:"enabled", label:"Visible on website", type:"checkbox", default:true }
    ]
  },
  navigation: {
    label: "Navigation item", singular: "menu item", icon: "☷", permission: "content", primary: "label", secondary: "href",
    fields: [
      { key:"label", label:"Menu label", type:"text", required:true },
      { key:"href", label:"Link / page address", type:"text", required:true, help:"Examples: #services or #page/about-us" },
      { key:"order", label:"Display order", type:"number", default:1 },
      { key:"enabled", label:"Visible in navigation", type:"checkbox", default:true }
    ]
  }
};

const sectionTypeOptions = [
  ["hero","Hero / introduction"], ["serviceGrid","Services grid"], ["portfolioGrid","Portfolio grid"],
  ["richText","About / text content"], ["featureGrid","Feature cards"], ["processList","Process steps"],
  ["faqList","FAQ list"], ["contact","Contact call-to-action"], ["announcement","Text / announcement block"]
];
const commonSectionFields = [
  { key:"anchor", label:"Section anchor / ID", type:"text", help:"Used by navigation links, e.g. services or contact." },
  { key:"order", label:"Display order", type:"number", default:1 },
  { key:"status", label:"Publishing status", type:"select", options:[["draft","Draft"],["published","Published"],["archived","Archived"]], default:"published" },
  { key:"enabled", label:"Visible on website", type:"checkbox", default:true }
];
const sectionFieldsByType = {
  hero: [
    {key:"eyebrow",label:"Small heading",type:"text"},{key:"title",label:"Main headline",type:"text",required:true},
    {key:"subtitle",label:"Supporting text",type:"textarea"},{key:"primaryLabel",label:"Primary button label",type:"text"},{key:"primaryHref",label:"Primary button link",type:"text"},
    {key:"secondaryLabel",label:"Secondary button label",type:"text"},{key:"secondaryHref",label:"Secondary button link",type:"text"},{key:"footnote",label:"Small supporting note",type:"text"},
    {key:"visualLabel1",label:"Visual label 1",type:"text"},{key:"visualText1",label:"Visual text 1",type:"text"},{key:"visualLabel2",label:"Visual label 2",type:"text"},{key:"visualText2",label:"Visual text 2",type:"text"},{key:"visualLabel3",label:"Visual label 3",type:"text"},{key:"visualText3",label:"Visual text 3",type:"text"}
  ],
  serviceGrid: [{key:"kicker",label:"Small heading",type:"text"},{key:"title",label:"Section title",type:"text",required:true},{key:"subtitle",label:"Description",type:"textarea"}],
  portfolioGrid: [{key:"kicker",label:"Small heading",type:"text"},{key:"title",label:"Section title",type:"text",required:true},{key:"subtitle",label:"Description",type:"textarea"}],
  richText: [{key:"kicker",label:"Small heading",type:"text"},{key:"title",label:"Section title",type:"text",required:true},{key:"lead",label:"Lead statement",type:"textarea"},{key:"body",label:"Main text",type:"textarea"}],
  featureGrid: [{key:"kicker",label:"Small heading",type:"text"},{key:"title",label:"Section title",type:"text",required:true},{key:"subtitle",label:"Description",type:"textarea"}],
  processList: [{key:"kicker",label:"Small heading",type:"text"},{key:"title",label:"Section title",type:"text",required:true},{key:"subtitle",label:"Description",type:"textarea"}],
  faqList: [{key:"kicker",label:"Small heading",type:"text"},{key:"title",label:"Section title",type:"text",required:true},{key:"subtitle",label:"Description",type:"textarea"}],
  contact: [{key:"kicker",label:"Small heading",type:"text"},{key:"title",label:"Section title",type:"text",required:true},{key:"subtitle",label:"Description",type:"textarea"},{key:"buttonLabel",label:"Button label",type:"text"},{key:"note",label:"Small note",type:"text"}],
  announcement: [{key:"kicker",label:"Small heading",type:"text"},{key:"title",label:"Section title",type:"text",required:true},{key:"body",label:"Text",type:"textarea"}]
};

let currentUser = null;
let adminProfile = null;
let siteContent = {};
let notificationData = {};
let adminsData = {};
let adminInvitationsData = {};
let route = "dashboard";
let selectedPageId = "home";
let editorContext = null;
let toastTimer = null;
let dataLoaded = false;
let connected = false;
let publicationMeta = {};
let historyContext = null;
let dataUnsubscribers = [];

function stopDataSubscriptions() {
  for (const unsubscribe of dataUnsubscribers) {
    try { unsubscribe(); } catch (error) { console.warn("Listener cleanup failed:",error); }
  }
  dataUnsubscribers = [];
}

function notify(message, tone = "") {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  if (tone === "error") toast.style.borderColor = "rgba(255,116,116,.4)";
  else toast.style.borderColor = "";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}
function can(permission = "content") {
  if (adminProfile?.role === "super") return true;
  const p = adminProfile?.permissions || {};
  if (p[permission] === true) return true;
  if (["faqCategories","faqs"].includes(permission)) return p.faqs === true || p.content === true;
  if (["portfolio","portfolioCategories"].includes(permission)) return p.portfolio === true || p.content === true;
  if (["services","serviceCategories"].includes(permission)) return p.pricing === true || p.content === true;
  if (permission === "pages") return p.pages === true || p.content === true;
  if (permission === "sections") return p.sections === true || p.content === true;
  return p.content === true && ["process","features","navigation","socialLinks"].includes(permission);
}
function permissionDenied(permission) {
  return `<div class="empty-state"><div class="empty-mark">⌁</div><h3>Permission required</h3><p>Your account does not currently have the <strong>${esc(permission)}</strong> permission. Ask a super admin to update your access.</p></div>`;
}
function countEnabled(collection) { return entries(collection).filter(([,item]) => item && item.enabled !== false).length; }
function totalCount(collection) { return entries(collection).length; }
function setConnectionStatus(status) {
  const el = $("connection-status");
  if (!el) return;
  el.classList.remove("online","error");
  if (status === "online") { el.classList.add("online"); el.innerHTML = "<i></i> Connected"; }
  else if (status === "error") { el.classList.add("error"); el.innerHTML = "<i></i> Offline"; }
  else el.innerHTML = "<i></i> Connecting";
}
function showAuth(message = "") {
  $("auth-screen").hidden = false;
  $("pending-screen").hidden = true;
  $("app-shell").hidden = true;
  $("auth-message").textContent = message;
}
function showPending(user) {
  $("auth-screen").hidden = true;
  $("pending-screen").hidden = false;
  $("app-shell").hidden = true;
  $("pending-email").textContent = user.email || "Email not provided";
  $("request-access-status").textContent = "If a Super Admin has invited this email, select Check Invitation. Access is granted only after the Super Admin accepts it.";
  $("check-admin-invitation").disabled = false;
  $("check-admin-invitation").textContent = "Check Invitation";
  claimAdminInvitation(user).catch(error => { $("request-access-status").textContent = error.message || "Could not check invitation."; });
}
function showApp() {
  $("auth-screen").hidden = true;
  $("pending-screen").hidden = true;
  $("app-shell").hidden = false;
  const email = currentUser?.email || "ScaleGrid admin";
  $("user-email").textContent = email;
  $("user-role").textContent = adminProfile?.role || "admin";
  $("user-avatar").textContent = email.charAt(0).toUpperCase();
  $("admin-access-nav").hidden = adminProfile?.role !== "super";
  document.querySelectorAll(".nav-item[data-route]").forEach(item => {
    const key=item.dataset.route;
    let allowed=key==="dashboard";
    if (collectionSchemas[key]) allowed=can(collectionSchemas[key].permission);
    else if (key==="pages") allowed=can("pages");
    else if (key==="sections") allowed=can("sections");
    else if (key==="settings") allowed=can("settings");
    else if (key==="notifications") allowed=can("notifications");
    else if (key==="publish") allowed=can("publishing");
    else if (["adminAccess","activity","backups"].includes(key)) allowed=adminProfile?.role==="super";
    item.hidden=!allowed;
  });
  updateSiteLinks();
  renderRoute();
}
function updateSiteLinks() {
  const href = text(siteContent.settings?.publicSiteUrl, expectedSiteUrl) || expectedSiteUrl;
  [$("visit-site-link"),$("top-view-site")].forEach(a => { if (a) a.href = href; });
}
async function refreshAdminAuthorization(user) {
  try {
    const snapshot = await get(ref(database, `admins/${user.uid}`));
    if (auth.currentUser?.uid !== user.uid) return;
    if (!snapshot.exists()) { stopDataSubscriptions(); showPending(user); return; }
    const record = snapshot.val() || {};
    const emailMatches = !record.email || !user.email || String(record.email).toLowerCase() === String(user.email).toLowerCase();
    if (!emailMatches) { stopDataSubscriptions(); showPending(user); return; }
    const legacyPermissions = record.permissions || {};
    const normalizedPermissions = {
      ...legacyPermissions,
      faqs: legacyPermissions.faqs ?? legacyPermissions.FAQs ?? legacyPermissions.faq ?? false,
      portfolio: legacyPermissions.portfolio ?? legacyPermissions.Portfolio ?? false,
      pricing: legacyPermissions.pricing ?? legacyPermissions.Pricing ?? false,
      sections: legacyPermissions.sections ?? legacyPermissions.Sections ?? false
    };
    adminProfile = { email: record.email || user.email || "", role: record.role === "super" ? "super" : "normal", permissions: normalizedPermissions };
    currentUser = user;
    showApp();
    subscribeData();
  } catch (error) {
    console.error("Admin verification failed:", error);
    stopDataSubscriptions();
    if (auth.currentUser?.uid === user.uid) showPending(user);
  }
}
function subscribeData() {
  stopDataSubscriptions();
  siteContent = {};
  const activeUid = currentUser?.uid;
  if (activeUid) {
    dataUnsubscribers.push(onValue(ref(database,`admins/${activeUid}`),(snapshot)=>{
      if (currentUser?.uid !== activeUid) return;
      if (!snapshot.exists()) {
        const user = currentUser;
        stopDataSubscriptions();
        adminProfile = null;
        showPending(user);
        return;
      }
      const record = snapshot.val() || {};
      if (record.email && currentUser.email && String(record.email).toLowerCase() !== String(currentUser.email).toLowerCase()) {
        const user = currentUser;
        stopDataSubscriptions();
        adminProfile = null;
        showPending(user);
        return;
      }
      const permissions = record.permissions || {};
      const nextProfile = {
        email: record.email || currentUser.email || "",
        role: record.role === "super" ? "super" : "normal",
        permissions: {
          ...permissions,
          faqs: permissions.faqs ?? permissions.FAQs ?? permissions.faq ?? false,
          portfolio: permissions.portfolio ?? permissions.Portfolio ?? false,
          pricing: permissions.pricing ?? permissions.Pricing ?? false,
          sections: permissions.sections ?? permissions.Sections ?? false
        }
      };
      if (JSON.stringify(nextProfile) !== JSON.stringify(adminProfile)) {
        adminProfile = nextProfile;
        showApp();
        subscribeData();
      }
    },(error)=>console.error("Live administrator profile refresh failed:",error)));
  }
  const sourcePermissions = [
    ["settings",["settings"]],
    ["navigation",["navigation","content"]],
    ["serviceCategories",["serviceCategories","services","content"]],
    ["services",["services","serviceCategories","content"]],
    ["portfolioCategories",["portfolioCategories","portfolio","content"]],
    ["portfolio",["portfolio","portfolioCategories","content"]],
    ["faqCategories",["faqCategories","faqs","content"]],
    ["faqs",["faqs","faqCategories","content"]],
    ["pages",["pages","sections","content"]],
    ["process",["process","content"]],
    ["features",["features","content"]],
    ["socialLinks",["socialLinks","content"]],
    ["media",["media","services","portfolio","content"]]
  ];
  for (const [key,permissions] of sourcePermissions) {
    if (!can("publishing") && !permissions.some(permission=>can(permission))) continue;
    dataUnsubscribers.push(onValue(ref(database,`siteContent/${key}`),(snapshot)=>{
      siteContent[key]=snapshot.exists()?snapshot.val():{};
      dataLoaded=true;
      updateSiteLinks();
      if ($("editor-modal").hidden) renderRoute();
    },(error)=>{
      console.error(`Website content read failed (${key}):`,error);
      setConnectionStatus("error");
      notify(`Could not read ${key}. Check this administrator's database permissions.`,"error");
    }));
  }
  dataUnsubscribers.push(onValue(ref(database, "publicContent/_meta"), (snapshot) => {
    publicationMeta = snapshot.exists() ? snapshot.val() : {};
    if (route === "publish") renderRoute();
  }, (error) => console.warn("Publication metadata unavailable:",error)));
  dataUnsubscribers.push(onValue(ref(database, "notifications"), (snapshot) => {
    notificationData = snapshot.exists() ? snapshot.val() : {};
    if (route === "notifications") renderRoute();
  }, (error) => console.warn("Notification read failed:", error)));
  if (adminProfile?.role === "super") {
    dataUnsubscribers.push(onValue(ref(database, "admins"), (snapshot) => {
      adminsData = snapshot.exists() ? snapshot.val() : {};
      if (route === "adminAccess") renderRoute();
    }, (error) => console.warn("Admin list unavailable:", error)));
    dataUnsubscribers.push(onValue(ref(database, "adminInvitations"), (snapshot) => {
      adminInvitationsData = snapshot.exists() ? snapshot.val() : {};
      if (route === "adminAccess") renderRoute();
    }, (error) => console.warn("Admin invitations unavailable:", error)));
  }
  dataUnsubscribers.push(onValue(ref(database, ".info/connected"), (snapshot) => { connected = snapshot.val() === true; setConnectionStatus(connected ? "online" : "error"); }));
}

// Authentication
$("google-login").addEventListener("click", async () => {
  $("auth-message").textContent = "";
  try { await signInWithPopup(auth, googleProvider); }
  catch (error) { $("auth-message").textContent = authError(error); }
});
async function claimAdminInvitation(user) {
  if (!user?.email || !user.emailVerified) { $("request-access-status").textContent = "Sign in using the same verified email address invited by the Super Admin."; return; }
  const key = btoa(user.email.trim().toLowerCase()).replace(/\\+/g,"-").replace(/\\//g,"_").replace(/=+$/g,"");
  const invitationRef = ref(database,`adminInvitations/${key}`);
  const snapshot = await get(invitationRef);
  if (auth.currentUser?.uid !== user.uid) return;
  if (!snapshot.exists()) { $("request-access-status").textContent = "No invitation found for this email. Ask your Super Admin to add it in Admin Access."; return; }
  const invitation = snapshot.val() || {};
  if (String(invitation.email || "").toLowerCase() !== user.email.toLowerCase()) throw new Error("The invitation email does not match your signed-in account.");
  if (invitation.claimedUid && invitation.claimedUid !== user.uid) throw new Error("This invitation is linked to another account.");
  if (!invitation.claimedUid) await update(invitationRef,{claimedUid:user.uid,status:"claimed",claimedAt:Date.now()});
  if (auth.currentUser?.uid === user.uid) $("request-access-status").textContent = "Invitation found. Waiting for the Super Admin to Accept or Delete it.";
}
$("check-admin-invitation").addEventListener("click", async () => {
  const user = auth.currentUser; if (!user) return;
  const button = $("check-admin-invitation"); button.disabled = true;
  try { await claimAdminInvitation(user); } catch(error) { $("request-access-status").textContent = error.message || "Could not check invitation."; }
  finally { button.disabled = false; }
});
function authError(error) {
  const messages = {
    "auth/invalid-credential": "The email or password is incorrect.",
    "auth/user-not-found": "No account was found for that email.",
    "auth/wrong-password": "The password is incorrect.",
    "auth/popup-closed-by-user": "The sign-in window was closed before completing sign-in.",
    "auth/unauthorized-domain": "This domain is not authorised in Firebase Authentication. Add your GitHub Pages domain in Firebase Console.",
    "auth/operation-not-allowed": "Enable this sign-in provider in Firebase Authentication settings."
  };
  return messages[error?.code] || error?.message || "Sign-in failed. Please try again.";
}
onAuthStateChanged(auth, (user) => {
  if (!user) {
    stopDataSubscriptions();
    currentUser = null;
    adminProfile = null;
    showAuth();
  } else {
    refreshAdminAuthorization(user);
  }
});
$("logout-button").addEventListener("click", () => signOut(auth));
$("pending-signout").addEventListener("click", () => signOut(auth));
$("copy-uid").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText($("pending-uid").textContent); notify("Firebase UID copied."); }
  catch { notify("Select and copy the UID manually.", "error"); }
});

// Navigation / mobile sidebar
function navigate(next) {
  route = next;
  document.querySelectorAll(".nav-item[data-route]").forEach(item => item.classList.toggle("active", item.dataset.route === route || (route === "sections" && item.dataset.route === "pages")));
  $("sidebar").classList.remove("open");
  $("sidebar-backdrop").classList.remove("show");
  renderRoute();
}
document.querySelectorAll(".nav-item[data-route]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.route)));
$("sidebar-open").addEventListener("click", () => { $("sidebar").classList.add("open"); $("sidebar-backdrop").classList.add("show"); });
$("sidebar-close").addEventListener("click", () => { $("sidebar").classList.remove("open"); $("sidebar-backdrop").classList.remove("show"); });
$("sidebar-backdrop").addEventListener("click", () => { $("sidebar").classList.remove("open"); $("sidebar-backdrop").classList.remove("show"); });

function renderRoute() {
  const meta = routeNames[route] || routeNames.dashboard;
  $("page-title").textContent = route === "sections" ? `Sections · ${siteContent.pages?.[selectedPageId]?.title || selectedPageId}` : meta[0];
  let html = "";
  if (route === "dashboard") html = renderDashboard();
  else if (route === "pages") html = renderPages();
  else if (route === "sections") html = renderSections(selectedPageId);
  else if (collectionSchemas[route]) html = renderCollection(route);
  else if (route === "settings") html = renderSettings();
  else if (route === "notifications") html = renderNotifications();
  else if (route === "adminAccess") html = renderAdminAccess();
  else if (route === "publish") html = renderPublishing();
  else if (route === "backups") html = renderBackups();
  else if (route === "activity") html = renderActivity();
  else html = renderDashboard();
  $("content-view").innerHTML = html;
  updateSiteLinks();
}

function renderBackups() {
  if (adminProfile?.role !== "super") return permissionDenied("super admin");
  return `<div class="welcome-row"><div><h2>Protect your website content.</h2><p>Export a timestamped JSON backup or merge selected collections from a previous backup.</p></div><button class="button button-primary" data-action="download-backup">Export backup ↗</button></div>
  <section class="settings-card"><h3>Restore from backup</h3><p class="view-subtitle">Restore merges selected content records into the current working data. It never touches administrator identities, UID allowlists, public publication, or legacy paths.</p>
  <form id="backup-restore-form"><div class="field"><label>Backup JSON file<input type="file" name="backupFile" accept=".json,application/json" required></label></div><div class="field"><span class="field-label">Collections to restore</span><div class="permission-grid">${["settings","navigation","serviceCategories","services","portfolioCategories","portfolio","faqCategories","faqs","pages","process","features","socialLinks","media"].map(k=>`<label class="field-check"><input type="checkbox" name="restore_${k}" checked> ${esc(k)}</label>`).join("")}</div></div><button class="button button-secondary" type="submit">Validate & merge selected content</button></form></section>
  <div class="helper-box"><strong>Important:</strong> restore is additive/update-only. It does not delete records that are absent from the backup. Review the export before restoring it.</div>`;
}
function renderActivity() {
  if (adminProfile?.role !== "super") return permissionDenied("super admin");
  return `<div class="welcome-row"><div><h2>Administrator activity</h2><p>Client-generated activity history. These records are useful for review but are not tamper-proof.</p></div><button class="button button-secondary" data-action="load-activity">Refresh log</button></div><div id="activity-results" class="content-list"><div class="empty-state"><h3>Load recent activity</h3><p>Activity records are read only when you request them.</p></div></div>`;
}
async function loadActivity() {
  if (adminProfile?.role !== "super") throw new Error("Only a super admin can read the activity log.");
  const snap=await get(ref(database,"adminActivity"));
  const rows=snap.exists()?Object.entries(snap.val()).sort((a,b)=>(Number(b[1]?.timestamp)||0)-(Number(a[1]?.timestamp)||0)).slice(0,100):[];
  const target=$("activity-results");
  if (!target) return;
  target.innerHTML=rows.map(([id,item])=>`<article class="content-row"><div class="row-icon">◷</div><div class="row-main"><strong>${esc(item.action||"Action")} · ${esc(item.contentType||"content")}</strong><p>${esc(item.summary||"")}<br>${new Date(Number(item.timestamp)||0).toLocaleString()} · ${esc(item.email||item.uid||"Unknown admin")}</p></div></article>`).join("") || emptyMarkup("No activity has been recorded.","Future CMS actions will appear here.");
}
function downloadBackup() {
  if (adminProfile?.role !== "super") throw new Error("Only a super admin can export backups.");
  const collections=["settings","navigation","serviceCategories","services","portfolioCategories","portfolio","faqCategories","faqs","pages","process","features","socialLinks","media"];
  const content=Object.fromEntries(collections.map(key=>[key,siteContent[key] || {}]));
  const payload={format:"scalegrid-content-backup",schemaVersion:1,projectId:firebaseConfig.projectId,createdAt:new Date().toISOString(),createdBy:currentUser?.uid || null,content};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a"); a.href=url; a.download=`scalegrid-content-backup-${new Date().toISOString().replace(/[:.]/g,"-")}.json`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  writeAudit("backup-export","backup","content","Exported website content backup");
  notify("Content backup exported.");
}
async function restoreBackup(form) {
  if (adminProfile?.role !== "super") throw new Error("Only a super admin can restore backups.");
  const file=form.elements.backupFile.files?.[0];
  if (!file) throw new Error("Choose a backup JSON file.");
  if (file.size > 10*1024*1024) throw new Error("Backup file exceeds the 10 MB limit.");
  const parsed=JSON.parse(await file.text());
  if (parsed?.format!=="scalegrid-content-backup" || parsed?.schemaVersion!==1 || parsed?.projectId!==firebaseConfig.projectId || !parsed.content || typeof parsed.content!=="object") throw new Error("This is not a valid ScaleGrid backup for the connected Firebase project.");
  const keys=["settings","navigation","serviceCategories","services","portfolioCategories","portfolio","faqCategories","faqs","pages","process","features","socialLinks","media"];
  const selected=keys.filter(key=>form.elements[`restore_${key}`]?.checked && parsed.content[key] && typeof parsed.content[key]==="object");
  if (!selected.length) throw new Error("Select at least one valid collection to restore.");
  if (!confirm(`Merge ${selected.length} selected content collection(s) into the current website data? Existing records absent from the backup will remain unchanged.`)) return;
  for (const key of selected) {
    if (key === "pages") await update(ref(database),flattenPatch("siteContent/pages",parsed.content[key]));
    else await update(ref(database,`siteContent/${key}`),parsed.content[key]);
  }
  await writeAudit("backup-restore","backup",selected.join(","),`Merged backup collections: ${selected.join(", ")}`);
  notify(`Restored ${selected.length} content collection(s).`);
}

function renderPublishing() {
  if (!can("publishing")) return permissionDenied("publishing");
  const published = publicationMeta || {};
  const draftCount = ["services","portfolio","faqs","pages"].reduce((n,k)=>n+entries(siteContent[k]).filter(([,v])=>v?.status==="draft").length,0);
  const hiddenCount = ["services","portfolio","faqs","pages"].reduce((n,k)=>n+entries(siteContent[k]).filter(([,v])=>v?.enabled===false).length,0);
  return `<div class="welcome-row"><div><h2>Review before going live.</h2><p>The public website reads only the published projection. Your private working records remain separate.</p></div><button class="button button-primary" data-action="publish-now">Validate & publish ↗</button></div>
  <div class="metric-grid">${metric("Draft records",draftCount,"◷","Excluded from public site")}${metric("Hidden records",hiddenCount,"◌","Excluded from public site")}${metric("Last revision",published.revision || "—","↻","Published projection")}${metric("Last published",published.publishedAt ? new Date(published.publishedAt).toLocaleString() : "Never","✓","Publication timestamp")}</div>
  <section class="settings-card"><h3>Publication safeguards</h3><ul class="check-list"><li>Draft and archived entries are excluded.</li><li>Hidden records and disabled categories are excluded.</li><li>Pages and sections must be enabled and publishable.</li><li>The complete public projection is written in one Realtime Database operation.</li><li>Publishing is a client-side workflow; strict cross-editor concurrency guarantees require trusted server-side code.</li></ul></section>`;
}
function validateWorkingContent(source) {
  const errors=[];
  const pages=Object.entries(source.pages||{});
  const slugs=new Set();
  for (const [id,page] of pages) {
    if (!isPublishable(page)) continue;
    if (!String(page.title||"").trim()) errors.push(`Page ${id}: title is required`);
    const slug=String(page.slug||"").trim();
    if (!slug) errors.push(`Page ${id}: slug is required`);
    else if (slugs.has(slug)) errors.push(`Page ${id}: duplicate slug "${slug}"`);
    else slugs.add(slug);
    for (const [sectionId,section] of Object.entries(page.sections||{})) {
      if (!isPublishable(section)) continue;
      if (!sectionTypeOptions.some(([type])=>type===section.type)) errors.push(`Page ${id}, section ${sectionId}: unsupported section type`);
    }
  }
  for (const [id,item] of Object.entries(source.services||{})) if (isPublishable(item)) {
    if (!String(item.title||"").trim() || !String(item.summary||"").trim()) errors.push(`Service ${id}: title and summary are required`);
    if (item.categoryId && !isPublishable(source.serviceCategories?.[item.categoryId])) errors.push(`Service ${id}: selected service category is unavailable`);
  }
  for (const [id,item] of Object.entries(source.portfolio||{})) if (isPublishable(item)) {
    if (!String(item.title||"").trim() || !String(item.summary||"").trim()) errors.push(`Portfolio ${id}: title and summary are required`);
    if (item.categoryId && !isPublishable(source.portfolioCategories?.[item.categoryId]) && !isPublishable(source.serviceCategories?.[item.categoryId])) errors.push(`Portfolio ${id}: selected portfolio category is unavailable`);
  }
  for (const [id,item] of Object.entries(source.faqs||{})) if (isPublishable(item)) {
    if (!String(item.question||"").trim() || !String(item.answer||"").trim()) errors.push(`FAQ ${id}: question and answer are required`);
  }
  for (const [id,item] of Object.entries(source.navigation||{})) if (isPublishable(item)) {
    if (!String(item.label||"").trim() || !String(item.href||"").trim()) errors.push(`Navigation ${id}: label and destination are required`);
    else { try { ensureValidUrl(item.href,"Navigation destination",true); } catch { errors.push(`Navigation ${id}: destination URL is invalid`); } }
  }
  return errors;
}
async function publishWebsite() {
  if (!can("publishing")) throw new Error("You do not have publishing permission.");
  // The database rules intentionally deny reads at /siteContent while granting
  // permission-gated reads to each collection. Fetch those allowed paths
  // individually instead of requesting the protected parent node.
  const publishCollections = [
    "settings","navigation","serviceCategories","services","portfolioCategories",
    "portfolio","faqCategories","faqs","pages","process","features","socialLinks","media"
  ];
  const snapshots = await Promise.all(
    publishCollections.map(key => get(ref(database,`siteContent/${key}`)))
  );
  const latest = Object.fromEntries(publishCollections.map((key,index) => [
    key,
    snapshots[index].exists() ? snapshots[index].val() : {}
  ]));
  if (!latest.pages?.home) throw new Error("The Home page is missing. Create or restore it before publishing.");
  if (latest.pages.home.enabled === false || ["draft","archived"].includes(latest.pages.home.status)) throw new Error("The Home page cannot be hidden, drafted, or archived.");
  const validationErrors=validateWorkingContent(latest);
  if (validationErrors.length) throw new Error(`Publishing validation failed:\n• ${validationErrors.slice(0,8).join("\n• ")}${validationErrors.length>8?`\n…and ${validationErrors.length-8} more issue(s)`:""}`);
  const projection = buildPublicProjection(latest);
  if (!projection.pages?.home) throw new Error("The Home page did not pass publication validation.");
  const previous = await get(ref(database,"publicContent/_meta/revision"));
  const revision = (Number(previous.val()) || 0) + 1;
  projection._meta = {revision,publishedAt:Date.now(),publishedBy:currentUser?.uid || null,source:"admin-client"};
  await set(ref(database,"publicContent"),projection);
  await writeAudit("publish","publicContent",String(revision),`Published public revision ${revision}`);
  notify(`Website published successfully (revision ${revision}).`);
  renderRoute();
}
async function writeAudit(action,contentType,contentId,summary) {
  if (!currentUser) return;
  try {
    await push(ref(database,"adminActivity"),{uid:currentUser.uid,email:currentUser.email || "",action,contentType,contentId,summary:String(summary||"").slice(0,300),timestamp:Date.now(),clientGenerated:true});
  } catch (error) { console.warn("Activity log write failed:",error); }
}
function renderDashboard() {
  const categories = totalCount(siteContent.serviceCategories);
  const services = totalCount(siteContent.services);
  const projects = totalCount(siteContent.portfolio);
  const faqs = totalCount(siteContent.faqs);
  const processes = totalCount(siteContent.process);
  const pages = totalCount(siteContent.pages);
  const portfolioCategories = totalCount(siteContent.portfolioCategories);
  const faqCategories = totalCount(siteContent.faqCategories);
  const sections = entries(siteContent.pages).reduce((n,[,page])=>n+totalCount(page?.sections),0);
  const draftCount = ["services","portfolio","faqs","pages"].reduce((n,key)=>n+entries(siteContent[key]).filter(([,item])=>item?.status==="draft").length,0);
  const hiddenCount = ["services","portfolio","faqs","pages"].reduce((n,key)=>n+entries(siteContent[key]).filter(([,item])=>item?.enabled===false).length,0);
  const publishedCount = ["services","portfolio","faqs","pages"].reduce((n,key)=>n+entries(siteContent[key]).filter(([,item])=>isPublishable(item)).length,0);
  const hasMissingStarter = adminProfile?.role === "super" && Object.keys(fillMissing(siteContent,starterContent)).length > 0;
  const activeContent = countEnabled(siteContent.services) + countEnabled(siteContent.portfolio) + countEnabled(siteContent.faqs);
  return `<div class="welcome-row"><div><h2>Welcome to your workspace.</h2><p>Manage the content that visitors see on the ScaleGrid website.</p></div><div class="welcome-actions"><button class="button button-secondary" data-action="go" data-route="pages">Manage pages</button><button class="button button-primary" data-action="go" data-route="services">Add a service ↗</button></div></div>
    ${hasMissingStarter ? `<div class="setup-callout"><div class="callout-row"><div><h3>Your website content workspace is ready.</h3><p>Install the editable starter content to populate your website with initial service categories, service descriptions, sample concept projects, FAQs and page sections. This only fills missing data; it does not overwrite existing ScaleGrid data or the previous content paths.</p></div><button class="button button-primary" data-action="install-starter">Install starter content ↗</button></div></div>` : ""}
    <div class="metric-grid">
      ${metric("Pages",pages,"▤","Create pages and sections")}${metric("Services",services,"✳","Manage your offerings")}${metric("Portfolio",projects,"▧","Concepts and real work")}${metric("FAQs",faqs,"?","Questions and answers")}
    </div>
    <div class="metric-grid">
      ${metric("Service categories",categories,"◈","Independent service groups")}${metric("Portfolio categories",portfolioCategories,"▧","Independent project groups")}${metric("FAQ categories",faqCategories,"?","Independent FAQ groups")}${metric("Sections",sections,"▤","Across all pages")}
    </div>
    <div class="metric-grid">
      ${metric("Published",publishedCount,"✓","Visible working records")}${metric("Hidden",hiddenCount,"◌","Excluded from public content")}${metric("Drafts",draftCount,"◷","Not yet published")}
    </div>
    <div class="dashboard-grid"><section class="panel-card"><div class="panel-title"><h3>Quick actions</h3><span>${activeContent} enabled working items</span></div><div class="quick-actions">
      <button class="quick-action" data-action="go" data-route="serviceCategories"><b>＋</b> Add a service category</button>
      <button class="quick-action" data-action="go" data-route="services"><b>＋</b> Add a new service</button>
      <button class="quick-action" data-action="go" data-route="portfolio"><b>＋</b> Add portfolio work</button>
      <button class="quick-action" data-action="go" data-route="faqs"><b>＋</b> Add a question</button>
      <button class="quick-action" data-action="go" data-route="features"><b>＋</b> Add a value point</button>
      <button class="quick-action" data-action="go" data-route="media"><b>＋</b> Add an image reference</button>
      <button class="quick-action" data-action="go" data-route="pages"><b>＋</b> Create a page or section</button>
      <button class="quick-action" data-action="go" data-route="socialLinks"><b>＋</b> Add a social link</button>
      <button class="quick-action" data-action="go" data-route="publish"><b>↗</b> Review & publish changes</button>
    </div></section>
    <section class="panel-card"><div class="panel-title"><h3>Website controls</h3><span class="badge badge-muted">PRIVATE WORKING DATA</span></div><div class="helper-box"><strong>Draft and publish workflow is enabled.</strong><br>Changes are saved privately in the working content area. Review and publish them to update the public website projection.</div><div class="panel-title"><h3>Workspace status</h3><span>${connected ? "Connected" : "Checking"}</span></div><p class="view-subtitle">${pages} page(s) · ${categories} categories · ${processes} process steps</p></section></div>`;
}
function metric(label,value,icon,note) { return `<article class="metric-card"><div class="metric-top"><span>${esc(label)}</span><span class="metric-icon">${icon}</span></div><div class="metric-value">${value}</div><div class="metric-note">${esc(note)}</div></article>`; }

function renderCollection(collection) {
  const schema = collectionSchemas[collection];
  if (!can(schema.permission)) return permissionDenied(schema.permission);
  const rows = entries(siteContent[collection]);
  const items = rows.map(([id,item]) => {
    const title = item?.[schema.primary] || id;
    const secondary = item?.[schema.secondary] || "";
    const enabled = item?.enabled !== false;
    const categorySource = collection === "portfolio" ? "portfolioCategories" : collection === "faqs" ? "faqCategories" : "serviceCategories";
    const category = item?.categoryId ? (siteContent[categorySource]?.[item.categoryId]?.name || siteContent.serviceCategories?.[item.categoryId]?.name) : item?.category;
    const projectType = collection === "portfolio" ? (item.projectType === "client" ? "Client project" : item.projectType === "personal" ? "Independent project" : "Concept project") : "";
    const meta = [category,projectType].filter(Boolean).map(x => `<span class="badge badge-muted">${esc(x)}</span>`).join("");
    const libraryImage = item?.imageMediaId ? siteContent.media?.[item.imageMediaId]?.url : "";
    const preview = mediaPreviewUrl(collection === "media" ? item?.url : item?.imageUrl || libraryImage || item?.image);
    const rowVisual = preview ? `<img class="row-thumb" src="${esc(preview)}" alt="" loading="lazy">` : `<div class="row-icon">${esc(item?.icon || schema.icon)}</div>`;
    return `<article class="content-row">${rowVisual}<div class="row-main"><strong>${esc(title)}</strong><p>${esc(secondary)}</p><div class="row-meta">${meta}<span class="badge ${enabled ? "badge-green" : "badge-muted"}">${enabled ? "Visible" : "Hidden"}</span>${item?.status ? `<span class="badge badge-muted">${esc(item.status)}</span>` : ""}</div></div><div class="row-actions"><button class="small-action" data-action="edit-item" data-collection="${collection}" data-id="${esc(id)}">Edit</button><button class="small-action" data-action="item-history" data-collection="${collection}" data-id="${esc(id)}">History</button><button class="small-action" data-action="toggle-item" data-collection="${collection}" data-id="${esc(id)}" title="Toggle visibility">${enabled ? "Hide" : "Show"}</button><button class="small-action danger" data-action="delete-item" data-collection="${collection}" data-id="${esc(id)}">Delete</button></div></article>`;
  }).join("");
  const title = routeNames[collection][0];
  const helper = collection === "portfolio" ? `<div class="helper-box">Mark starter or demonstration work as <strong>Concept project</strong>. Only choose <strong>Client project</strong> when the work is real and you have permission to publish it.</div>` : collection === "socialLinks" ? `<div class="helper-box">Only add social accounts and contact destinations that are active and controlled by ScaleGrid. A link is shown publicly only when its visibility is switched on.</div>` : collection === "navigation" ? `<div class="helper-box">Use page anchors such as <strong>#services</strong>, or link to a custom page with <strong>#page/about-us</strong>. Create the page first in Pages & sections.</div>` : "";
  return `<div class="welcome-row"><div><h2>${esc(title)}</h2><p>${esc(routeNames[collection][1])}. Add, edit, reorder, hide or remove entries at any time.</p></div><button class="button button-primary" data-action="add-item" data-collection="${collection}">＋ Add ${esc(schema.singular)}</button></div>${helper}<div class="list-toolbar"><div><span class="badge badge-muted">${rows.length} total</span> <span class="badge badge-green">${countEnabled(siteContent[collection])} visible</span></div><input type="search" placeholder="Search ${esc(schema.label.toLowerCase())}…" data-filter="collection"></div><div class="content-list" id="collection-list">${items || emptyMarkup(`No ${schema.label.toLowerCase()} entries yet.`, `Add your first ${schema.singular} to display it on your website.`)}</div>`;
}
function emptyMarkup(title,description) { return `<div class="empty-state"><div class="empty-mark">＋</div><h3>${esc(title)}</h3><p>${esc(description)}</p></div>`; }

function renderPages() {
  if (!can("pages")) return permissionDenied("pages");
  const rows = entries(siteContent.pages);
  const html = rows.map(([id,page]) => `<article class="content-row"><div class="row-icon">▤</div><div class="row-main"><strong>${esc(page.title || id)}</strong><p>/${esc(page.slug || id)} · ${entries(page.sections).length} section(s)</p><div class="row-meta"><span class="badge ${page.enabled === false || page.status === "draft" ? "badge-muted" : "badge-green"}">${page.enabled === false ? "Hidden" : esc(page.status || "Published")}</span><span class="badge badge-muted">${id === "home" ? "Home page" : "Custom page"}</span></div></div><div class="row-actions"><button class="small-action" data-action="edit-page" data-id="${esc(id)}">Edit page</button>${can("sections") ? `<button class="small-action" data-action="manage-sections" data-id="${esc(id)}">Sections</button>` : ""}<button class="small-action" data-action="toggle-page" data-id="${esc(id)}">${page.enabled === false ? "Publish" : "Unpublish"}</button>${id === "home" || !can("sections") ? "" : `<button class="small-action danger" data-action="delete-page" data-id="${esc(id)}">Delete</button>`}</div></article>`).join("");
  return `<div class="welcome-row"><div><h2>Pages & sections</h2><p>Create new pages and build them from reusable dynamic sections. No page content needs to be hardcoded.</p></div><button class="button button-primary" data-action="add-page">＋ Create page</button></div><div class="helper-box">Create a page, add sections such as a hero, text block, service grid, portfolio grid, FAQ list or contact block, then add a navigation item using <strong>#page/your-page-slug</strong> if visitors should be able to open it from the menu.</div><div class="content-list">${html || emptyMarkup("No pages created yet.","Create your first page to begin building your website structure.")}</div>`;
}
function renderSections(pageId) {
  if (!can("sections")) return permissionDenied("sections");
  const page = siteContent.pages?.[pageId];
  if (!page) return `<div class="empty-state"><h3>Page not found</h3><button class="button button-secondary" data-action="go" data-route="pages">Back to pages</button></div>`;
  const rows = entries(page.sections);
  const html = rows.map(([id,section]) => `<div class="section-row"><div class="row-icon">${esc((section.type || "S").slice(0,1).toUpperCase())}</div><div class="section-row-main"><strong>${esc(section.title || section.eyebrow || section.kicker || id)}</strong><span>${esc((section.type || "section").replace(/[A-Z]/g,m=>" "+m.toLowerCase()))} · ${esc(section.anchor || id)}</span></div><div class="section-row-actions"><button class="small-action" data-action="move-section" data-page="${esc(pageId)}" data-id="${esc(id)}" data-direction="-1">↑</button><button class="small-action" data-action="move-section" data-page="${esc(pageId)}" data-id="${esc(id)}" data-direction="1">↓</button><button class="small-action" data-action="edit-section" data-page="${esc(pageId)}" data-id="${esc(id)}">Edit</button><button class="small-action" data-action="toggle-section" data-page="${esc(pageId)}" data-id="${esc(id)}">${section.enabled === false ? "Show" : "Hide"}</button><button class="small-action danger" data-action="delete-section" data-page="${esc(pageId)}" data-id="${esc(id)}">Delete</button></div></div>`).join("");
  return `<div class="welcome-row"><div><h2>${esc(page.title || pageId)} sections</h2><p>Every section can be edited, reordered or hidden independently.</p></div><div class="welcome-actions"><button class="button button-secondary" data-action="go" data-route="pages">← All pages</button><button class="button button-primary" data-action="add-section" data-page="${esc(pageId)}">＋ Add section</button></div></div><div class="helper-box">Section content is stored in Firebase. The public site uses the section type as a reusable display template; text, items, links and visibility are managed here.</div><div class="content-list">${html || emptyMarkup("This page has no sections yet.","Add a hero, text section, services grid, portfolio grid, FAQ block or contact section.")}</div>`;
}

function renderSettings() {
  if (!can("settings")) return permissionDenied("settings");
  const s = siteContent.settings || {};
  return `<div class="welcome-row"><div><h2>Site settings</h2><p>Manage the brand details, contact destination and search metadata used across the public website.</p></div><button class="button button-primary" data-action="save-settings">Save settings ↗</button></div>
    <form id="settings-form">
      <section class="settings-card"><h3>Brand identity</h3><div class="split-grid"><div class="field"><label>Brand name<input name="brandName" value="${esc(s.brandName || "ScaleGrid")}" required></label></div><div class="field"><label>Browser / page title<input name="siteTitle" value="${esc(s.siteTitle || "")}"></label></div></div><div class="field"><label>Tagline<input name="tagline" value="${esc(s.tagline || "")}"></label></div><div class="field"><label>Website description<textarea name="siteDescription">${esc(s.siteDescription || "")}</textarea></label></div><div class="field"><label>SEO description<textarea name="seoDescription">${esc(s.seoDescription || "")}</textarea></label><small>Page descriptions may override this default.</small></div><div class="field"><label>Default Open Graph image URL<input name="ogImage" type="url" value="${esc(s.ogImage || "")}"></label></div><div class="field"><label>Default canonical URL<input name="canonicalUrl" type="url" value="${esc(s.canonicalUrl || "")}"></label></div><div class="field"><label>Public website URL<input name="publicSiteUrl" type="url" value="${esc(s.publicSiteUrl || expectedSiteUrl)}"></label><small>Used by the Admin Panel's “View website” link.</small></div></section>
      <section class="settings-card"><h3>Contact options</h3><div class="split-grid"><div class="field"><label>WhatsApp number<input name="whatsappNumber" value="${esc(s.whatsappNumber || "8801575808490")}" placeholder="8801XXXXXXXXX"></label><small>International format, digits only. Bangladesh example: 8801XXXXXXXXX.</small></div><div class="field"><label>Business email (optional)<input name="contactEmail" type="email" value="${esc(s.contactEmail || "")}" placeholder="Leave empty to hide email"></label></div></div><div class="field"><label>Prefilled WhatsApp message<textarea name="whatsappMessage">${esc(s.whatsappMessage || "Hello ScaleGrid, I'd like to discuss a project.")}</textarea></label></div><div class="field"><label>Additional contact information<textarea name="contactInfo">${esc(s.contactInfo || "")}</textarea></label></div><div class="field"><label>Footer text<input name="footerText" value="${esc(s.footerText || "")}"></label></div><label class="field-check"><input name="showWhatsApp" type="checkbox" ${s.showWhatsApp === false ? "" : "checked"}> Show WhatsApp contact button and floating shortcut</label></section>
      <div class="helper-box">Your public WhatsApp number is currently set to <strong>${esc(s.whatsappNumber || "8801575808490")}</strong>. A business email stays hidden until you enter one here.</div>
    </form>`;
}
function renderNotifications() {
  if (!can("notifications")) return permissionDenied("notifications");
  const rows = Object.entries(notificationData || {}).sort((a,b) => (Number(b[1]?.createdAt)||0)-(Number(a[1]?.createdAt)||0));
  const list = rows.map(([id,item]) => `<article class="content-row"><div class="row-icon">◉</div><div class="row-main"><strong>${esc(item.title || "Announcement")}</strong><p>${esc(item.message || "")}</p><div class="row-meta"><span class="badge badge-muted">${esc(item.target || "General")}</span><span class="badge ${item.enabled === false ? "badge-muted" : "badge-green"}">${item.enabled === false ? "Hidden" : "Published"}</span></div></div><div class="row-actions"><button class="small-action" data-action="toggle-notification" data-id="${esc(id)}">${item.enabled === false ? "Show" : "Hide"}</button><button class="small-action danger" data-action="delete-notification" data-id="${esc(id)}">Delete</button></div></article>`).join("");
  return `<div class="welcome-row"><div><h2>Announcements</h2><p>Publish short notices to the existing website notification stream. Older notification records are preserved.</p></div></div><section class="settings-card"><h3>New announcement</h3><form id="notification-form"><div class="split-grid"><div class="field"><label>Title<input name="title" required maxlength="90"></label></div><div class="field"><label>Audience label<input name="target" value="General" maxlength="40"></label></div></div><div class="field"><label>Message<textarea name="message" required maxlength="500"></textarea></label></div><div class="split-grid"><div class="field"><label>Banner image URL (optional)<input name="bannerUrl" type="url" placeholder="https://..."></label></div><div class="field"><label>Destination URL (optional)<input name="destinationUrl" type="url" placeholder="https://..."></label></div></div><button class="button button-primary" type="submit">Publish announcement ↗</button></form></section><div class="panel-title"><h3>Previous announcements</h3><span>${rows.length} record(s)</span></div><div class="content-list">${list || emptyMarkup("No announcements yet.","Your first announcement will appear here after publishing.")}</div>`;
}
const adminPermissionKeys = ["services","serviceCategories","portfolio","portfolioCategories","faqs","faqCategories","pages","sections","process","features","navigation","socialLinks","media","notifications","settings","publishing"];
function openAdminEditor(uid) {
  if (adminProfile?.role !== "super" || uid === currentUser?.uid) throw new Error("Only a Super Admin can edit another administrator.");
  const admin=adminsData?.[uid];
  if (!admin) throw new Error("This administrator record no longer exists.");
  const fields=[
    {key:"role",label:"Role",type:"select",options:[["normal","Normal admin"],["super","Super admin"]],default:"normal"},
    ...adminPermissionKeys.map(key=>({key:`permission_${key}`,label:`${key} permission`,type:"checkbox",default:admin.permissions?.[key]===true}))
  ];
  const values={role:admin.role || "normal",...Object.fromEntries(adminPermissionKeys.map(key=>[`permission_${key}`,admin.permissions?.[key]===true]))};
  openModal(`Edit administrator · ${admin.email || uid}`,renderFields(fields,values),{kind:"admin",id:uid});
}
async function saveAdminPermissions(context) {
  if (adminProfile?.role !== "super" || context.id === currentUser?.uid) throw new Error("Only a Super Admin can edit another administrator.");
  const existing=adminsData?.[context.id];
  if (!existing) throw new Error("This administrator record no longer exists.");
  const raw=readFields($("editor-fields"));
  const role=raw.role === "super" ? "super" : "normal";
  const superCount=Object.values(adminsData || {}).filter(admin=>admin?.role === "super").length;
  if (existing.role !== "super" && role === "super" && !confirm("Promote this administrator to Super Admin? They will receive full access.")) return;
  if (existing.role === "super" && role !== "super") {
    if (superCount <= 1) throw new Error("You cannot demote the last remaining Super Admin.");
    if (!confirm("Demote this Super Admin to Normal Admin? Their access will be limited to the selected permissions.")) return;
  }
  const permissions=Object.fromEntries(adminPermissionKeys.map(key=>[key,raw[`permission_${key}`]===true]));
  await update(ref(database,`admins/${context.id}`),{role,permissions});
  await writeAudit("admin-permissions","admins",context.id,`Updated role and permissions for ${existing.email || context.id}`);
}
function renderAdminAccess() {
  if (adminProfile?.role !== "super") return permissionDenied("super admin");
  const invites=Object.entries(adminInvitationsData||{});
  const inviteList=invites.map(([key,item])=>{const ready=item?.status==="claimed"&&!!item.claimedUid;return `<article class="content-row"><div class="row-icon">✉</div><div class="row-main"><strong>${esc(item.email||"Unknown email")}</strong><p>Added ${item.createdAt?new Date(item.createdAt).toLocaleString():"recently"}</p><div class="row-meta"><span class="badge ${ready?"badge-green":"badge-muted"}">${ready?"Ready for approval":"Waiting for email sign-in"}</span></div></div><div class="row-actions"><button class="small-action" data-action="accept-admin-invitation" data-id="${esc(key)}" ${ready?"":"disabled"}>Accept</button><button class="small-action danger" data-action="delete-admin-invitation" data-id="${esc(key)}">Delete</button></div></article>`;}).join("");
  const rows=Object.entries(adminsData||{});
  const list=rows.map(([uid,admin])=>`<article class="content-row"><div class="row-icon">♙</div><div class="row-main"><strong>${esc(admin.email||"Admin account")}</strong><p>${esc(uid)}</p><div class="row-meta"><span class="badge ${admin.role==="super"?"badge-green":"badge-muted"}">${esc(admin.role||"normal")}</span><span class="badge badge-muted">${Object.entries(admin.permissions||{}).filter(([,v])=>v===true).map(([k])=>k).join(", ")||(admin.role==="super"?"Full access":"No extra permissions")}</span></div></div><div class="row-actions">${uid===currentUser?.uid?`<span class="badge badge-green">You</span>`:uid==="-P6EIURxhvKTnOwy-8Ty"?`<span class="badge badge-muted">Legacy key · migration pending</span>`:`<button class="small-action" data-action="edit-admin" data-id="${esc(uid)}">Edit permissions</button><button class="small-action danger" data-action="remove-admin" data-id="${esc(uid)}">Revoke access</button>`}</div></article>`).join("");
  return `<div class="welcome-row"><div><h2>Admin access</h2><p>Add an email request, then Accept or Delete it.</p></div></div><form id="admin-invite-form" class="settings-card"><h3>Add administrator request</h3><div class="field"><label for="invite-email">Email address<input id="invite-email" name="invite-email" type="email" placeholder="person@example.com" required></label><small>Enter the email only. No UID is needed.</small></div><button class="button button-primary" type="submit">Send Request</button></form><div class="helper-box"><strong>Approval flow:</strong> the invited person signs in to the Admin Panel using this same verified email. Their request then becomes ready for your Accept or Delete decision. No Cloud Functions or paid backend are used.</div><section class="settings-card"><h3>Pending requests <span class="badge badge-muted">${invites.length}</span></h3><div class="content-list">${inviteList||emptyMarkup("No pending requests.","Email requests you add will appear here.")}</div></section><div class="panel-title"><h3>Approved administrators</h3><span>${rows.length} admin(s)</span></div><div class="content-list">${list||emptyMarkup("No admin records found.","Your existing Super Admin account should appear here.")}</div>`;
}

function renderField(field, value) {
  const id = `field-${field.key}`;
  const name = `data-field="${esc(field.key)}"`;
  if (field.type === "checkbox") return `<label class="field-check"><input type="checkbox" ${name} ${value === false ? "" : value === true || value === undefined ? "checked" : ""}> ${esc(field.label)}</label>`;
  if (field.type === "select") {
    const opts = (field.options || []).map(([v,l]) => `<option value="${esc(v)}" ${String(value ?? field.default ?? "") === String(v) ? "selected" : ""}>${esc(l)}</option>`).join("");
    return `<div class="field"><label for="${id}">${esc(field.label)}<select id="${id}" ${name} ${field.required ? "required" : ""}>${opts}</select></label>${field.help ? `<small>${esc(field.help)}</small>` : ""}</div>`;
  }
  if (["selectCategories","selectPortfolioCategories","selectFaqCategories"].includes(field.type)) {
    const source = field.type === "selectPortfolioCategories" ? "portfolioCategories" : field.type === "selectFaqCategories" ? "faqCategories" : "serviceCategories";
    const categories = entries(siteContent[source]).filter(([,item]) => item && item.enabled !== false);
    const opts = categories.map(([key,item]) => `<option value="${esc(key)}" ${String(value || "") === key ? "selected" : ""}>${esc(item.name || key)}</option>`).join("");
    return `<div class="field"><label for="${id}">${esc(field.label)}<select id="${id}" ${name} ${field.required ? "required" : ""}><option value="">Select a category</option>${opts}</select></label>${field.help ? `<small>${esc(field.help)}</small>` : ""}</div>`;
  }
  if (field.type === "selectMedia") {
    const mediaItems = entries(siteContent.media).filter(([,item]) => item && item.enabled !== false);
    const opts = mediaItems.map(([key,item]) => `<option value="${esc(key)}" ${String(value || "") === key ? "selected" : ""}>${esc(item.label || key)}</option>`).join("");
    return `<div class="field"><label for="${id}">${esc(field.label)}<select id="${id}" ${name}><option value="">No library image selected</option>${opts}</select></label>${field.help ? `<small>${esc(field.help)}</small>` : ""}</div>`;
  }
  const isArea = ["textarea","lines","tags","json"].includes(field.type);
  const stored = Array.isArray(value) ? (field.type === "json" ? JSON.stringify(value,null,2) : value.join(field.type === "lines" ? "\n" : ", ")) : String(value ?? field.default ?? "");
  const type = field.type === "url" ? "url" : field.type === "number" ? "number" : "text";
  const input = isArea ? `<textarea id="${id}" ${name} ${field.required ? "required" : ""} ${field.type === "json" ? 'spellcheck="false"' : ""}>${esc(stored)}</textarea>` : `<input id="${id}" type="${type}" ${name} value="${esc(stored)}" ${field.required ? "required" : ""} ${field.type === "number" ? 'step="1"' : ""}>`;
  return `<div class="field"><label for="${id}">${esc(field.label)}${input}</label>${field.help ? `<small>${esc(field.help)}</small>` : ""}</div>`;
}
function renderFields(fields, values = {}) { return fields.map(field => renderField(field, values[field.key])).join(""); }
function readFields(container) {
  const result = {};
  container.querySelectorAll("[data-field]").forEach(input => {
    const key = input.dataset.field;
    if (input.type === "checkbox") result[key] = input.checked;
    else if (input.type === "number") result[key] = Number(input.value || 0);
    else if (input.tagName === "TEXTAREA" && input.dataset.kind === "json") result[key] = input.value;
    else result[key] = input.value.trim();
  });
  return result;
}
function openModal(title, fieldsHtml, context) {
  editorContext = context;
  $("modal-title").textContent = title;
  $("editor-fields").innerHTML = fieldsHtml;
  $("editor-modal").hidden = false;
  document.body.style.overflow = "hidden";
  const first = $("editor-fields").querySelector("input,textarea,select");
  setTimeout(() => first?.focus(), 50);
}
function closeModal() {
  $("editor-modal").hidden = true;
  document.body.style.overflow = "";
  editorContext = null;
  $("editor-form").reset();
}
$("modal-close").addEventListener("click", closeModal);
$("modal-cancel").addEventListener("click", closeModal);
$("editor-modal").addEventListener("click", (event) => { if (event.target.dataset.modalClose) closeModal(); });

function openCollectionEditor(collection, id = null) {
  const schema = collectionSchemas[collection];
  if (!can(schema.permission)) return notify("You do not have permission to edit this content.","error");
  const existing = id ? siteContent[collection]?.[id] || {} : {};
  const order = existing.order ?? (totalCount(siteContent[collection]) + 1);
  const values = { ...existing, order, enabled: existing.enabled !== false };
  openModal(`${id ? "Edit" : "Add"} ${schema.singular}`, renderFields(schema.fields,values), {kind:"collection",collection,id,fields:schema.fields});
}
function openPageEditor(id = null) {
  if (!can("pages")) return;
  const existing = id ? siteContent.pages?.[id] || {} : {};
  const defaults = { title:"", slug:"", seoTitle:"", metaDescription:"", ogTitle:"", ogDescription:"", ogImage:"", canonicalUrl:"", status:"published", enabled:true };
  openModal(`${id ? "Edit" : "Create"} page`, renderFields([
    {key:"title",label:"Page title",type:"text",required:true},
    {key:"slug",label:"Page slug",type:"text",required:true,help:"Visitors can reach this page through a menu link such as #page/about-us."},
    {key:"seoTitle",label:"SEO title",type:"text"},
    {key:"metaDescription",label:"Meta description",type:"textarea"},
    {key:"ogTitle",label:"Open Graph title",type:"text"},
    {key:"ogDescription",label:"Open Graph description",type:"textarea"},
    {key:"ogImage",label:"Open Graph image URL",type:"url"},
    {key:"canonicalUrl",label:"Canonical URL",type:"url"},
    {key:"status",label:"Publishing status",type:"select",options:[["draft","Draft"],["published","Published"],["archived","Archived"]],default:"published"},
    {key:"enabled",label:"Visible on website",type:"checkbox",default:true}
  ],{...defaults,...existing}), {kind:"page",id});
}
function fieldsForSectionType(type) {
  return [{key:"type",label:"Section type",type:"select",options:sectionTypeOptions,default:type},...(sectionFieldsByType[type] || sectionFieldsByType.richText),...commonSectionFields];
}
function openSectionEditor(pageId,id = null) {
  if (!can("sections")) return;
  const existing = id ? siteContent.pages?.[pageId]?.sections?.[id] || {} : {};
  const type = existing.type || "richText";
  const values = { ...existing, type, order:existing.order ?? (entries(siteContent.pages?.[pageId]?.sections).length + 1), enabled:existing.enabled !== false };
  if (type === "featureGrid" && Array.isArray(existing.items)) values.itemsJson = JSON.stringify(existing.items,null,2);
  const renderSectionFields = (currentType) => {
    const sectionFields = fieldsForSectionType(currentType);
    const currentValues = { ...values, ...readFields($("editor-fields") || document.createElement("div")) };
    $("editor-fields").innerHTML = renderFields(sectionFields,currentValues);
    const json = $("editor-fields").querySelector('[data-field="itemsJson"]');
    if (json) json.dataset.kind = "json";
  };
  openModal(`${id ? "Edit" : "Add"} section`, `<div class="field"><label for="section-type">Section type<select id="section-type" data-section-type>${sectionTypeOptions.map(([key,label])=>`<option value="${key}" ${key===type?"selected":""}>${esc(label)}</option>`).join("")}</select></label><small>Choose a reusable layout. Its editable fields will appear below.</small></div><div id="section-dynamic-fields">${renderFields(fieldsForSectionType(type).filter(f=>f.key!=="type"),values)}</div>`, {kind:"section",pageId,id,values});
  // Section type selector is deliberately separate from generic data-field inputs.
  const typeSelect = $("editor-fields").querySelector("[data-section-type]");
  if (typeSelect) typeSelect.addEventListener("change", () => {
    const previous = readFields($("editor-fields"));
    editorContext.values = { ...editorContext.values, ...previous, type:typeSelect.value };
    const fields = sectionFieldsByType[typeSelect.value] || sectionFieldsByType.richText;
    $("section-dynamic-fields").innerHTML = renderFields([...fields,...commonSectionFields],editorContext.values);
    const json = $("section-dynamic-fields").querySelector('[data-field="itemsJson"]');
    if (json) json.dataset.kind = "json";
  });
  // Ensure an existing feature-grid JSON array is rendered in the editor.
  const jsonField = $("editor-fields").querySelector('[data-field="itemsJson"]');
  if (jsonField) jsonField.dataset.kind = "json";
}

$("editor-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const context = editorContext;
    if (!context) return;
    if (context.kind === "collection") await saveCollection(context);
    else if (context.kind === "page") await savePage(context);
    else if (context.kind === "section") await saveSection(context);
    else if (context.kind === "admin") await saveAdminPermissions(context);
    else if (context.kind === "admin-invitation") await acceptAdminInvitation(context);
    closeModal();
    notify("Changes saved to Firebase.");
  } catch (error) {
    console.error(error);
    notify(error.message || "Could not save changes.","error");
  }
});
function ensureValidUrl(value, label, allowAnchor = true) {
  if (!value) return;
  if (allowAnchor && value.startsWith("#")) return;
  try { const parsed = new URL(value); if (!["http:","https:","mailto:","tel:"].includes(parsed.protocol)) throw new Error(); }
  catch { throw new Error(`${label} must be a valid link${allowAnchor ? " or page anchor" : ""}.`); }
}
function ensureWebUrl(value,label,allowAnchor=false) {
  if (!value) return;
  if (allowAnchor && value.startsWith("#")) return;
  try { const parsed = new URL(value); if (!["http:","https:"].includes(parsed.protocol)) throw new Error(); }
  catch { throw new Error(`${label} must be an HTTPS or HTTP web address${allowAnchor ? " or page anchor" : ""}.`); }
}
function ensureImageReference(value,label) {
  const raw = String(value || "").trim();
  if (!raw) return;
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return ensureWebUrl(raw,label,false);
  if (raw.startsWith("//") || raw.startsWith("/") || raw.startsWith("./") || raw.startsWith("../") || /^[a-z0-9_-]+\//i.test(raw)) return;
  throw new Error(`${label} must be a public HTTPS URL or a relative image path.`);
}
function convertFields(raw, fields) {
  const result = {};
  for (const field of fields) {
    let value = raw[field.key];
    if (field.required && (value === undefined || value === null || String(value).trim() === "")) throw new Error(`${field.label} is required.`);
    if (field.type === "lines") value = String(value || "").split("\n").map(x=>x.trim()).filter(Boolean);
    if (field.type === "tags") value = String(value || "").split(",").map(x=>x.trim()).filter(Boolean);
    if (field.type === "json") {
      try { value = value ? JSON.parse(value) : []; }
      catch { throw new Error(`${field.label} must contain valid JSON.`); }
      if (!Array.isArray(value)) throw new Error(`${field.label} must be a JSON array.`);
    }
    if (field.type === "url" && value) ensureWebUrl(value,field.label,field.allowAnchor === true);
    if (["selectCategories","selectPortfolioCategories","selectFaqCategories"].includes(field.type) && value) {
      const source = field.type === "selectPortfolioCategories" ? "portfolioCategories" : field.type === "selectFaqCategories" ? "faqCategories" : "serviceCategories";
      if (!siteContent[source]?.[value] || siteContent[source][value].enabled === false) throw new Error(`Choose a valid ${source === "portfolioCategories" ? "portfolio" : source === "faqCategories" ? "FAQ" : "service"} category first.`);
    }
    result[field.key] = value;
  }
  return result;
}
async function uniqueId(collection, proposed, existingId = null) {
  const base = safeKey(proposed);
  if (existingId) return existingId;
  let key = base, i = 2;
  while (siteContent[collection]?.[key]) { key = `${base}-${i++}`; }
  return key;
}
async function saveCollection(context) {
  const schema = collectionSchemas[context.collection];
  if (!can(schema.permission)) throw new Error(`You do not have permission to manage ${schema.label.toLowerCase()} records.`);
  const raw = readFields($("editor-fields"));
  const payload = convertFields(raw,schema.fields);
  if (payload.slug === "") delete payload.slug;
  if (context.collection === "serviceCategories" && !payload.slug) payload.slug = safeKey(payload.name);
  if (context.collection === "services") {
    if (payload.ctaUrl) ensureValidUrl(payload.ctaUrl,"Button link",true);
    if (payload.features?.length > 12) throw new Error("Please limit service feature tags to 12 or fewer.");
  }
  if (context.collection === "navigation") ensureValidUrl(payload.href,"Navigation link",true);
  if (["services","portfolio"].includes(context.collection) && payload.imageUrl) ensureImageReference(payload.imageUrl,"Image URL");
  if (context.collection === "portfolio" && payload.projectUrl) ensureWebUrl(payload.projectUrl,"Project URL",false);
  if (context.collection === "media" && payload.url) ensureImageReference(payload.url,"Media URL");
  if (context.collection === "socialLinks" && payload.url) ensureValidUrl(payload.url,"Social URL",false);
  const id = await uniqueId(context.collection, payload[schema.primary] || payload.name || payload.label, context.id);
  const existing = siteContent[context.collection]?.[id] || null;
  if (existing) await push(ref(database,`siteContentHistory/${context.collection}/${id}`),{record:existing,uid:currentUser?.uid || "",timestamp:Date.now(),reason:"before-edit"});
  await set(ref(database,`siteContent/${context.collection}/${id}`),payload);
  await writeAudit(existing ? "update" : "create",context.collection,id,`${existing ? "Updated" : "Created"} ${schema.label.toLowerCase()}`);
}
async function savePage(context) {
  if (!can("pages")) throw new Error("You do not have permission to edit pages.");
  const raw = readFields($("editor-fields"));
  if (context.id === "home" && (raw.enabled === false || ["draft","archived"].includes(raw.status))) throw new Error("The Home page cannot be hidden, drafted, or archived.");
  const fields = [{key:"title",label:"Page title",required:true},{key:"slug",label:"Page slug",required:true},{key:"metaDescription"},{key:"enabled"}];
  if (!raw.title || !raw.slug) throw new Error("Page title and slug are required.");
  const id = context.id || await uniquePageId(raw.slug);
  const existing = siteContent.pages?.[id] || {};
  const slug = safeKey(raw.slug);
  if (!slug) throw new Error("Enter a URL-friendly page slug.");
  const duplicate = entries(siteContent.pages).find(([otherId,page]) => otherId !== id && page?.slug === slug);
  if (duplicate) throw new Error("Another page already uses this slug. Choose a unique slug.");
  const payload = { ...existing, title:raw.title, slug, seoTitle:raw.seoTitle || "", metaDescription:raw.metaDescription || "", ogTitle:raw.ogTitle || "", ogDescription:raw.ogDescription || "", ogImage:raw.ogImage || "", canonicalUrl:raw.canonicalUrl || "", status:raw.status || existing.status || "published", enabled:raw.enabled !== false };
  if (payload.ogImage) ensureImageReference(payload.ogImage,"Open Graph image");
  if (payload.canonicalUrl) ensureWebUrl(payload.canonicalUrl,"Canonical URL",false);
  if (existing && context.id) await push(ref(database,`siteContentHistory/pages/${id}`),{record:existing,uid:currentUser?.uid || "",timestamp:Date.now(),reason:"before-edit"});
  const pagePatch = Object.fromEntries(Object.entries(payload).map(([key,value])=>[`siteContent/pages/${id}/${key}`,value]));
  await update(ref(database),pagePatch);
  await writeAudit(context.id ? "update" : "create","pages",id,`${context.id ? "Updated" : "Created"} page`);
}
async function uniquePageId(proposed) {
  const base = safeKey(proposed); let id=base, i=2;
  while (siteContent.pages?.[id]) id=`${base}-${i++}`;
  return id;
}
async function saveSection(context) {
  if (!can("sections")) throw new Error("You do not have permission to edit sections.");
  const type = $("editor-fields").querySelector("[data-section-type]")?.value || context.values?.type || "richText";
  const fields = [...(sectionFieldsByType[type] || sectionFieldsByType.richText),...commonSectionFields];
  const raw = readFields($("editor-fields"));
  const payload = convertFields(raw,fields);
  payload.type = type;
  const pageId = context.pageId;
  const proposed = payload.anchor || payload.title || type;
  const sectionId = context.id || await uniqueSectionId(pageId,proposed);
  const existing = siteContent.pages?.[pageId]?.sections?.[sectionId] || null;
  if (existing) await push(ref(database,`siteContentHistory/sections/${pageId}_${sectionId}`),{record:existing,uid:currentUser?.uid || "",timestamp:Date.now(),reason:"before-edit"});
  await set(ref(database,`siteContent/pages/${pageId}/sections/${sectionId}`),payload);
  await writeAudit(existing ? "update" : "create","sections",`${pageId}/${sectionId}`,`${existing ? "Updated" : "Created"} page section`);
}
async function uniqueSectionId(pageId,proposed) {
  const current = siteContent.pages?.[pageId]?.sections || {};
  const base = safeKey(proposed); let id=base, i=2;
  while(current[id]) id=`${base}-${i++}`;
  return id;
}

async function openItemHistory(collection,id) {
  if (!can(collectionSchemas[collection]?.permission)) throw new Error("You do not have permission to view this content history.");
  const snapshot = await get(ref(database,`siteContentHistory/${collection}/${id}`));
  const versions = snapshot.exists() ? Object.entries(snapshot.val()).sort((a,b)=>(Number(b[1]?.timestamp)||0)-(Number(a[1]?.timestamp)||0)) : [];
  historyContext = {collection,id};
  const content = versions.length ? versions.map(([version,item],index)=>`<article class="content-row"><div class="row-main"><strong>Version ${versions.length-index}</strong><p>${new Date(Number(item.timestamp)||0).toLocaleString()} · ${esc(item.reason||"saved version")} · ${esc(item.uid||"unknown admin")}</p><pre class="history-preview">${esc(JSON.stringify(item.record,null,2).slice(0,1800))}</pre></div><div class="row-actions"><button class="small-action" data-action="restore-version" data-version="${esc(version)}">Restore</button></div></article>`).join("") : emptyMarkup("No saved versions yet.","A snapshot is saved before future edits and deletions.");
  historyContext = {collection,id};
  $("history-title").textContent = `History · ${collection} / ${id}`;
  $("history-content").innerHTML = content;
  $("history-modal").hidden = false;
  document.body.style.overflow = "hidden";
}
async function restoreItemVersion(version) {
  if (!historyContext) throw new Error("No history record is selected.");
  const {collection,id}=historyContext;
  if (!can(collectionSchemas[collection]?.permission)) throw new Error("You do not have permission to restore this record.");
  const snap=await get(ref(database,`siteContentHistory/${collection}/${id}/${version}`));
  if (!snap.exists() || !snap.val()?.record) throw new Error("The selected version is no longer available.");
  const current=siteContent[collection]?.[id];
  if(current) await push(ref(database,`siteContentHistory/${collection}/${id}`),{record:current,uid:currentUser?.uid||"",timestamp:Date.now(),reason:"before-restore"});
  await set(ref(database,`siteContent/${collection}/${id}`),snap.val().record);
  await writeAudit("restore",collection,id,`Restored content version ${version}`);
  $("history-modal").hidden = true;
  document.body.style.overflow = "";
  historyContext = null;
  notify("Previous content version restored.");
}
// Collection actions
async function toggleCollectionItem(collection,id) {
  if (!can(collectionSchemas[collection].permission)) return notify("Permission denied.","error");
  const current = siteContent[collection]?.[id]?.enabled !== false;
  await update(ref(database,`siteContent/${collection}/${id}`),{enabled:!current});
  notify(`Item ${current ? "hidden" : "published"}.`);
}
async function deleteCollectionItem(collection,id) {
  if (!can(collectionSchemas[collection].permission)) return;
  const linkedCollection = collection === "serviceCategories" ? "services" : collection === "portfolioCategories" ? "portfolio" : collection === "faqCategories" ? "faqs" : null;
  if (linkedCollection) {
    const linked = entries(siteContent[linkedCollection]).filter(([,item]) => item.categoryId === id).length;
    if (linked) return notify(`This category is assigned to ${linked} ${linkedCollection} record(s). Reassign them before deleting the category.`,"error");
  }
  if (!confirm("Delete this item permanently? This cannot be undone.")) return;
  const old = siteContent[collection]?.[id] || null;
  if (old) await push(ref(database,`siteContentHistory/${collection}/${id}`),{record:old,uid:currentUser?.uid || "",timestamp:Date.now(),reason:"before-delete"});
  await remove(ref(database,`siteContent/${collection}/${id}`));
  await writeAudit("delete",collection,id,`Deleted ${collection} record`);
  notify("Item deleted.");
}
async function setSectionEnabled(pageId,id,enabled) { if (!can("sections")) throw new Error("You do not have permission to manage sections."); await update(ref(database,`siteContent/pages/${pageId}/sections/${id}`),{enabled}); }
async function moveSection(pageId,id,direction) {
  if (!can("sections")) throw new Error("You do not have permission to manage sections.");
  const rows = entries(siteContent.pages?.[pageId]?.sections);
  const index = rows.findIndex(([key])=>key===id);
  const target = rows[index + direction];
  if (index < 0 || !target) return;
  const currentOrder = Number(rows[index][1].order) || index+1;
  const targetOrder = Number(target[1].order) || index+direction+1;
  await update(ref(database,`siteContent/pages/${pageId}/sections`),{
    [`${id}/order`]:targetOrder,[`${target[0]}/order`]:currentOrder
  });
}

// Settings / announcements / admin users
async function saveSettings() {
  if (!can("settings")) return notify("Permission denied.","error");
  const form = $("settings-form");
  if (!form.reportValidity()) return;
  const data = Object.fromEntries(new FormData(form).entries());
  const showWhatsApp = form.elements.showWhatsApp.checked;
  if (data.publicSiteUrl) ensureWebUrl(data.publicSiteUrl,"Public website URL",false);
  if (data.ogImage) ensureImageReference(data.ogImage,"Open Graph image");
  if (data.canonicalUrl) ensureWebUrl(data.canonicalUrl,"Canonical URL",false);
  const number = String(data.whatsappNumber || "").replace(/\D/g,"");
  if (showWhatsApp && number.length < 8) throw new Error("Enter a valid international WhatsApp number or turn off the WhatsApp button.");
  data.whatsappNumber = number;
  data.showWhatsApp = showWhatsApp;
  await update(ref(database,"siteContent/settings"),data);
  await writeAudit("update","settings","settings","Updated website settings");
  notify("Website settings saved.");
}
async function addNotification(form) {
  if (!can("notifications")) return;
  const data = Object.fromEntries(new FormData(form).entries());
  if (!data.title?.trim() || !data.message?.trim()) throw new Error("A title and message are required.");
  if (data.bannerUrl) ensureWebUrl(data.bannerUrl,"Banner image URL",false);
  if (data.destinationUrl) ensureWebUrl(data.destinationUrl,"Announcement destination URL",false);
  const created = await push(ref(database,"notifications"),{...data,title:data.title.trim(),message:data.message.trim(),createdAt:Date.now(),enabled:true});
  await writeAudit("create","notifications",created.key,"Created announcement");
  form.reset(); notify("Announcement published.");
}
async function toggleNotification(id) {
  const current = notificationData[id]?.enabled !== false;
  await update(ref(database,`notifications/${id}`),{enabled:!current});
}
async function deleteNotification(id) {
  if (!confirm("Delete this announcement permanently?")) return;
  await remove(ref(database,`notifications/${id}`));
}
function emailInvitationKey(email) { return btoa(String(email).trim().toLowerCase()).replace(/\\+/g,"-").replace(/\\//g,"_").replace(/=+$/g,""); }
async function sendAdminInvitation(form) {
  if (adminProfile?.role !== "super") throw new Error("Only a Super Admin can invite administrators.");
  const email=String(form.querySelector('[name="invite-email"]')?.value||"").trim().toLowerCase();
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) throw new Error("Enter a valid email address.");
  if (Object.values(adminsData||{}).some(a=>String(a?.email||"").toLowerCase()===email)) throw new Error("This email is already an administrator.");
  const key=emailInvitationKey(email), invitationRef=ref(database,`adminInvitations/${key}`);
  if ((await get(invitationRef)).exists()) throw new Error("An invitation for this email is already pending.");
  await set(invitationRef,{email,status:"invited",createdAt:Date.now(),createdBy:currentUser.uid});
  await writeAudit("admin-invite","adminInvitations",key,`Created invitation for ${email}`);
  form.reset(); notify(`Request added for ${email}`);
}
function openAdminInvitationEditor(key) {
  const invitation=adminInvitationsData?.[key];
  if (adminProfile?.role!=="super") throw new Error("Only a Super Admin can accept invitations.");
  if (!invitation?.claimedUid || invitation.status!=="claimed") throw new Error("The invited person must sign in with this email before you can accept.");
  const fields=[{key:"role",label:"Role",type:"select",options:[["normal","Normal admin"],["super","Super admin"]],default:"normal"},...adminPermissionKeys.map(key=>({key:`permission_${key}`,label:`${key} permission`,type:"checkbox",default:false}))];
  const values={role:"normal",...Object.fromEntries(adminPermissionKeys.map(key=>[`permission_${key}`,false]))};
  openModal(`Accept invitation · ${invitation.email}`,renderFields(fields,values),{kind:"admin-invitation",id:key});
}
async function acceptAdminInvitation(context) {
  if (adminProfile?.role!=="super") throw new Error("Only a Super Admin can accept invitations.");
  const invitation=adminInvitationsData?.[context.id], uid=invitation?.claimedUid;
  if (!invitation || invitation.status!=="claimed" || !uid) throw new Error("The invited person has not signed in with that email yet.");
  const raw=readFields($("editor-fields")), role=raw.role==="super"?"super":"normal";
  if (role==="super" && !confirm("Accept as Super Admin? This grants full access.")) return;
  const permissions=role==="super"?Object.fromEntries(adminPermissionKeys.map(k=>[k,true])):Object.fromEntries(adminPermissionKeys.map(k=>[k,raw[`permission_${k}`]===true]));
  const writes={}; writes[`admins/${uid}`]={email:String(invitation.email).toLowerCase(),role,permissions,createdAt:Date.now(),approvedBy:currentUser.uid}; writes[`adminUids/${uid}`]=true; writes[`adminInvitations/${context.id}`]=null;
  await update(ref(database),writes); await writeAudit("admin-create","admins",uid,`Accepted invitation for ${invitation.email}`); notify(`Administrator accepted: ${invitation.email}`);
}
async function deleteAdminInvitation(key) {
  if (adminProfile?.role!=="super") throw new Error("Only a Super Admin can delete invitations.");
  const invitation=adminInvitationsData?.[key]; if (!invitation) throw new Error("Invitation no longer exists.");
  if (!confirm(`Delete the invitation for ${invitation.email}?`)) return;
  await remove(ref(database,`adminInvitations/${key}`)); await writeAudit("admin-invite-delete","adminInvitations",key,`Deleted invitation for ${invitation.email}`); notify("Invitation deleted.");
}

async function removeAdmin(uid) {
  if (adminProfile?.role !== "super" || uid === currentUser?.uid) return;
  if (uid === "-P6EIURxhvKTnOwy-8Ty") throw new Error("The legacy push-key profile is protected until its actual Authentication UID is verified.");
  const target=adminsData?.[uid];
  if (!target) throw new Error("This administrator record no longer exists.");
  const superCount=Object.values(adminsData || {}).filter(admin=>admin?.role === "super").length;
  if (target.role === "super" && superCount <= 1) throw new Error("You cannot revoke the last remaining Super Admin.");
  if (!confirm(`Revoke access for ${target.email || uid}? Their Firebase Authentication account will not be deleted.`)) return;
  const writes={};
  writes[`admins/${uid}`]=null;
  writes[`adminUids/${uid}`]=null;
  await update(ref(database),writes);
  await writeAudit("admin-revoke","admins",uid,"Revoked administrator access");
  notify("Administrator access revoked.");
}

function flattenPatch(prefix,value,out={}) {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [key,child] of Object.entries(value)) flattenPatch(`${prefix}/${key}`,child,out);
  } else out[prefix]=value;
  return out;
}
async function installStarter() {
  if (adminProfile?.role !== "super") return notify("Only the Super Admin can install the starter content pack.","error");
  if (!confirm("Install the editable ScaleGrid starter content? Existing values will not be overwritten. This will add service categories, services, concept portfolio entries, FAQs, process steps, navigation, site settings and the home page.")) return;
  try {
    const missing = fillMissing(siteContent,starterContent);
    const paths = Object.entries(missing);
    if (!paths.length) return notify("Starter content is already installed or all values have been customised.");
    for (const [key,value] of paths) {
      if (key === "pages") {
        const patch = flattenPatch("siteContent/pages",value);
        await update(ref(database),patch);
      } else {
        await update(ref(database,`siteContent/${key}`),value);
      }
    }
    notify("Starter content installed. You can now edit every item from this dashboard.");
  } catch (error) {
    console.error(error);
    notify(error.message || "Starter content could not be installed. Check your Firebase permissions.","error");
  }
}
function fillMissing(existing, template) {
  const missing = {};
  for (const [key,value] of Object.entries(template || {})) {
    if (existing == null || !Object.prototype.hasOwnProperty.call(existing,key) || existing[key] === null) {
      missing[key] = value;
    } else if (value && typeof value === "object" && !Array.isArray(value) && existing[key] && typeof existing[key] === "object" && !Array.isArray(existing[key])) {
      const nested = fillMissing(existing[key],value);
      if (Object.keys(nested).length) missing[key] = nested;
    }
  }
  return missing;
}

// Central event delegation for dynamically rendered controls.
$("history-modal").addEventListener("click", async (event) => {
  if (event.target.closest("[data-history-close]")) {
    $("history-modal").hidden = true;
    document.body.style.overflow = "";
    historyContext = null;
    return;
  }
  const restore = event.target.closest('[data-action="restore-version"]');
  if (restore) {
    try { await restoreItemVersion(restore.dataset.version); }
    catch (error) { notify(error.message || "Restore failed.","error"); }
  }
});
$("content-view").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const { action, collection, id, route:nextRoute, page, direction } = button.dataset;
  try {
    switch (action) {
      case "go": navigate(nextRoute); break;
      case "install-starter": await installStarter(); break;
      case "publish-now": await publishWebsite(); break;
      case "download-backup": downloadBackup(); break;
      case "load-activity": await loadActivity(); break;
      case "add-item": openCollectionEditor(collection); break;
      case "edit-item": openCollectionEditor(collection,id); break;
      case "item-history": await openItemHistory(collection,id); break;
      case "restore-version": await restoreItemVersion(button.dataset.version); break;
      case "toggle-item": await toggleCollectionItem(collection,id); break;
      case "delete-item": await deleteCollectionItem(collection,id); break;
      case "add-page": openPageEditor(); break;
      case "edit-page": openPageEditor(id); break;
      case "manage-sections": selectedPageId=id; navigate("sections"); break;
      case "toggle-page": {
        if (!can("pages")) throw new Error("You do not have permission to manage pages.");
        if (id === "home") { notify("The home page cannot be unpublished.","error"); break; }
        const current = siteContent.pages?.[id]?.enabled !== false;
        await update(ref(database),{[`siteContent/pages/${id}/enabled`]:!current}); break;
      }
      case "delete-page": {
        if (!can("pages") || !can("sections")) throw new Error("Deleting a page requires both Pages and Sections permissions.");
        if (id === "home") break;
        if (confirm("Delete this page and all its sections?")) {
          const old=siteContent.pages?.[id];
          if(old) await push(ref(database,`siteContentHistory/pages/${id}`),{record:old,uid:currentUser?.uid||"",timestamp:Date.now(),reason:"before-delete"});
          await Promise.all(["title","slug","metaDescription","status","enabled","seoTitle","ogTitle","ogDescription","ogImage","canonicalUrl","sections"].map(key=>remove(ref(database,`siteContent/pages/${id}/${key}`))));
          await writeAudit("delete","pages",id,"Deleted page");
        }
        break;
      }
      case "add-section": openSectionEditor(page); break;
      case "edit-section": openSectionEditor(page,id); break;
      case "toggle-section": if (!can("sections")) throw new Error("You do not have permission to manage sections."); await setSectionEnabled(page,id,siteContent.pages?.[page]?.sections?.[id]?.enabled === false); break;
      case "delete-section": if (!can("sections")) throw new Error("You do not have permission to manage sections."); if (confirm("Delete this section permanently?")) { const old=siteContent.pages?.[page]?.sections?.[id]; if(old) await push(ref(database,`siteContentHistory/sections/${page}_${id}`),{record:old,uid:currentUser?.uid||"",timestamp:Date.now(),reason:"before-delete"}); await remove(ref(database,`siteContent/pages/${page}/sections/${id}`)); await writeAudit("delete","sections",`${page}/${id}`,"Deleted page section"); } break;
      case "move-section": await moveSection(page,id,Number(direction)); break;
      case "save-settings": await saveSettings(); break;
      case "toggle-notification": await toggleNotification(id); break;
      case "delete-notification": await deleteNotification(id); break;
      case "remove-admin": await removeAdmin(id); break;
      case "edit-admin": openAdminEditor(id); break;
      case "accept-admin-invitation": openAdminInvitationEditor(id); break;
      case "delete-admin-invitation": await deleteAdminInvitation(id); break;
      default: break;
    }
  } catch (error) {
    console.error(error);
    notify(error.message || "The action could not be completed.","error");
  }
});
$("content-view").addEventListener("submit", async (event) => {
  if (event.target.id === "notification-form") {
    event.preventDefault();
    try { await addNotification(event.target); } catch (error) { notify(error.message,"error"); }
  }
  if (event.target.id === "admin-invite-form") {
    event.preventDefault();
    try { await sendAdminInvitation(event.target); } catch(error) { notify(error.message || "Could not add invitation.","error"); }
  }
  if (event.target.id === "backup-restore-form") {
    event.preventDefault();
    try { await restoreBackup(event.target); } catch (error) { notify(error.message || "Backup restore failed.","error"); }
  }
});
$("content-view").addEventListener("input", (event) => {
  if (event.target.matches('[data-filter="collection"]')) {
    const query = event.target.value.toLowerCase();
    $("collection-list")?.querySelectorAll(".content-row").forEach(row => { row.hidden = !row.textContent.toLowerCase().includes(query); });
  }
});

// Handle JSON field display after modal rerenders.
$("editor-fields").addEventListener("input", (event) => {
  if (event.target.matches('[data-field="itemsJson"]')) event.target.dataset.kind = "json";
});
