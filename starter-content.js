// Optional first-run content. The public website does not hardcode or display this data.
// The Admin Panel writes this starter pack into Firebase only when the owner clicks
// “Install starter content”, after which every item is editable or removable.
export const starterContent = {
  settings: {
    brandName: "ScaleGrid",
    siteTitle: "ScaleGrid — Digital Solutions",
    tagline: "Digital solutions that move your business forward.",
    siteDescription: "ScaleGrid helps businesses plan and build websites, applications, digital campaigns and workflow automation.",
    publicSiteUrl: "https://fmd147726-crypto.github.io/ScaleGrid-User-Site/",
    whatsappNumber: "8801575808490",
    whatsappMessage: "Hello ScaleGrid, I'd like to discuss a project.",
    showWhatsApp: true,
    contactEmail: ""
  },
  navigation: {
    home: { label: "Home", href: "#home", order: 1, enabled: true },
    services: { label: "Services", href: "#services", order: 2, enabled: true },
    work: { label: "Our work", href: "#work", order: 3, enabled: true },
    about: { label: "About", href: "#about", order: 4, enabled: true },
    process: { label: "Process", href: "#process", order: 5, enabled: true },
    faq: { label: "FAQ", href: "#faq", order: 6, enabled: true },
    contact: { label: "Contact", href: "#contact", order: 7, enabled: true }
  },
  serviceCategories: {
    websites: { name: "Websites & Web Apps", slug: "websites-web-apps", description: "Business websites, landing pages and browser-based platforms.", icon: "⌘", order: 1, enabled: true },
    applications: { name: "Apps & Software", slug: "apps-software", description: "Mobile applications and tailored software experiences.", icon: "▣", order: 2, enabled: true },
    advertising: { name: "Advertising & Campaigns", slug: "advertising-campaigns", description: "Digital advertising and campaign support.", icon: "↗", order: 3, enabled: true },
    automation: { name: "Business Automation", slug: "business-automation", description: "Connected workflows that reduce repetitive work.", icon: "⌁", order: 4, enabled: true },
    custom: { name: "Custom Digital Solutions", slug: "custom-digital-solutions", description: "Purpose-built digital tools for specific business needs.", icon: "✳", order: 5, enabled: true }
  },
  services: {
    businessWebsites: { title: "Website Design & Development", categoryId: "websites", summary: "Clear, responsive websites that help your business present its value and turn visits into enquiries.", description: "From focused landing pages to multi-page business websites, we can shape an online presence around your goals.", features: ["Business websites", "Landing pages", "E-commerce experiences"], icon: "⌘", ctaLabel: "Discuss a website", ctaUrl: "#contact", order: 1, enabled: true },
    apps: { title: "Apps & Web Applications", categoryId: "applications", summary: "Useful digital products designed around the people who need to use them.", description: "Plan and build application experiences, internal tools and customer-facing platforms with a clear scope.", features: ["Web applications", "Mobile app concepts", "Internal tools"], icon: "▣", ctaLabel: "Discuss an app", ctaUrl: "#contact", order: 2, enabled: true },
    campaigns: { title: "Digital Ads & Campaigns", categoryId: "advertising", summary: "Structured campaign planning and creative support for reaching the right audience.", description: "Campaign scope, creative direction and measurement should be matched to your goals and available budget.", features: ["Campaign planning", "Ad creative", "Performance review"], icon: "↗", ctaLabel: "Plan a campaign", ctaUrl: "#contact", order: 3, enabled: true },
    automation: { title: "Workflow Automation", categoryId: "automation", summary: "Connect repeatable steps so your team can spend less time on manual tasks.", description: "Map a workflow first, then choose appropriate integrations and automation steps.", features: ["Workflow mapping", "Tool integrations", "Process automation"], icon: "⌁", ctaLabel: "Explore automation", ctaUrl: "#contact", order: 4, enabled: true },
    custom: { title: "Custom Digital Solutions", categoryId: "custom", summary: "A practical approach to digital problems that do not fit a ready-made package.", description: "Discuss the problem, constraints and desired outcome so a suitable solution can be scoped.", features: ["Requirements planning", "Custom interfaces", "Technical consulting"], icon: "✳", ctaLabel: "Share your idea", ctaUrl: "#contact", order: 5, enabled: true }
  },
  portfolioCategories: {
    websites: { name: "Websites", description: "Website and landing-page work", icon: "⌘", order: 1, enabled: true },
    applications: { name: "Applications", description: "Apps and software experiences", icon: "▣", order: 2, enabled: true },
    advertising: { name: "Campaigns", description: "Advertising and creative campaigns", icon: "↗", order: 3, enabled: true }
  },
  portfolio: {
    launchpad: { title: "Launchpad — Business Website Concept", categoryId: "websites", projectType: "concept", summary: "A concept for a clear, responsive business website with focused service information and enquiry paths.", description: "Illustrative concept only. This is not a published client project or a claim of delivered results.", tags: ["Website", "Responsive design", "UI concept"], imageUrl: "", imageAlt: "Abstract preview for the Launchpad website concept", projectUrl: "", order: 1, enabled: true },
    marketflow: { title: "MarketFlow — Commerce Experience Concept", categoryId: "applications", projectType: "concept", summary: "A storefront experience concept focused on product discovery, a simple journey and useful details.", description: "Illustrative concept only. Replace this entry with a real project when you have one approved for display.", tags: ["Commerce", "Product UX", "Web app"], imageUrl: "", imageAlt: "Abstract preview for the MarketFlow commerce concept", projectUrl: "", order: 2, enabled: true },
    campaignlens: { title: "Campaign Lens — Reporting Concept", categoryId: "advertising", projectType: "concept", summary: "A sample dashboard concept for organising campaign information and making reporting easier to review.", description: "Illustrative concept only. No real advertising results or client outcomes are being claimed.", tags: ["Dashboard", "Campaigns", "Data UI"], imageUrl: "", imageAlt: "Abstract preview for the Campaign Lens reporting concept", projectUrl: "", order: 3, enabled: true }
  },
  faqCategories: {
    "getting-started": { name: "Getting started", description: "Starting a conversation with ScaleGrid", order: 1, enabled: true },
    "projects-pricing": { name: "Projects & pricing", description: "Project scope, delivery and pricing", order: 2, enabled: true }
  },
  faqs: {
    scope: { question: "What kind of projects can I discuss with ScaleGrid?", answer: "You can discuss websites, web applications, mobile app ideas, digital advertising campaigns, workflow automation and other custom digital requirements. We can first understand your goal and then discuss a suitable scope.", categoryId: "getting-started", order: 1, enabled: true },
    start: { question: "How do I get started?", answer: "Send a short message describing what you need, your main goal and any deadline or reference you already have. We can use that to start a project conversation.", categoryId: "getting-started", order: 2, enabled: true },
    pricing: { question: "How is project pricing determined?", answer: "Pricing depends on the scope, features, integrations, content and delivery requirements. Share your requirements so the work can be understood before a price is discussed.", categoryId: "projects-pricing", order: 3, enabled: true },
    timeline: { question: "How long will my project take?", answer: "The timeline depends on the size of the project, how quickly decisions and content are provided, and any required third-party services. A realistic timeline can be discussed after the scope is understood.", categoryId: "projects-pricing", order: 4, enabled: true },
    revisions: { question: "Can I request changes during a project?", answer: "The expected review and revision process should be agreed when the project scope is confirmed. Larger changes may affect the timeline or cost.", categoryId: "projects-pricing", order: 5, enabled: true },
    access: { question: "Will I be able to manage my website content?", answer: "For projects that include a content management setup, the editing controls and access will be agreed as part of the project requirements.", category: "Websites & apps", order: 6, enabled: true },
    automation: { question: "Can you automate a process we already use?", answer: "Often, yes. The first step is to map the current process, the tools involved and any security or approval requirements. Some tools may have integration limits or subscription costs.", category: "Automation", order: 7, enabled: true }
  },
  process: {
    discovery: { title: "Understand the goal", description: "We begin with the problem to solve, the people involved and what a useful outcome looks like.", order: 1, enabled: true },
    scope: { title: "Define the scope", description: "Agree on the key requirements, priorities, content, integrations and practical constraints.", order: 2, enabled: true },
    plan: { title: "Plan the solution", description: "Shape the structure, user experience and delivery steps before implementation.", order: 3, enabled: true },
    build: { title: "Build and review", description: "Develop the agreed solution and review it against the requirements.", order: 4, enabled: true },
    handover: { title: "Launch and hand over", description: "Prepare the launch, provide the agreed handover and clarify any ongoing support.", order: 5, enabled: true }
  },
  features: {
    clarity: { title: "Start with clarity", description: "Define the problem, audience and desired outcome before choosing a technology.", icon: "◎", order: 1, enabled: true },
    people: { title: "Designed for people", description: "Make each experience easy to understand, navigate and use across devices.", icon: "◇", order: 2, enabled: true },
    purpose: { title: "Built with purpose", description: "Choose features and integrations that serve the agreed scope instead of adding complexity.", icon: "⌘", order: 3, enabled: true }
  },
  media: {},
  socialLinks: {},
  pages: {
    home: {
      title: "Home",
      slug: "home",
      metaDescription: "ScaleGrid helps businesses plan and build websites, applications, digital campaigns and workflow automation.",
      enabled: true,
      sections: {
        hero: { type: "hero", eyebrow: "DIGITAL SOLUTIONS STUDIO", title: "Your next digital advantage | starts here.", subtitle: "ScaleGrid helps businesses turn ideas into useful digital experiences — from websites and applications to campaigns and automation.", primaryLabel: "Discuss your project", primaryHref: "https://wa.me/8801575808490", secondaryLabel: "Explore services", secondaryHref: "#services", footnote: "A clear conversation is the first step toward a useful solution.", visualLabel1: "WEB & APPS", visualText1: "Digital experiences", visualLabel2: "AUTOMATION", visualText2: "Smarter workflows", visualLabel3: "CAMPAIGNS", visualText3: "Reach the right audience", anchor: "home", order: 1, enabled: true },
        services: { type: "serviceGrid", kicker: "WHAT WE DO", title: "Digital tools for real business needs.", subtitle: "Explore the areas where ScaleGrid can help you plan, build and improve your digital presence.", anchor: "services", order: 2, enabled: true },
        portfolio: { type: "portfolioGrid", kicker: "SELECTED CONCEPTS", title: "Ideas brought to life through thoughtful design.", subtitle: "These starter entries are clearly labelled concept projects. Replace them with your own approved work whenever you're ready.", anchor: "work", order: 3, enabled: true },
        why: { type: "featureGrid", kicker: "THE SCALEGRID APPROACH", title: "Focused on the outcome, not just the tools.", subtitle: "A good digital solution starts with understanding what the business and its audience actually need.", anchor: "why-scalegrid", order: 4, enabled: true },
        about: { type: "richText", kicker: "ABOUT SCALEGRID", title: "A practical partner for your next digital step.", lead: "Your business does not need more digital noise. It needs the right solution for the next stage.", body: "ScaleGrid brings websites, applications, digital advertising and workflow automation together under one digital solutions studio.\n\nWe believe useful work begins by listening, asking clear questions and shaping a solution around the people who will use it. The details of each project are agreed before delivery begins.", anchor: "about", order: 5, enabled: true },
        process: { type: "processList", kicker: "HOW WE WORK", title: "A straightforward path from idea to launch.", subtitle: "The exact steps depend on the project, but a clear process helps keep decisions and expectations aligned.", anchor: "process", order: 6, enabled: true },
        faq: { type: "faqList", kicker: "QUESTIONS, ANSWERED", title: "A few things you may want to know.", subtitle: "These starter answers can be edited, expanded or removed from your Admin Panel.", anchor: "faq", order: 7, enabled: true },
        contact: { type: "contact", kicker: "LET'S BUILD SOMETHING USEFUL", title: "Have a project in mind? Let's talk.", subtitle: "Tell us what you are trying to achieve. We'll start with a conversation about the right next step.", buttonLabel: "Chat with us on WhatsApp", note: "No obligation — just a first conversation.", anchor: "contact", order: 8, enabled: true }
      }
    }
  }
};
