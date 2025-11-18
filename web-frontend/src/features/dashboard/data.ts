export const brandPillars = [
  "Assisted sourcing desk",
  "Secure payments",
  "Escrow-ready partners",
] as const;

export const quickActions = [
  {
    id: "requirements",
    title: "Discover Verified Sellers",
    description: "Share your procurement goals with the sourcing desk.",
    cta: "Post requirement",
  },
  {
    id: "selling",
    title: "Boost your Sales",
    description: "Reach trusted buyers with export-ready support.",
    cta: "Start selling",
  },
] as const;

export const categorySections = [
  {
    id: "food",
    title: "Food & Beverages",
    highlight: "Rice assortments",
    items: [
      { id: "basmati", label: "Basmati Rice", detail: "1121 & 1509 variants" },
      { id: "kolam", label: "Kolam Rice", detail: "Steam, raw & broken" },
      { id: "ponni", label: "Ponni Rice", detail: "South Indian staples" },
    ],
    theme: "from-emerald-100 via-teal-100 to-emerald-50",
  },
  {
    id: "chemicals",
    title: "Chemicals & Minerals",
    highlight: "Industrial solvents",
    items: [
      { id: "acids", label: "Specialty Acids", detail: "Battery grade & lab grade" },
      { id: "powders", label: "Mineral Powders", detail: "Quartz, dolomite & more" },
      { id: "coatings", label: "Protective Coatings", detail: "High temperature & food safe" },
    ],
    theme: "from-indigo-100 via-slate-100 to-indigo-50",
  },
  {
    id: "textiles",
    title: "Textiles & Apparel",
    highlight: "Premium cotton",
    items: [
      { id: "knits", label: "Organic Knits", detail: "GOTS certified partners" },
      { id: "uniforms", label: "Industrial Uniforms", detail: "Custom fits for shop floors" },
      { id: "technical", label: "Technical Fabrics", detail: "Fire retardant & antistatic" },
    ],
    theme: "from-orange-100 via-amber-100 to-orange-50",
  },
] as const;

export const marketplaceStats = [
  { id: "buyers", value: "2.1k+", label: "Active buyers" },
  { id: "exports", value: "780+", label: "Verified exporters" },
  { id: "response", value: "4.2 hrs", label: "Avg response" },
] as const;

export const spotlightPrograms = [
  {
    id: "verified",
    title: "Verified Exporters Club",
    stat: "Invite-only",
    description: "Hands-on compliance, bonded warehouses, and curated buyer circles.",
  },
  {
    id: "logistics",
    title: "Logistics Concierge",
    stat: "Pan-India",
    description: "End-to-end movement, packaging, and insurance support for urgent orders.",
  },
] as const;

export const inventoryHealth = [
  { id: "steel", name: "Cold Rolled Steel", quantity: 124, status: "Healthy" },
  { id: "aluminum", name: "Aluminum Sheets", quantity: 48, status: "Low" },
  { id: "pcb", name: "Control PCBs", quantity: 210, status: "Healthy" },
  { id: "motors", name: "Servo Motors", quantity: 16, status: "Critical" },
] as const;
