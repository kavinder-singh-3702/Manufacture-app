#!/usr/bin/env node

/**
 * Seeds the App Store / Play Store reviewer demo account with realistic
 * marketplace + accounting data.
 *
 * WHY THIS EXISTS
 * App reviewers judge an app by what the demo account shows them. An empty
 * account reads as "incomplete" and is a common cause of rejection under
 * App Store Guideline 2.1 even when the code is fine. This populates the
 * account so a reviewer sees a working business: products with images and
 * stock, customers and suppliers, and posted invoices that make the
 * accounting dashboard show real numbers.
 *
 * APPROACH
 * Everything goes through the public API rather than direct Mongo writes,
 * so all normal business rules apply (validation, accounting bootstrap,
 * stock ledger postings, GST computation). Mirrors the existing
 * seedPaperPackagingProducts.js convention.
 *
 * PREREQUISITES (do these once, by hand)
 *   1. Sign up in the app with the demo email and verify the OTP.
 *   2. Create a company in the app (the accounting books bootstrap on
 *      company creation, which is why this step isn't scripted).
 *
 * PRODUCT PHOTOS (optional but strongly recommended)
 *   Drop images into src/scripts/demo-assets/ named by SKU:
 *     DEMO-YARN-40S.jpg, DEMO-KRAFT-120.jpg, ...
 *   The script reads each file and base64-encodes it before upload, so you
 *   just supply ordinary .jpg/.png/.webp files. Any SKU without an image is
 *   still created — it just shows the "No image" placeholder, which is the
 *   single weakest thing a reviewer can see.
 *
 * USAGE
 *   # dry run — prints what it would do, writes nothing
 *   node src/scripts/seedDemoAccount.js --email demo@arvann.in
 *
 *   # actually write
 *   node src/scripts/seedDemoAccount.js --email demo@arvann.in --apply
 *
 *   # against production instead of localhost
 *   node src/scripts/seedDemoAccount.js --email demo@arvann.in --apply \
 *     --api https://api.arvann.in/api
 *
 * The password is read from DEMO_SEED_PASSWORD if set, otherwise prompted
 * (hidden input).
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const DEFAULT_API_BASE = 'http://localhost:4000/api';
const REQUEST_TIMEOUT_MS = 30000;

// Drop product photos here named by SKU — e.g. DEMO-YARN-40S.jpg — and the
// script uploads them automatically. The API takes base64, but you never
// have to produce that yourself: the script reads the file and encodes it,
// exactly like the mobile app does when you pick a photo from the library.
// Missing images are skipped with a warning; the product is still created.
const ASSETS_DIR = path.join(__dirname, 'demo-assets');
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MIME_BY_EXTENSION = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

// Products span several categories so the reviewer's "Browse by category"
// grid isn't all one bucket. openingStock is set so each product is
// immediately sellable — a Sales Invoice against a 0-stock product fails
// with "insufficient stock", which would look broken to a reviewer.
const SEED_PRODUCTS = [
  {
    name: 'Cotton Yarn — 40s Combed',
    sku: 'DEMO-YARN-40S',
    category: 'textile-apparel-manufacturing',
    subCategory: 'Yarn and spinning',
    description:
      'Combed compact cotton yarn, 40s count, suitable for knitting and fine weaving. Uster-tested, cone-wound, ready for dispatch.',
    unit: 'kg',
    price: { amount: 185, currency: 'INR', unit: 'kg' },
    openingStock: 2400,
    attributes: { count: '40s', process: 'Combed compact', packing: 'Cone' },
  },
  {
    name: 'Denim Fabric — 12oz Selvedge',
    sku: 'DEMO-DENIM-12OZ',
    category: 'textile-apparel-manufacturing',
    subCategory: 'Woven fabric',
    description:
      '12oz selvedge denim in indigo warp, right-hand twill. Sanforised and ready for cutting. Roll width 36 inches.',
    unit: 'meters',
    price: { amount: 420, currency: 'INR', unit: 'meter' },
    openingStock: 800,
    attributes: { weight: '12 oz', weave: 'Right-hand twill', width: '36 in' },
  },
  {
    name: 'Kraft Paper Roll — 120 GSM',
    sku: 'DEMO-KRAFT-120',
    category: 'paper-packaging-industry',
    subCategory: 'Kraft paper',
    description:
      'Virgin kraft paper roll, 120 GSM, natural brown. Suitable for corrugation liners, wrapping, and void fill.',
    unit: 'kg',
    price: { amount: 95, currency: 'INR', unit: 'kg' },
    openingStock: 5000,
    attributes: { gsm: '120', grade: 'Virgin kraft', shade: 'Natural brown' },
  },
  {
    name: 'Corrugated Box — 3 Ply',
    sku: 'DEMO-BOX-3PLY',
    category: 'paper-packaging-industry',
    subCategory: 'Corrugated box manufacturing',
    description:
      '3-ply corrugated shipping box, 12 x 9 x 4 inches, 16 BF burst strength. Plain brown, bulk packed.',
    unit: 'boxes',
    price: { amount: 28, currency: 'INR', unit: 'box' },
    openingStock: 12000,
    attributes: { ply: '3-ply', size: '12x9x4 in', burstStrength: '16 BF' },
  },
  {
    name: 'Sodium Bicarbonate — Food Grade',
    sku: 'DEMO-NAHCO3-FG',
    category: 'chemical-manufacturing',
    subCategory: 'Industrial chemicals',
    description:
      'Food-grade sodium bicarbonate, 99.5% purity, FSSAI compliant. Packed in 25 kg HDPE bags with inner liner.',
    unit: 'kg',
    price: { amount: 32, currency: 'INR', unit: 'kg' },
    openingStock: 8000,
    attributes: { purity: '99.5%', grade: 'Food grade', packing: '25 kg bag' },
  },
  {
    name: 'Copper Wire — 1.5 sq mm',
    sku: 'DEMO-CU-15SQMM',
    category: 'electrical-electronics-manufacturing',
    subCategory: 'Wires and cables',
    description:
      'Electrolytic grade copper wire, 1.5 sq mm, PVC insulated, FR grade. ISI marked, 90m coils.',
    unit: 'kg',
    price: { amount: 720, currency: 'INR', unit: 'kg' },
    openingStock: 1500,
    attributes: { crossSection: '1.5 sq mm', insulation: 'PVC FR', standard: 'ISI marked' },
  },
  {
    name: 'Deep Groove Ball Bearing 6205-2RS',
    sku: 'DEMO-BRG-6205',
    category: 'automobile-auto-components',
    subCategory: 'Bearings',
    description:
      'Deep groove ball bearing, 25mm bore, double rubber sealed. Suitable for electric motors, pumps, and gearboxes.',
    unit: 'pieces',
    price: { amount: 340, currency: 'INR', unit: 'piece' },
    openingStock: 3000,
    attributes: { bore: '25 mm', seal: '2RS double rubber', clearance: 'C3' },
  },
  {
    name: 'Basmati Rice — 1121 Steam',
    sku: 'DEMO-RICE-1121',
    category: 'food-beverage-manufacturing',
    subCategory: 'Grains and staples',
    description:
      '1121 basmati rice, steam processed, average grain length 8.3mm. Sortex cleaned, packed in 25 kg PP bags.',
    unit: 'kg',
    price: { amount: 78, currency: 'INR', unit: 'kg' },
    openingStock: 20000,
    attributes: { variety: '1121', process: 'Steam', grainLength: '8.3 mm' },
  },
];

const SEED_PARTIES = [
  {
    name: 'Tirupati Textiles Pvt Ltd',
    type: 'customer',
    gstin: '27AABCT1234M1Z5',
    contact: { contactPerson: 'Ramesh Iyer', phone: '9820011223', email: 'accounts@tirupatitex.example' },
    creditDaysDefault: 30,
  },
  {
    name: 'Anand Packaging Solutions',
    type: 'customer',
    gstin: '24AAACA9876P1ZQ',
    contact: { contactPerson: 'Nisha Patel', phone: '9825566778', email: 'purchase@anandpack.example' },
    creditDaysDefault: 45,
  },
  {
    name: 'Ravi Kumar Traders',
    type: 'supplier',
    gstin: '07AAKCR4455L1ZB',
    contact: { contactPerson: 'Ravi Kumar', phone: '9811223344', email: 'sales@ravikumartraders.example' },
    creditDaysDefault: 15,
  },
];

// Invoices reference products by SKU and parties by name; both are resolved
// to ids at run time. Rates are deliberately a bit below list price to look
// like negotiated B2B pricing rather than copy-pasted MRP.
const SEED_INVOICES = [
  {
    kind: 'sales_invoice',
    party: 'Tirupati Textiles Pvt Ltd',
    daysAgo: 24,
    narration: 'Monthly yarn supply — March lot',
    items: [
      { sku: 'DEMO-YARN-40S', quantity: 600, rate: 178 },
      { sku: 'DEMO-DENIM-12OZ', quantity: 150, rate: 405 },
    ],
  },
  {
    kind: 'sales_invoice',
    party: 'Anand Packaging Solutions',
    daysAgo: 16,
    narration: 'Kraft reels and cartons',
    items: [
      { sku: 'DEMO-KRAFT-120', quantity: 900, rate: 91 },
      { sku: 'DEMO-BOX-3PLY', quantity: 2500, rate: 26 },
    ],
  },
  {
    kind: 'purchase_bill',
    party: 'Ravi Kumar Traders',
    daysAgo: 20,
    narration: 'Raw material restock',
    items: [
      { sku: 'DEMO-NAHCO3-FG', quantity: 2000, rate: 27 },
      { sku: 'DEMO-CU-15SQMM', quantity: 300, rate: 665 },
    ],
  },
  {
    kind: 'sales_invoice',
    party: 'Tirupati Textiles Pvt Ltd',
    daysAgo: 5,
    narration: 'Bearings and hardware',
    items: [{ sku: 'DEMO-BRG-6205', quantity: 400, rate: 322 }],
  },
];

// ---------------------------------------------------------------------------
// Tiny HTTP + CLI helpers
// ---------------------------------------------------------------------------

const parseArgs = (argv) => {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      args[key] = true;
    } else {
      args[key] = next;
      i += 1;
    }
  }
  return args;
};

const promptVisible = (label) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(`${label}: `, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

const promptHidden = (label) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const onData = (char) => {
      const c = String(char);
      if (c === '\n' || c === '\r' || c === '') {
        process.stdin.removeListener('data', onData);
      } else {
        process.stdout.write('\x1B[2K\x1B[200D' + label + ': ' + '*'.repeat(rl.line.length));
      }
    };
    process.stdin.on('data', onData);
    rl.question(`${label}: `, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer.trim());
    });
  });

const requestJson = async ({ apiBase, path, method = 'GET', token, body, query }) => {
  const url = new URL(apiBase.replace(/\/$/, '') + path);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const text = await response.text();
    let parsed = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = null;
    }

    if (!response.ok) {
      const message =
        parsed?.error ||
        parsed?.message ||
        (Array.isArray(parsed?.errors) ? parsed.errors.map((e) => e.msg).join(', ') : null) ||
        `${response.status} ${response.statusText}`;
      const err = new Error(`${method} ${path} failed: ${message}`);
      err.status = response.status;
      throw err;
    }
    return parsed;
  } finally {
    clearTimeout(timer);
  }
};

const isoDaysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(11, 0, 0, 0);
  return d.toISOString();
};

const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

/**
 * Looks for demo-assets/<SKU>.<ext> and returns an upload payload, or null
 * if no image was provided for this SKU.
 *
 * The product image API takes base64 in `content` (there's no multipart
 * variant for product images), so we read the file and encode it here —
 * the same thing the mobile app does after you pick a photo. Nobody has to
 * hand-produce base64.
 */
