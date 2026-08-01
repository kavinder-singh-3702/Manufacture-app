import { slugifySubCategory } from "@/src/features/product/utils/categories";

export type FaqEntry = { question: string; answer: string };

export type IndustryContent = {
  /** ~120-200 word editorial intro — must stay genuinely industry-specific, not swappable boilerplate. */
  intro: string;
  /** Short "what to check when sourcing" guidance, specific to this industry's real buying considerations. */
  buyerGuide: string;
  faqs: FaqEntry[];
};

/**
 * Hand-written per-industry content for the /industries/[industry] pages —
 * this is what keeps those pages from being doorway pages: every entry here
 * is genuinely industry-specific (real buying considerations, real
 * terminology), not a template with the industry name substituted in.
 *
 * Keyed by the same id as PRODUCT_CATEGORIES in
 * src/features/product/utils/categories.ts — every INDUSTRY_CATEGORIES entry
 * must have a matching key here (enforced by a dev-time check in
 * app/industries/[industry]/page.tsx's generateStaticParams).
 */
export const INDUSTRY_CONTENT: Record<string, IndustryContent> = {
  "food-beverage-manufacturing": {
    intro:
      "India's food and beverage manufacturers supply everything from milled grain and refined sugar to packaged snacks, dairy, and bottled beverages, serving both retail chains and institutional buyers. Sourcing here means balancing FSSAI compliance, shelf-life and cold-chain logistics against price — a bakery buyer's needs (short lead times, small batch flexibility) look very different from a bottled-water buyer's (consistent large-volume supply, BIS certification). ARVANN lists manufacturers across milling, dairy, bakery, snacks, and processed meat/seafood, each with their compliance status and product specs upfront, so buyers can shortlist by certification and capacity before opening a conversation.",
    buyerGuide:
      "Check FSSAI licensing and, for export-bound orders, relevant international food-safety certifications (HACCP, ISO 22000). Ask about batch testing, shelf life, and cold-chain capability for perishables — these vary far more within this industry than most.",
    faqs: [
      { question: "Do food and beverage manufacturers on ARVANN need FSSAI licensing?", answer: "Yes — FSSAI registration is standard for any food-grade manufacturer selling in India, and compliance status is shown on each company's profile so buyers can verify it before ordering." },
      { question: "Can I order small trial batches before a bulk order?", answer: "Many manufacturers in this category, especially in bakery, snacks, and confectionery, support smaller trial-order quantities — confirm minimum order quantity (MOQ) directly with the seller via RFQ." },
      { question: "What packaging options are typical for bulk food orders?", answer: "Bulk food and beverage orders typically ship in institutional packaging (25kg/50kg sacks, drums, or bulk cartons) rather than retail-ready units unless the manufacturer specifically offers private-label packaging." },
      { question: "How do I compare pricing across sugar, rice, and flour mills?", answer: "Prices in this segment track commodity markets closely, so request current quotes rather than relying on listed prices alone, and compare on a per-unit (per kg/quintal) basis across sellers." },
    ],
  },
  "textile-apparel-manufacturing": {
    intro:
      "India's textile and apparel sector spans raw fibre (cotton, wool, silk) through yarn and fabric mills to finished garments, denim, hosiery, and home textiles — one of the country's largest export industries. Buyers sourcing here range from garment brands needing cut-and-sew manufacturing to home-goods retailers buying finished bedsheets and towels, so the right supplier depends heavily on where in that chain you're buying. ARVANN's textile listings span yarn and fabric mills through to finished garment and home-textile manufacturers, with GSM, fabric composition, and finish specified per listing so buyers can filter by the actual production stage they need.",
    buyerGuide:
      "Confirm fabric composition, GSM (fabric weight), and dyeing/finishing process, since these determine both cost and end-use suitability. For garments, ask about sizing standards and sampling lead time before committing to a bulk cut-and-sew order.",
    faqs: [
      { question: "What's the difference between buying yarn/fabric vs. finished garments here?", answer: "Yarn and fabric manufacturers sell raw material for further processing (dyeing, cutting, sewing); garment manufacturers sell finished, ready-to-wear or ready-to-ship product. Filter by sub-category to see the right stage of the supply chain." },
      { question: "Can textile manufacturers on ARVANN handle export orders?", answer: "Many listed manufacturers already export; check each company's profile for compliance status and ask directly about export documentation (GST, IEC code) experience for your destination market." },
      { question: "What MOQs are typical for garment manufacturing?", answer: "MOQs vary widely by manufacturer and garment complexity — small workshops may accept a few hundred pieces per style, while larger factories often require several thousand. Confirm per-seller via RFQ." },
      { question: "How is fabric priced — per metre or per kg?", answer: "Woven fabric is typically quoted per metre; yarn and some technical textiles are quoted per kg. Always confirm the unit before comparing prices across sellers." },
    ],
  },
  "paper-packaging-industry": {
    intro:
      "Paper and packaging manufacturers on ARVANN cover the full range from base paper mills through corrugated boxes, cartons, tissue products, and flexible packaging like pouches and films. This is a heavily volume- and logistics-driven industry — box strength (burst factor, ply count), print finish, and case dimensions matter as much as price, especially for e-commerce and FMCG buyers packaging products for shipping. Whether you need bulk corrugated boxes for a warehouse, custom-printed cartons for retail, or flexible pouches for food packaging, ARVANN's listings specify material grade and dimensions upfront so buyers can compare like-for-like before requesting a quote.",
    buyerGuide:
      "For corrugated packaging, confirm ply count and burst factor against your product's weight and shipping distance. For flexible packaging (pouches/films), confirm barrier properties if the contents are food or moisture-sensitive.",
    faqs: [
      { question: "Can I get custom box sizes and printing?", answer: "Most corrugated box and carton manufacturers on ARVANN offer custom dimensions and printing — specify your required size, ply, and print design when sending an RFQ." },
      { question: "What packaging suits food-grade products?", answer: "Food-contact packaging (pouches, cartons, tissue) needs food-grade material certification — confirm this explicitly with the manufacturer, especially for direct food-contact packaging." },
      { question: "Is there a minimum order for custom-printed cartons?", answer: "Custom printing usually carries a higher MOQ than plain packaging due to plate/setup costs — ask the manufacturer for their specific custom-print MOQ." },
      { question: "How do lead times compare between plain and custom packaging?", answer: "Plain, stock-dimension packaging generally ships faster; custom-printed or non-standard sizes require a production run and longer lead time — confirm before planning around a delivery date." },
    ],
  },
  "chemical-manufacturing": {
    intro:
      "Chemical manufacturers on ARVANN produce industrial chemicals, fertilizers and pesticides, paints and coatings, dyes and pigments, and adhesives and resins — inputs used across nearly every other manufacturing industry on this marketplace. Because this category covers both hazardous and non-hazardous materials, safety documentation (Safety Data Sheets, handling and storage requirements) is as important as price and purity specification when comparing suppliers. ARVANN lists chemical manufacturers with their product grade and compliance status visible upfront, so industrial buyers — from paint formulators to agricultural distributors — can shortlist by specification before requesting a detailed quote and SDS.",
    buyerGuide:
      "Always request a Safety Data Sheet (SDS) and confirm purity/grade specification before ordering. For pesticides and fertilizers, confirm the manufacturer holds the relevant Central Insecticides Board or Fertiliser Control Order registration.",
    faqs: [
      { question: "Do I need special handling for chemical shipments?", answer: "Depending on the chemical class, yes — hazardous materials require compliant packaging and transport documentation. Confirm this with the manufacturer before finalizing logistics." },
      { question: "How is chemical purity/grade specified in listings?", answer: "Most industrial chemical listings specify grade (e.g., technical, industrial, or pharma-grade) and purity percentage — request a Certificate of Analysis for verification if this matters for your use case." },
      { question: "Can manufacturers supply in smaller sample quantities first?", answer: "Many chemical manufacturers offer sample quantities for quality testing before a bulk commitment — ask directly, since this isn't always listed as a standard option." },
      { question: "Are fertilizers and pesticides sold directly to distributors, or only in bulk?", answer: "Both — some manufacturers sell direct to large distributors in bulk, others support smaller B2B orders. Confirm minimum order quantity per seller." },
    ],
  },
  "pharmaceutical-medical": {
    intro:
      "Pharmaceutical and medical manufacturers on ARVANN produce medicines and tablets, syrups and injections, medical devices, surgical instruments, and PPE. This is the most regulation-sensitive category on the marketplace — every buyer needs to verify manufacturing licenses, drug approvals, and quality certifications (GMP, ISO 13485 for devices) before proceeding, regardless of order size. ARVANN surfaces each seller's compliance status directly on their profile, and buyers should treat that as a starting point for due diligence, not a substitute for verifying credentials directly with the manufacturer for anything intended for clinical or patient use.",
    buyerGuide:
      "Verify drug manufacturing license and Good Manufacturing Practice (GMP) certification for pharmaceuticals; ISO 13485 for medical devices. Request the specific regulatory approvals relevant to your destination market before ordering.",
    faqs: [
      { question: "Is ARVANN's compliance badge a substitute for verifying a drug license?", answer: "No — the compliance status shown reflects documents submitted to ARVANN's verification process, not a regulatory approval. Always verify manufacturing licenses and drug approvals directly with the manufacturer and relevant authority for anything clinical." },
      { question: "Can I order PPE and surgical instruments in smaller quantities?", answer: "Yes, PPE (masks, kits) and basic surgical instruments generally have lower MOQs than formulated medicines — confirm per listing." },
      { question: "What documentation should I request for medical devices?", answer: "Request ISO 13485 certification, CE marking or CDSCO approval (as applicable to your market), and product test reports before ordering medical devices." },
      { question: "Do pharmaceutical manufacturers here export internationally?", answer: "Some do — ask directly about export licensing (like a WHO-GMP certificate) for your destination country, since requirements vary significantly by market." },
    ],
  },
  "plastic-polymer-industry": {
    intro:
      "Plastic and polymer manufacturers on ARVANN produce injection-molded products, PET bottles and containers, PVC pipes and fittings, plastic packaging, and household plastic items. Resin type (PP, PE, PVC, PET) and grade drive both cost and suitability — food-contact packaging needs food-grade resin, while construction-grade PVC pipes need pressure ratings suited to their application. Buyers in this category range from beverage brands sourcing PET bottles to contractors buying PVC pipe and fittings in bulk, so ARVANN's listings specify resin type and application to help narrow down the right manufacturer quickly.",
    buyerGuide:
      "Confirm resin type and grade (food-grade vs. industrial-grade) matches your end use, and for pipes/fittings, confirm pressure rating and IS/BIS standard compliance relevant to construction or plumbing use.",
    faqs: [
      { question: "Is plastic packaging here food-safe?", answer: "Only if specified as food-grade — confirm resin grade and any relevant food-contact certification directly with the manufacturer before ordering packaging for food or beverage use." },
      { question: "What pressure ratings are available for PVC pipes?", answer: "Pressure ratings vary by pipe class and application (agricultural, plumbing, industrial) — specify your required rating and standard (e.g., IS 4985) when requesting a quote." },
      { question: "Can plastic manufacturers do custom molding?", answer: "Many injection-molding manufacturers accept custom mold specifications, though tooling costs and lead times apply for a new mold — ask for a quote covering both tooling and per-unit cost." },
      { question: "How are plastic products typically priced — per piece or per kg?", answer: "Molded finished products (containers, household items) are usually priced per piece; raw resin and some semi-finished goods are priced per kg. Confirm the unit before comparing sellers." },
    ],
  },
  "rubber-industry": {
    intro:
      "Rubber manufacturers on ARVANN produce tyres and tubes, rubber sheets, seals and gaskets, and rubber footwear — materials used across automotive, industrial, and consumer goods supply chains. Compound formulation (natural vs. synthetic rubber, hardness/durometer rating) determines performance, so industrial buyers sourcing seals and gaskets need to specify their exact application (temperature range, chemical exposure) rather than comparing on price alone. ARVANN's rubber industry listings include compound and application details so buyers — from automotive parts distributors to industrial maintenance teams — can match a manufacturer's capability to their technical requirement before requesting samples.",
    buyerGuide:
      "Specify the application environment (temperature, chemical or oil exposure, pressure) when sourcing seals and gaskets — the wrong compound fails in service even if the dimensions match.",
    faqs: [
      { question: "How do I know which rubber compound suits my application?", answer: "Compound choice depends on temperature range, chemical exposure, and required durability — describe your application to the manufacturer directly; most will recommend a compound rather than expecting you to specify one blind." },
      { question: "Can gaskets and seals be custom-cut to my drawing?", answer: "Yes, most seal and gasket manufacturers accept custom specifications or CAD drawings — provide dimensions and tolerances in your RFQ." },
      { question: "Are tyres sold to individual buyers or only in bulk to distributors?", answer: "Tyre manufacturers on ARVANN typically sell in bulk to distributors and fleet operators rather than single-unit retail — confirm minimum order quantity." },
      { question: "What's the typical lead time for custom rubber sheeting?", answer: "Stock rubber sheet sizes ship faster than custom thickness or compound orders, which require a production run — confirm lead time before planning around a delivery date." },
    ],
  },
  "metal-steel-industry": {
    intro:
      "Metal and steel manufacturers on ARVANN span iron and steel plants, aluminium and copper product makers, casting and forging units, metal fabricators, and suppliers of sheets, rods, and wires. This is a specification-heavy category — grade (e.g., mild steel vs. stainless, alloy composition), gauge/thickness, and finish (galvanized, powder-coated, raw) all affect both price and suitability, and pricing tracks metal commodity markets closely. Buyers range from construction contractors sourcing rebar and sheets to manufacturers needing custom casting or fabrication, so ARVANN's listings specify grade and form (sheet, rod, wire, cast component) to help narrow the search before requesting current pricing.",
    buyerGuide:
      "Confirm exact grade/alloy specification and request current pricing rather than relying on listed prices, since metal costs fluctuate with commodity markets. For fabrication, confirm tolerances and finish requirements upfront.",
    faqs: [
      { question: "Why do metal prices change so often?", answer: "Steel, aluminium, and copper prices track global commodity markets and can shift week to week — always request a current quote rather than assuming a listed price is final." },
      { question: "Can I get custom fabrication to my drawings?", answer: "Yes, most metal fabrication manufacturers accept CAD drawings or detailed specifications for custom parts — include material grade, tolerances, and finish in your RFQ." },
      { question: "What's the difference between casting and forging?", answer: "Casting pours molten metal into a mould (good for complex shapes); forging shapes solid metal under pressure (generally stronger for load-bearing parts). Specify which process fits your part's requirements when requesting quotes." },
      { question: "Do sheet/rod/wire suppliers sell in small quantities?", answer: "Many do supply smaller trade quantities alongside bulk industrial orders — confirm minimum order length/weight directly with the seller." },
    ],
  },
  "automobile-auto-components": {
    intro:
      "Automobile and auto component manufacturers on ARVANN cover vehicles (cars, bikes, tractors), auto parts, batteries, and tyres and accessories — serving OEM buyers, aftermarket distributors, and fleet operators alike. Component buyers need exact part compatibility (make, model, year, OE part number where relevant) since a near-match part often isn't a safe substitute, while battery and tyre buyers care more about specification (capacity, load rating) and warranty terms. ARVANN's listings in this category specify part application and compatibility details so buyers can confirm fitment before ordering rather than discovering a mismatch after delivery.",
    buyerGuide:
      "For components, confirm exact make/model/year compatibility or OE part number match before ordering — a visually similar part is not always a safe substitute. For batteries, confirm capacity (Ah) and warranty terms.",
    faqs: [
      { question: "How do I confirm an auto part fits my vehicle?", answer: "Provide the exact make, model, year, and (if available) OE part number to the manufacturer — don't rely on visual similarity alone, since fitment and tolerances vary." },
      { question: "Do auto component manufacturers sell to individual buyers or only distributors?", answer: "Most sell in trade quantities to distributors, garages, and fleet operators rather than single-unit retail — confirm minimum order quantity per listing." },
      { question: "What warranty is typical for batteries sourced here?", answer: "Warranty terms vary by manufacturer and battery type — confirm warranty period and terms directly before ordering, as this isn't always listed upfront." },
      { question: "Can I source tractor or commercial vehicle parts through the same category?", answer: "Yes, the automobile category covers passenger, two-wheeler, and tractor/commercial components — use the sub-category filter to narrow to your vehicle type." },
    ],
  },
  "electrical-electronics-manufacturing": {
    intro:
      "Electrical and electronics manufacturers on ARVANN produce wires and cables, switches, fans and lighting, home appliances, mobile phones and parts, and solar panels. Safety and quality certification (BIS/ISI marking, wire gauge and insulation rating) matters most for electrical goods since they carry real installation and fire-safety risk, while consumer electronics buyers care more about warranty and after-sales support terms. ARVANN's listings surface certification and specification details so buyers — from electrical contractors sourcing cable in bulk to retailers stocking appliances — can shortlist manufacturers by the standard their project or market actually requires.",
    buyerGuide:
      "Confirm BIS/ISI certification for wiring, switches, and appliances sold in India — this is a safety and legal requirement, not optional. For solar panels, confirm wattage rating and warranty period.",
    faqs: [
      { question: "Is BIS certification mandatory for electrical products sold here?", answer: "For many electrical product categories, yes — BIS certification is legally required for sale in India. Confirm certification status directly with the manufacturer before ordering." },
      { question: "What warranty applies to appliances and solar panels?", answer: "Warranty terms vary by manufacturer and product — solar panels typically carry longer performance warranties (often 10+ years) than small appliances. Confirm terms before ordering." },
      { question: "Can cable and wire manufacturers supply custom lengths/gauges?", answer: "Yes, most wire and cable manufacturers support custom gauge, length, and insulation specification — include your requirement in the RFQ." },
      { question: "Do mobile phone/parts manufacturers sell components or finished devices?", answer: "Both — this sub-category includes finished device manufacturers and component/parts suppliers (for repair or assembly); use the sub-category filter to find the right one." },
    ],
  },
  "machinery-heavy-engineering": {
    intro:
      "Machinery and heavy engineering manufacturers on ARVANN supply industrial machines, agricultural equipment, construction machinery, and machine tools — high-value, long-lifecycle purchases where after-sales service and spare-parts availability matter as much as the upfront specification. Buyers here are typically evaluating capacity, power requirements, and installation/commissioning support rather than comparing on price alone, since machinery decisions commit a business for years. ARVANN's listings in this category include capacity and specification details so industrial and agricultural buyers can shortlist manufacturers whose equipment genuinely matches their production scale before requesting a site-specific quote.",
    buyerGuide:
      "Ask about installation/commissioning support, warranty period, and spare-parts availability alongside the headline specification — machinery is a long-term commitment, and after-sales support materially affects total cost of ownership.",
    faqs: [
      { question: "Do machinery manufacturers provide installation support?", answer: "Many do, especially for larger industrial and construction equipment — confirm whether installation/commissioning is included or quoted separately." },
      { question: "How available are spare parts after purchase?", answer: "This varies significantly by manufacturer — ask directly about spare-parts lead time and whether local service support exists, since it materially affects long-term running costs." },
      { question: "Can equipment specifications be customized to my production line?", answer: "Many machine tool and industrial machinery manufacturers offer configuration options (capacity, power rating, automation level) — describe your production requirement in the RFQ." },
      { question: "What's the typical lead time for industrial machinery?", answer: "Lead times are generally longer than for consumer goods — often several weeks to months depending on customization — confirm directly before planning a production timeline around it." },
    ],
  },
  "wood-furniture-industry": {
    intro:
      "Wood and furniture manufacturers on ARVANN produce furniture, plywood and MDF boards, doors and windows, and wooden packaging — serving furniture retailers, contractors, and businesses needing bulk wooden packaging (crates, pallets). Material grade (plywood thickness and bonding grade, solid wood species) and finish drive both durability and cost, and furniture buyers in particular should confirm whether pricing includes finishing (polish, lamination) or is for raw/unfinished pieces. ARVANN's listings specify material and finish so buyers can compare manufacturers on the actual product they'll receive, not just a category label.",
    buyerGuide:
      "For plywood/MDF, confirm thickness, grade (e.g., BWP/BWR for moisture resistance), and bonding standard. For furniture, confirm whether the quoted price includes finishing or is for raw/unfinished pieces.",
    faqs: [
      { question: "What plywood grade should I ask for in humid or outdoor use?", answer: "BWP (Boiling Water Proof) grade plywood is suited to moisture-prone conditions; standard commercial plywood is not. Specify your intended use so the manufacturer can recommend the right grade." },
      { question: "Can furniture manufacturers do custom sizes/designs?", answer: "Many furniture manufacturers accept custom dimensions and design specifications for bulk orders — share drawings or reference designs in your RFQ." },
      { question: "Is wooden packaging (crates/pallets) sold by size or by weight capacity?", answer: "Typically by size and load capacity together — specify both your product dimensions and weight to get an accurate quote." },
      { question: "Do door and window manufacturers supply both wood and composite materials?", answer: "Many do — filter by sub-category and confirm the specific material (solid wood, engineered wood, or composite) with the manufacturer." },
    ],
  },
  "construction-material-industry": {
    intro:
      "Construction material manufacturers on ARVANN supply cement, bricks and tiles, glass and ceramics, and sanitaryware — bulk, project-driven purchases where consistent quality across large volumes and reliable delivery scheduling matter more than almost anything else. Contractors and builders sourcing here typically need to coordinate delivery against a construction timeline, so lead time and logistics capacity (can the manufacturer deliver the full project volume on schedule) is often the deciding factor between two similarly-priced suppliers. ARVANN's listings specify grade and standard compliance (e.g., cement grade, tile IS standard) to help buyers shortlist before requesting a project-volume quote.",
    buyerGuide:
      "Confirm cement grade (e.g., OPC 43/53) and IS standard compliance for tiles, bricks, and sanitaryware. For large projects, confirm the manufacturer's production capacity can meet your full volume on your construction schedule.",
    faqs: [
      { question: "What cement grades are available and how do they differ?", answer: "OPC 43 and OPC 53 (and PPC) are common grades, differing in strength development speed and use case — confirm which grade suits your structural requirement with the manufacturer or your engineer." },
      { question: "Can manufacturers deliver directly to a construction site?", answer: "Most bulk construction material suppliers coordinate site delivery — confirm logistics capacity and delivery scheduling against your project timeline before ordering." },
      { question: "Are tiles and sanitaryware sold in matched batches to avoid shade variation?", answer: "For large orders, ask specifically for single-batch or shade-matched supply — mixing batches can cause visible shade differences in tile installations." },
      { question: "What's the typical MOQ for bulk cement or brick orders?", answer: "MOQs are typically set at truckload or project-volume levels for these bulk materials — confirm directly with the manufacturer for your project size." },
    ],
  },
  "leather-industry": {
    intro:
      "Leather manufacturers on ARVANN cover leather processing (tanning and finishing), footwear, and leather goods like bags, belts, and wallets — India is one of the world's largest leather producers, with clusters specializing in different finished-goods categories. Leather grade and tanning process (chrome vs. vegetable tanning) affect durability, feel, and price point, so buyers sourcing finished goods should confirm the leather type behind a product, not just its category. ARVANN's listings specify leather type and product category so buyers — from footwear brands to accessory retailers — can match a manufacturer's specialty to their product line.",
    buyerGuide:
      "Confirm leather type (genuine leather grade, or synthetic/PU alternative) and tanning process — these materially affect durability, feel, and price, and leather-goods listings should specify which applies.",
    faqs: [
      { question: "How do I know if a product is genuine leather or synthetic?", answer: "Confirm this explicitly with the manufacturer — listings should specify leather type, but always verify for a bulk order, since genuine and synthetic leather differ significantly in price and durability." },
      { question: "Can leather goods manufacturers do custom branding/embossing?", answer: "Many bag, belt, and wallet manufacturers offer custom branding (embossed logos, custom hardware) for bulk orders — specify this in your RFQ." },
      { question: "What's the typical MOQ for custom leather footwear?", answer: "MOQs vary by manufacturer and complexity of the design — smaller workshops may accept lower volumes than large factories; confirm per seller." },
      { question: "Do leather processing units sell raw tanned leather or only finished goods?", answer: "Leather processing (tanning) units typically sell processed leather material itself, as an input for footwear/goods manufacturers — use the sub-category filter to find the right stage of the supply chain." },
    ],
  },
  "petroleum-energy-manufacturing": {
    intro:
      "Petroleum and energy-based manufacturers on ARVANN cover oil refining outputs, lubricants, petrochemicals, and biofuels — inputs used across transport, industrial, and manufacturing supply chains. This category is closely tied to global commodity pricing, so buyers should always request a current quote rather than relying on a listed price, and should confirm product grade (e.g., lubricant viscosity grade, petrochemical purity) matches their application precisely, since substitutions can affect equipment performance or warranty. ARVANN's listings specify product grade and typical application to help industrial buyers narrow down the right manufacturer before requesting current pricing and supply terms.",
    buyerGuide:
      "Confirm product grade/specification (e.g., lubricant viscosity, petrochemical purity) matches your equipment or process requirement exactly, and always request current pricing given how closely this category tracks commodity markets.",
    faqs: [
      { question: "How often do petroleum/lubricant prices change?", answer: "These track global crude and commodity markets closely and can change frequently — always request a current quote rather than relying on a previously listed price." },
      { question: "What lubricant viscosity grade do I need?", answer: "This depends on your equipment manufacturer's specification — check your equipment's manual or ask the lubricant manufacturer directly, since using the wrong grade can affect warranty and performance." },
      { question: "Are biofuels sold to individual buyers or mainly to industrial/fleet operators?", answer: "Biofuel manufacturers on ARVANN primarily serve industrial and fleet-scale buyers rather than small individual orders — confirm minimum order volume." },
      { question: "What documentation should I expect with a petrochemical order?", answer: "Request a Certificate of Analysis and Safety Data Sheet (SDS) for petrochemical products, confirming purity and handling requirements." },
    ],
  },
  "defence-aerospace-manufacturing": {
    intro:
      "Defence and aerospace manufacturers on ARVANN supply aircraft components, defence electronics, and space equipment for buyers operating in one of the most regulated procurement environments in manufacturing. Every purchase in this category involves compliance requirements (export control, end-user certification, and often government procurement processes) well beyond a standard commercial transaction, so buyers should treat ARVANN's listing as a starting point for identifying capability, not a substitute for the formal procurement and compliance process this industry requires. Manufacturers listed here specify their component category and compliance status so qualified buyers can begin due diligence.",
    buyerGuide:
      "Defence and aerospace procurement carries export-control and end-user certification requirements that go well beyond standard commercial sourcing — confirm the manufacturer's licensing and your own procurement authority's requirements before proceeding.",
    faqs: [
      { question: "Can defence/aerospace components be purchased like a standard product?", answer: "No — this category involves regulatory, export-control, and often government procurement requirements beyond a standard commercial order. Use ARVANN to identify manufacturer capability, then proceed through the appropriate compliance process." },
      { question: "What certifications should I ask defence/aerospace manufacturers for?", answer: "Relevant certifications vary by component and destination (e.g., AS9100 for aerospace quality management) — confirm specific requirements with your own procurement/compliance team." },
      { question: "Do these manufacturers only supply government buyers?", answer: "Many also supply private aerospace and defence-adjacent manufacturers as subcontractors — confirm the manufacturer's typical customer base and export licensing directly." },
    ],
  },
  "consumer-goods-fmcg": {
    intro:
      "FMCG and consumer goods manufacturers on ARVANN produce soaps and detergents, cosmetics and personal care, home cleaning products, and stationery — high-volume, brand- and retail-driven categories where private-label manufacturing capability matters as much as the finished product itself. Retail and distribution buyers often want private-label or white-label production (their own branding on the manufacturer's formulation), so it's worth confirming this capability upfront rather than assuming every listed manufacturer offers it. ARVANN's FMCG listings specify product category and typical order scale to help retailers and distributors find manufacturers suited to their volume and branding needs.",
    buyerGuide:
      "If you need private-label/white-label manufacturing (your own branding on their product), confirm this capability explicitly — not every FMCG manufacturer offers it, and minimum order quantities for private label are usually higher than for stock product.",
    faqs: [
      { question: "Do FMCG manufacturers offer private-label/white-label production?", answer: "Many do, but not all — confirm directly, since private-label typically requires a higher minimum order quantity than buying the manufacturer's existing branded product." },
      { question: "What certifications apply to cosmetics and personal care products?", answer: "Cosmetics sold in India need to comply with BIS/Cosmetics Rules requirements — confirm the manufacturer's compliance status and any relevant product testing (e.g., dermatologically tested) before ordering." },
      { question: "Can I get custom fragrance/formulation for soaps or cleaning products?", answer: "Many manufacturers in this category offer formulation customization for bulk orders — describe your requirement (fragrance, active ingredients) in your RFQ." },
      { question: "What's a typical MOQ for private-label FMCG products?", answer: "This varies significantly by product and manufacturer — private label generally starts at a higher volume than off-the-shelf product; confirm per seller." },
    ],
  },
  "printing-publishing": {
    intro:
      "Printing and publishing manufacturers on ARVANN produce books and newspapers, labels and stickers, and packaging printing — a category that ranges from short-run label printing for small businesses to large-scale book and packaging print runs. Print quality, paper/material stock, and finishing options (lamination, embossing, die-cutting for labels) determine both cost and suitability, so buyers should specify their exact use case (product labeling vs. book publishing vs. carton printing) to get a relevant quote rather than a generic one. ARVANN's listings specify print category and typical run-size capability to help buyers match their project scale to the right manufacturer.",
    buyerGuide:
      "Specify your exact print use case (product labels, book printing, or packaging printing) and required finish (lamination, die-cutting, embossing) — printing manufacturers often specialize in one of these rather than doing all equally well.",
    faqs: [
      { question: "Can I get short print runs for a small business?", answer: "Many label and sticker printers support short runs; book and large packaging printing typically requires higher minimum volumes to be cost-effective — confirm run-size options directly." },
      { question: "What finishing options are available for labels?", answer: "Common options include lamination, die-cutting to custom shapes, and various adhesive types — specify your product surface and use case (e.g., outdoor/waterproof) when requesting a quote." },
      { question: "Do publishing manufacturers handle the full book production process?", answer: "Many book/publication printers handle everything from typesetting through binding — confirm which stages you need versus which you'll handle yourself." },
      { question: "How is packaging printing priced — is it separate from the packaging itself?", answer: "This depends on the manufacturer — some quote printing as part of the packaging order (see Paper & Packaging Industry), others as a separate print-only service on packaging you supply. Confirm which applies." },
    ],
  },
  "toys-sports-goods": {
    intro:
      "Toy and sports goods manufacturers on ARVANN produce toys, sports equipment, and fitness items for retail, institutional (schools, gyms), and export buyers. Safety certification (BIS toy safety standards, material non-toxicity) is a hard requirement for toys sold in India, while sports and fitness equipment buyers care more about load rating and durability specifications suited to commercial/institutional use versus home use. ARVANN's listings in this category specify certification status and intended use (retail vs. institutional grade) so buyers can shortlist manufacturers whose product genuinely meets their compliance and durability requirements.",
    buyerGuide:
      "Confirm BIS toy safety certification for any toy product sold in India — this is a legal requirement. For sports/fitness equipment, confirm load rating and whether it's rated for commercial/institutional use if that's your buying context.",
    faqs: [
      { question: "Is BIS certification mandatory for toys sold on ARVANN?", answer: "Yes, toys sold in India require BIS certification under the Toys (Quality Control) Order — confirm this directly with the manufacturer before ordering for resale." },
      { question: "What's the difference between retail and commercial-grade fitness equipment?", answer: "Commercial/institutional-grade equipment (for gyms, schools) is typically built for higher usage volume and durability than home-use retail equipment — specify your use case to get equipment rated appropriately." },
      { question: "Can toy manufacturers produce custom/branded designs?", answer: "Many toy manufacturers accept custom design and branding for bulk orders — share your design specification and required certifications in the RFQ." },
      { question: "Do sports goods manufacturers export internationally?", answer: "Many do — confirm the manufacturer's export experience and relevant international safety standards for your destination market." },
    ],
  },
  "handicrafts-cottage-industries": {
    intro:
      "Handicraft and cottage industry manufacturers on ARVANN produce handloom textiles, pottery, hand-made items, and decorative products — often small-scale artisan producers rather than large factories, which means production capacity and lead time can vary far more than in industrial categories. Buyers sourcing here (retailers, home-decor brands, export buyers) should ask directly about production capacity for bulk orders, since a manufacturer capable of beautiful small-batch work may need longer lead times or a production partner to fulfil a large order. ARVANN's listings specify craft category and typical scale so buyers can find artisan manufacturers suited to their order size.",
    buyerGuide:
      "Ask directly about production capacity and lead time for your order size — artisan and cottage-scale manufacturers often excel at quality and craftsmanship but may need longer lead times for large-volume orders than an industrial factory.",
    faqs: [
      { question: "Can handicraft manufacturers fulfil large export orders?", answer: "Capacity varies significantly — some artisan units are small-batch only, others coordinate networks of artisans for larger volume. Confirm production capacity and realistic lead time directly before committing to an export order size." },
      { question: "Are handloom textiles sold by the metre or as finished pieces?", answer: "Both exist in this category — confirm whether you're buying raw handloom fabric by the metre or finished handloom garments/textiles as pieces." },
      { question: "Can I get custom designs for pottery or decorative items?", answer: "Many artisan manufacturers accept custom design briefs, though turnaround is typically longer than for machine-made goods — discuss timeline expectations upfront." },
      { question: "Do these manufacturers offer certifications like GI tags?", answer: "Some regional handicrafts carry Geographical Indication (GI) status (e.g., specific handloom or pottery traditions) — ask the manufacturer if this applies to their product, as it can matter for authenticity and export positioning." },
    ],
  },
};