const findImageForSku = (sku) => {
  for (const ext of IMAGE_EXTENSIONS) {
    const candidate = path.join(ASSETS_DIR, `${sku}${ext}`);
    if (fs.existsSync(candidate)) {
      const buffer = fs.readFileSync(candidate);
      return {
        fileName: `${sku}${ext}`,
        mimeType: MIME_BY_EXTENSION[ext] || 'image/jpeg',
        content: buffer.toString('base64'),
        sizeKb: Math.round(buffer.length / 1024),
      };
    }
  }
  return null;
};

const uploadProductImage = async ({ apiBase, token, productId, sku }) => {
  const image = findImageForSku(sku);
  if (!image) return { uploaded: false, reason: 'no local image' };

  // A failed image upload must not abort the whole seed — the product is
  // already created and useful without a photo.
  try {
    await requestJson({
      apiBase,
      token,
      path: `/products/${productId}/images`,
      method: 'POST',
      body: { fileName: image.fileName, mimeType: image.mimeType, content: image.content },
    });
    return { uploaded: true, sizeKb: image.sizeKb };
  } catch (err) {
    return { uploaded: false, reason: err.message };
  }
};

// ---------------------------------------------------------------------------
// Seed steps
// ---------------------------------------------------------------------------

const seedProducts = async ({ apiBase, token, apply }) => {
  // Existing products are matched by SKU so re-running is safe — the script
  // skips anything already present rather than creating duplicates.
  const existing = await requestJson({
    apiBase,
    token,
    path: '/products',
    query: { scope: 'company', limit: 200, offset: 0 },
  });
  const bySku = new Map(
    (existing?.products || [])
      .filter((p) => p.sku)
      .map((p) => [String(p.sku).toUpperCase(), p])
  );

  const created = [];
  const skipped = [];

  for (const seed of SEED_PRODUCTS) {
    const key = seed.sku.toUpperCase();
    if (bySku.has(key)) {
      skipped.push(seed.sku);
      created.push({ sku: seed.sku, id: bySku.get(key)._id });
      continue;
    }

    if (!apply) {
      const img = findImageForSku(seed.sku);
      const imgNote = img ? ` + image (${img.sizeKb} KB)` : ' (no image found)';
      console.log(`  [dry-run] would create ${seed.name} (${seed.sku}) · stock ${seed.openingStock}${imgNote}`);
      created.push({ sku: seed.sku, id: null });
      continue;
    }

    const payload = {
      name: seed.name,
      sku: seed.sku,
      description: seed.description,
      category: seed.category,
      subCategory: seed.subCategory,
      unit: seed.unit,
      price: seed.price,
      openingStock: seed.openingStock,
      status: 'active',
      visibility: 'public',
      attributes: seed.attributes,
      contactPreferences: { allowChat: true, allowCall: true },
    };

    const res = await requestJson({ apiBase, token, path: '/products', method: 'POST', body: payload });
    const product = res?.product || res;
    const productId = product?._id;
    console.log(`  ✓ ${seed.name} — ${money(seed.price.amount)}/${seed.price.unit}, stock ${seed.openingStock}`);

    if (productId) {
      const img = await uploadProductImage({ apiBase, token, productId, sku: seed.sku });
      if (img.uploaded) {
        console.log(`      ↳ image uploaded (${img.sizeKb} KB)`);
      } else if (img.reason !== 'no local image') {
        console.log(`      ↳ image upload failed: ${img.reason}`);
      }
    }

    created.push({ sku: seed.sku, id: productId });
  }

  if (skipped.length) {
    console.log(`  (skipped ${skipped.length} already present: ${skipped.join(', ')})`);
  }
  return created;
};