/**
 * Short, genuinely distinguishing per-subcategory blurbs for the
 * /industries/[industry]/[subcategory] pages — keyed by
 * `${industryId}::${slugifySubCategory(label)}`. Deliberately terse (this is
 * a narrow page one level below the industry page, which carries the fuller
 * buyer's guide and FAQs); the point of each entry is to be true and specific
 * to that sub-vertical, not a template with the label substituted in.
 */
export const SUBCATEGORY_BLURBS: Record<string, string> = {
  "food-beverage-manufacturing::rice-mills-and-flour-mills": "Milling equipment, packaged rice, atta, and flour blends for retail, bakery, and institutional buyers.",
  "food-beverage-manufacturing::sugar-mills": "Refined and raw sugar, jaggery, and by-products (molasses, bagasse) for FMCG and industrial buyers.",
  "food-beverage-manufacturing::dairy-products": "Milk, ghee, paneer, cheese and other dairy products from processing units supplying retail and institutional buyers.",
  "food-beverage-manufacturing::bakery-and-confectionery": "Bread, biscuits, cakes, and confectionery from bakeries and manufacturers supplying retail chains and institutional caterers.",
  "food-beverage-manufacturing::snacks-namkeen-and-beverages": "Packaged snacks, namkeen, and beverage manufacturers supplying retail distribution and private-label buyers.",
  "food-beverage-manufacturing::bottled-water": "Packaged drinking water manufacturers, including BIS-certified bottling plants for retail and institutional supply.",
  "food-beverage-manufacturing::meat-and-seafood-processing": "Processed and packaged meat and seafood products for retail, export, and institutional food-service buyers.",

  "textile-apparel-manufacturing::cotton-wool-and-silk-textiles": "Raw and woven cotton, wool, and silk textiles for further processing or direct sale to garment manufacturers.",
  "textile-apparel-manufacturing::yarn-and-fabric-manufacturing": "Spun yarn and woven/knitted fabric from mills supplying garment, home-textile, and export buyers.",
  "textile-apparel-manufacturing::garments-and-readymade-clothes": "Cut-and-sew garment manufacturers producing readymade clothing for retail, private-label, and export buyers.",
  "textile-apparel-manufacturing::denim-and-hosiery": "Denim fabric/garments and knitted hosiery manufacturers supplying apparel brands and retailers.",
  "textile-apparel-manufacturing::home-textiles": "Bedsheets, towels, curtains and other finished home-textile products for retail and hospitality buyers.",

  "paper-packaging-industry::paper-mills": "Base paper manufacturers supplying converters, publishers, and packaging producers.",
  "paper-packaging-industry::corrugated-box-manufacturing": "Corrugated cardboard boxes for shipping and storage, specified by ply count and burst factor.",
  "paper-packaging-industry::cartons-and-duplex-boxes": "Folding cartons and duplex board boxes for retail packaging, cosmetics, and pharma buyers.",
  "paper-packaging-industry::tissue-paper-and-notebooks": "Tissue paper products and notebook/stationery paper manufacturers for retail and institutional buyers.",
  "paper-packaging-industry::flexible-packaging-pouches-films": "Pouches, films, and flexible laminates for food, pharma, and consumer-goods packaging.",

  "chemical-manufacturing::industrial-chemicals": "Bulk industrial chemicals supplying manufacturing inputs across other industries on ARVANN.",
  "chemical-manufacturing::fertilizers-and-pesticides": "Agricultural fertilizers and pesticides from CIB/FCO-registered manufacturers supplying distributors.",
  "chemical-manufacturing::paints-and-coatings": "Industrial and decorative paints and protective coatings for construction, automotive, and industrial buyers.",
  "chemical-manufacturing::dyes-and-pigments": "Textile, industrial, and specialty dyes and pigments supplying manufacturing buyers across sectors.",
  "chemical-manufacturing::adhesives-and-resins": "Industrial adhesives and resins for construction, packaging, woodworking, and manufacturing applications.",

  "pharmaceutical-medical::medicines-and-tablets": "Formulated tablets and medicines from GMP-certified manufacturers, subject to drug licensing verification.",
  "pharmaceutical-medical::syrups-and-injections": "Liquid formulations and injectable pharmaceuticals from licensed manufacturers.",
  "pharmaceutical-medical::medical-devices": "ISO 13485-relevant medical devices and equipment for healthcare providers and distributors.",
  "pharmaceutical-medical::surgical-instruments": "Surgical and clinical instruments for hospitals, clinics, and medical distributors.",
  "pharmaceutical-medical::ppe-kits-and-masks": "Personal protective equipment — masks, kits, and related supplies — for institutional and retail buyers.",

  "plastic-polymer-industry::plastic-molding-products": "Injection-molded plastic products across household, industrial, and packaging applications.",
  "plastic-polymer-industry::pet-bottles-and-containers": "PET bottles and containers for beverage, FMCG, and packaging buyers, specified by resin grade.",
  "plastic-polymer-industry::pvc-pipes-and-fittings": "PVC pipes and fittings for plumbing, agricultural, and construction use, rated by pressure class.",
  "plastic-polymer-industry::plastic-packaging": "Rigid and semi-rigid plastic packaging for retail, food, and industrial buyers.",
  "plastic-polymer-industry::household-plastic-items": "Household plasticware and consumer plastic goods for retail and distribution buyers.",

  "rubber-industry::tyres-and-tubes": "Rubber tyres and inner tubes for automotive, two-wheeler, and industrial vehicle applications.",
  "rubber-industry::rubber-sheets": "Industrial rubber sheeting by compound and thickness for gasketing, flooring, and fabrication use.",
  "rubber-industry::seals-and-gaskets": "Custom and stock rubber seals and gaskets specified by compound for temperature and chemical resistance.",
  "rubber-industry::footwear": "Rubber and rubber-soled footwear manufacturers supplying retail and institutional buyers.",

  "metal-steel-industry::iron-and-steel-plants": "Primary iron and steel production supplying construction, fabrication, and manufacturing buyers.",
  "metal-steel-industry::aluminium-and-copper-products": "Aluminium and copper semi-finished and finished products for electrical, construction, and industrial buyers.",
  "metal-steel-industry::casting-and-forging": "Custom metal casting and forging manufacturers producing components to buyer specification.",
  "metal-steel-industry::metal-fabrication": "Custom metal fabrication — cutting, welding, and assembly — to buyer drawings and specifications.",
  "metal-steel-industry::sheets-rods-and-wires": "Metal sheets, rods, and wires by grade and gauge for construction and manufacturing buyers.",

  "automobile-auto-components::cars-bikes-and-tractors": "Vehicle manufacturers — passenger cars, two-wheelers, and tractors — for dealer and fleet buyers.",
  "automobile-auto-components::auto-parts": "Aftermarket and OEM auto components, specified by make/model/OE part number compatibility.",
  "automobile-auto-components::batteries": "Automotive batteries specified by capacity (Ah) and warranty for vehicle and fleet buyers.",
  "automobile-auto-components::tyres-and-accessories": "Vehicle tyres and accessories for dealer, fleet, and aftermarket distribution buyers.",

  "electrical-electronics-manufacturing::wires-and-cables": "Electrical wires and cables by gauge and insulation rating, BIS-certified for Indian installation standards.",
  "electrical-electronics-manufacturing::switches-fans-and-lights": "Switches, fans, and lighting fixtures for retail, construction, and institutional buyers.",
  "electrical-electronics-manufacturing::home-appliances": "Consumer home appliances from manufacturers supplying retail and distribution buyers.",
  "electrical-electronics-manufacturing::mobile-phones-and-parts": "Mobile devices and repair/assembly components for retail and service-industry buyers.",
  "electrical-electronics-manufacturing::solar-panels": "Solar panels and photovoltaic equipment specified by wattage and warranty period.",

  "machinery-heavy-engineering::industrial-machines": "Production and processing machinery for manufacturing buyers, specified by capacity and power rating.",
  "machinery-heavy-engineering::agricultural-equipment": "Farm machinery and agricultural equipment for individual farmers, cooperatives, and distributors.",
  "machinery-heavy-engineering::construction-machinery": "Heavy construction equipment for contractors and rental fleet buyers.",
  "machinery-heavy-engineering::machine-tools": "Precision machine tools for manufacturing and fabrication buyers.",

  "wood-furniture-industry::furniture": "Residential, office, and institutional furniture manufacturers for retail and bulk buyers.",
  "wood-furniture-industry::plywood-and-mdf-boards": "Plywood and MDF boards by thickness and grade (including moisture-resistant BWP grade).",
  "wood-furniture-industry::doors-and-windows": "Wooden and composite doors and windows for construction and renovation buyers.",
  "wood-furniture-industry::wooden-packaging": "Wooden crates, pallets, and industrial packaging by size and load capacity.",

  "construction-material-industry::cement": "Cement by grade (OPC 43/53, PPC) for construction contractors and distributors, priced against current markets.",
  "construction-material-industry::bricks-and-tiles": "Bricks and tiles by IS standard and finish for construction and renovation buyers.",
  "construction-material-industry::glass-and-ceramics": "Construction glass and ceramic products for building and interior fit-out buyers.",
  "construction-material-industry::sanitaryware": "Bathroom and kitchen sanitaryware for construction, renovation, and retail distribution buyers.",

  "leather-industry::leather-processing": "Tanning and leather-finishing units supplying processed leather to footwear and goods manufacturers.",
  "leather-industry::shoes-and-footwear": "Leather and leather-alternative footwear manufacturers for retail and export buyers.",
  "leather-industry::bags-belts-and-wallets": "Leather goods — bags, belts, and wallets — for retail, private-label, and export buyers.",

  "petroleum-energy-manufacturing::oil-refining": "Refined petroleum products for industrial and fuel-distribution buyers.",
  "petroleum-energy-manufacturing::lubricants": "Industrial and automotive lubricants by viscosity grade for equipment and vehicle buyers.",
  "petroleum-energy-manufacturing::petrochemicals": "Petrochemical feedstocks and derivatives for manufacturing-input buyers.",
  "petroleum-energy-manufacturing::biofuels": "Biofuel manufacturers supplying industrial and fleet-scale buyers.",

  "defence-aerospace-manufacturing::aircraft-components": "Aircraft and aerospace components for qualified procurement buyers, subject to relevant export controls.",
  "defence-aerospace-manufacturing::missiles-and-weapons": "Defence weapons systems components for authorized government and defence-sector procurement.",
  "defence-aerospace-manufacturing::defence-electronics": "Defence-grade electronics and systems for authorized procurement buyers.",
  "defence-aerospace-manufacturing::space-equipment": "Space and satellite equipment components for aerospace-sector procurement buyers.",

  "consumer-goods-fmcg::soaps-and-detergents": "Soap and detergent manufacturers, including private-label/white-label production for retail brands.",
  "consumer-goods-fmcg::cosmetics-and-personal-care": "Cosmetics and personal-care products from manufacturers, subject to BIS/Cosmetics Rules compliance.",
  "consumer-goods-fmcg::home-cleaning-products": "Household cleaning product manufacturers for retail and private-label distribution buyers.",
  "consumer-goods-fmcg::stationery": "Stationery product manufacturers for retail, corporate, and institutional buyers.",

  "printing-publishing::books-and-newspapers": "Book and newspaper printing/publishing manufacturers for publishers and institutional buyers.",
  "printing-publishing::labels-and-stickers": "Custom label and sticker printing for product branding, specified by material and finish.",
  "printing-publishing::packaging-printing": "Print-on-packaging services for cartons and packaging supplied by the buyer or a packaging partner.",

  "toys-sports-goods::toys": "BIS-certified toy manufacturers for retail, institutional, and export buyers.",
  "toys-sports-goods::sports-equipment": "Sports equipment manufacturers for retail, club, and institutional buyers.",
  "toys-sports-goods::fitness-items": "Fitness equipment manufacturers for retail, home-use, and commercial gym buyers.",

  "handicrafts-cottage-industries::handloom": "Handloom textile artisans and cooperatives for retail, home-decor, and export buyers.",
  "handicrafts-cottage-industries::pottery": "Pottery and ceramic artisan manufacturers for retail and home-decor buyers.",
  "handicrafts-cottage-industries::hand-made-items": "Hand-crafted goods across categories from artisan manufacturers for retail and export buyers.",
  "handicrafts-cottage-industries::decorative-products": "Decorative and home-accent products from artisan manufacturers for retail and export buyers.",
};

export const getSubCategoryBlurb = (industryId: string, subCategoryLabel: string): string | undefined =>
  SUBCATEGORY_BLURBS[`${industryId}::${slugifySubCategory(subCategoryLabel)}`];