const seedParties = async ({ apiBase, token, apply }) => {
  const existing = await requestJson({
    apiBase,
    token,
    // listPartiesValidation caps limit at 100 — a larger value fails
    // validation with a bare "Invalid value".
    path: '/accounting/parties',
    query: { limit: 100, offset: 0 },
  });
  const byName = new Map(
    (existing?.parties || []).map((p) => [String(p.name).trim().toLowerCase(), p])
  );

  const result = new Map();

  for (const seed of SEED_PARTIES) {
    const key = seed.name.trim().toLowerCase();
    if (byName.has(key)) {
      console.log(`  (exists) ${seed.name}`);
      result.set(seed.name, byName.get(key)._id);
      continue;
    }
    if (!apply) {
      console.log(`  [dry-run] would create party ${seed.name} (${seed.type})`);
      result.set(seed.name, null);
      continue;
    }
    const res = await requestJson({
      apiBase,
      token,
      path: '/accounting/parties',
      method: 'POST',
      body: seed,
    });
    const party = res?.party || res;
    console.log(`  ✓ ${seed.name} (${seed.type})`);
    result.set(seed.name, party?._id);
  }

  return result;
};

const seedVouchers = async ({ apiBase, token, apply, productIdBySku, partyIdByName }) => {
  const existing = await requestJson({
    apiBase,
    token,
    path: '/accounting/vouchers',
    query: { limit: 100, offset: 0 },
  });

  // Only trade vouchers count as "already seeded". Setting openingStock on
  // a product posts a stock_adjustment voucher, so a freshly seeded catalog
  // always arrives with one per product — counting those would skip the
  // invoices and leave Sales/Purchases at zero, which is the whole thing
  // this script exists to avoid.
  const tradeVouchers = (existing?.vouchers || []).filter((v) =>
    ['sales_invoice', 'purchase_bill'].includes(v.voucherType)
  );
  if (tradeVouchers.length > 0) {
    console.log(`  (skipped — ${tradeVouchers.length} sales/purchase voucher(s) already exist)`);
    return;
  }

  for (const seed of SEED_INVOICES) {
    const partyId = partyIdByName.get(seed.party);
    const items = seed.items
      .map((line) => {
        const productId = productIdBySku.get(line.sku);
        if (!productId) return null;
        return {
          product: productId,
          quantity: line.quantity,
          rate: line.rate,
          amount: line.quantity * line.rate,
          description: line.sku,
        };
      })
      .filter(Boolean);

    // Compute from the seed definition rather than `items` so the dry run
    // reports a real figure — in dry-run mode no products exist yet, so
    // `items` resolves empty and every total would print as ₹0.
    const total = seed.items.reduce((sum, line) => sum + line.quantity * line.rate, 0);
    const label = seed.kind === 'sales_invoice' ? 'Sales Invoice' : 'Purchase Bill';

    if (!apply) {
      console.log(`  [dry-run] would post ${label} to ${seed.party} — ${money(total)}`);
      continue;
    }
    if (!partyId || items.length !== seed.items.length) {
      console.log(`  ! skipped ${label} for ${seed.party} (missing party or product ids)`);
      continue;
    }

    await requestJson({
      apiBase,
      token,
      path: '/accounting/vouchers',
      method: 'POST',
      body: {
        voucherType: seed.kind,
        status: 'posted',
        date: isoDaysAgo(seed.daysAgo),
        partyId,
        narration: seed.narration,
        lines: { items },
        gst: { enabled: true, gstType: 'cgst_sgst' },
      },
    });
    console.log(`  ✓ ${label} → ${seed.party} — ${money(total)}`);
  }
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const main = async () => {
  const args = parseArgs(process.argv.slice(2));
  const apiBase = String(args.api || process.env.DEMO_SEED_API || DEFAULT_API_BASE).trim();
  const apply = Boolean(args.apply);

  const email = String(args.email || '').trim() || (await promptVisible('Demo account email'));
  if (!email) throw new Error('Email is required');

  const password =
    String(process.env.DEMO_SEED_PASSWORD || '').trim() || (await promptHidden('Password'));
  if (!password) throw new Error('Password is required');

  console.log('');
  console.log(`API      : ${apiBase}`);
  console.log(`Account  : ${email}`);
  console.log(`Mode     : ${apply ? 'APPLY (writes data)' : 'DRY RUN (no writes)'}`);
  console.log('');

  const login = await requestJson({
    apiBase,
    path: '/auth/login',
    method: 'POST',
    body: { email, password },
  });
  const token = login?.token;
  const user = login?.user;
  if (!token) throw new Error('Login succeeded but no token was returned');
  if (!user?.activeCompany) {
    throw new Error(
      'This account has no active company. Create a company in the app first — accounting books bootstrap on company creation.'
    );
  }
  console.log(`Signed in as ${user.displayName || user.email} (company ${user.activeCompany})`);

  const withImages = SEED_PRODUCTS.filter((p) => findImageForSku(p.sku)).length;
  if (withImages === 0) {
    console.log('');
    console.log(`No product photos found in ${ASSETS_DIR}`);
    console.log('Products will be created without images. To add them, drop .jpg/.png files');
    console.log('named by SKU into that folder and re-run — e.g. DEMO-YARN-40S.jpg');
  } else {
    console.log(`Product photos found: ${withImages}/${SEED_PRODUCTS.length}`);
  }
  console.log('');

  console.log('Products');
  const products = await seedProducts({ apiBase, token, apply });
  const productIdBySku = new Map(products.filter((p) => p.id).map((p) => [p.sku, p.id]));
  console.log('');

  console.log('Parties');
  const partyIdByName = await seedParties({ apiBase, token, apply });
  console.log('');

  console.log('Vouchers');
  await seedVouchers({ apiBase, token, apply, productIdBySku, partyIdByName });
  console.log('');

  if (apply) {
    console.log('Done. Open the app and check:');
    console.log('  • Home → Browse by category shows populated categories');
    console.log('  • Accounts → Accounting shows non-zero Sales / Purchases / Stock Value');
    console.log('  • Company Profile → Products lists the seeded catalog');
  } else {
    console.log('Dry run complete. Re-run with --apply to write.');
  }
};

main().catch((err) => {
  console.error('');
  console.error(`Seed failed: ${err.message}`);
  process.exitCode = 1;
});
