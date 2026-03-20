#!/usr/bin/env node

const readline = require('readline');

const DEFAULT_API_BASE = 'http://localhost:4000/api';
const REQUEST_TIMEOUT_MS = 30000;

const SEED_PRODUCTS = [
  {
    name: 'Kraft Corrugated Shipping Box',
    sku: 'PPBX-KRAFT-BASE',
    category: 'paper-packaging-industry',
    subCategory: 'Corrugated box manufacturing',
    description:
      '3/5-ply kraft corrugated dispatch boxes for industrial shipments and e-commerce packaging lines.',
    unit: 'boxes',
    price: { amount: 32, currency: 'INR', unit: 'box' },
    attributes: {
      material: 'Kraft corrugated board',
      burstStrength: '16-22 BF',
      finish: 'Natural brown'
    },
    images: [
      {
        fileName: 'ppbx-kraft-cover.png',
        url: 'https://placehold.co/1200x900/png?text=Kraft+Corrugated+Shipping+Box+Cover'
      },
      {
        fileName: 'ppbx-kraft-stack.png',
        url: 'https://placehold.co/1200x900/png?text=Kraft+Corrugated+Box+Stack'
      },
      {
        fileName: 'ppbx-kraft-detail.png',
        url: 'https://placehold.co/1200x900/png?text=Kraft+Corrugated+Board+Detail'
      }
    ],
    variants: [
      {
        title: '9 x 6 x 3 in',
        sku: 'PPBX-KRAFT-090603',
        options: { size: '9x6x3 in' },
        price: { amount: 24, currency: 'INR', unit: 'box' },
        unit: 'box',
        status: 'active',
        attributes: { ply: '3-ply' }
      },
      {
        title: '12 x 9 x 4 in',
        sku: 'PPBX-KRAFT-120904',
        options: { size: '12x9x4 in' },
        price: { amount: 32, currency: 'INR', unit: 'box' },
        unit: 'box',
        status: 'active',
        attributes: { ply: '5-ply' }
      },
      {
        title: '16 x 12 x 6 in',
        sku: 'PPBX-KRAFT-161206',
        options: { size: '16x12x6 in' },
        price: { amount: 49, currency: 'INR', unit: 'box' },
        unit: 'box',
        status: 'active',
        attributes: { ply: '5-ply' }
      }
    ]
  },
  {
    name: 'Duplex Printed Folding Carton',
    sku: 'PPCT-DUPLEX-BASE',
    category: 'paper-packaging-industry',
    subCategory: 'Cartons & duplex boxes',
    description:
      'Offset-print ready duplex cartons for FMCG, pharma and cosmetic secondary packaging applications.',
    unit: 'pieces',
    price: { amount: 4.5, currency: 'INR', unit: 'piece' },
    attributes: {
      material: 'Duplex board',
      printType: 'Offset CMYK',
      coating: 'Aqueous'
    },
    images: [
      {
        fileName: 'ppct-duplex-cover.png',
        url: 'https://placehold.co/1200x900/png?text=Duplex+Printed+Folding+Carton+Cover'
      },
      {
        fileName: 'ppct-duplex-flat.png',
        url: 'https://placehold.co/1200x900/png?text=Duplex+Carton+Flat+Sheet'
      },
      {
        fileName: 'ppct-duplex-packed.png',
        url: 'https://placehold.co/1200x900/png?text=Printed+Carton+Packed+View'
      }
    ],
    variants: [
      {
        title: '300 GSM',
        sku: 'PPCT-DUPLEX-300GSM',
        options: { gsm: '300' },
        price: { amount: 3.9, currency: 'INR', unit: 'piece' },
        unit: 'piece',
        status: 'active',
        attributes: { boardGrade: '300 GSM' }
      },
      {
        title: '350 GSM',
        sku: 'PPCT-DUPLEX-350GSM',
        options: { gsm: '350' },
        price: { amount: 4.5, currency: 'INR', unit: 'piece' },
        unit: 'piece',
        status: 'active',
        attributes: { boardGrade: '350 GSM' }
      },
      {
        title: '400 GSM',
        sku: 'PPCT-DUPLEX-400GSM',
        options: { gsm: '400' },
        price: { amount: 5.2, currency: 'INR', unit: 'piece' },
        unit: 'piece',
        status: 'active',
        attributes: { boardGrade: '400 GSM' }
      }
    ]
  },
  {
    name: 'Stand-Up Barrier Pouch (Food Grade)',
    sku: 'PPPO-STANDUP-BASE',
    category: 'paper-packaging-industry',
    subCategory: 'Flexible packaging (pouches, films)',
    description:
      'Food-grade laminated stand-up pouches with zipper lock for powders, snacks, dry fruits and blended mixes.',
    unit: 'pieces',
    price: { amount: 2.8, currency: 'INR', unit: 'piece' },
    attributes: {
      laminate: 'PET+MPET+PE',
      closure: 'Zip lock',
      foodGrade: 'Yes'
    },
    images: [
      {
        fileName: 'pppo-standup-cover.png',
        url: 'https://placehold.co/1200x900/png?text=Stand-Up+Barrier+Pouch+Cover'
      },
      {
        fileName: 'pppo-standup-front.png',
        url: 'https://placehold.co/1200x900/png?text=Stand-Up+Pouch+Front+View'
      },
      {
        fileName: 'pppo-standup-zip.png',
        url: 'https://placehold.co/1200x900/png?text=Stand-Up+Pouch+Zip+Detail'
      }
    ],
    variants: [
      {
        title: '250 g',
        sku: 'PPPO-STANDUP-250G',
        options: { capacity: '250g' },
        price: { amount: 2.1, currency: 'INR', unit: 'piece' },
        unit: 'piece',
        status: 'active',
        attributes: { thickness: '90 micron' }
      },
      {
        title: '500 g',
        sku: 'PPPO-STANDUP-500G',
        options: { capacity: '500g' },
        price: { amount: 2.8, currency: 'INR', unit: 'piece' },
        unit: 'piece',
        status: 'active',
        attributes: { thickness: '100 micron' }
      },
      {
        title: '1 kg',
        sku: 'PPPO-STANDUP-1KG',
        options: { capacity: '1kg' },
        price: { amount: 3.9, currency: 'INR', unit: 'piece' },
        unit: 'piece',
        status: 'active',
        attributes: { thickness: '110 micron' }
      }
    ]
  },
  {
    name: 'Virgin Tissue Jumbo Roll',
    sku: 'PPTI-JUMBO-BASE',
    category: 'paper-packaging-industry',
    subCategory: 'Tissue paper & notebooks',
    description:
      'Virgin pulp jumbo tissue rolls suited for converter lines making kitchen, napkin and toilet tissue products.',
    unit: 'rolls',
    price: { amount: 23, currency: 'INR', unit: 'roll' },
    attributes: {
      pulpType: 'Virgin pulp',
      reelCore: '3 inch',
      color: 'Natural white'
    },
    images: [
      {
        fileName: 'ppti-jumbo-cover.png',
        url: 'https://placehold.co/1200x900/png?text=Virgin+Tissue+Jumbo+Roll+Cover'
      },
      {
        fileName: 'ppti-jumbo-stack.png',
        url: 'https://placehold.co/1200x900/png?text=Tissue+Jumbo+Roll+Stack'
      },
      {
        fileName: 'ppti-jumbo-core.png',
        url: 'https://placehold.co/1200x900/png?text=Tissue+Jumbo+Roll+Core+Detail'
      }
    ],
    variants: [
      {
        title: '1 Ply · 100 m',
        sku: 'PPTI-JUMBO-1PLY-100M',
        options: { ply: '1', length: '100m' },
        price: { amount: 19, currency: 'INR', unit: 'roll' },
        unit: 'roll',
        status: 'active',
        attributes: { gsm: '16' }
      },
      {
        title: '2 Ply · 100 m',
        sku: 'PPTI-JUMBO-2PLY-100M',
        options: { ply: '2', length: '100m' },
        price: { amount: 23, currency: 'INR', unit: 'roll' },
        unit: 'roll',
        status: 'active',
        attributes: { gsm: '18' }
      },
      {
        title: '2 Ply · 150 m',
        sku: 'PPTI-JUMBO-2PLY-150M',
        options: { ply: '2', length: '150m' },
        price: { amount: 31, currency: 'INR', unit: 'roll' },
        unit: 'roll',
        status: 'active',
        attributes: { gsm: '20' }
      }
    ]
  }
];

class ApiRequestError extends Error {
  constructor(message, { status, method, url, data } = {}) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.method = method;
    this.url = url;
    this.data = data;
  }
}

const parseArgs = (argv) => {
  const args = {
    apply: false,
    apiBase: DEFAULT_API_BASE,
    email: undefined,
    help: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--apply') {
      args.apply = true;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      args.help = true;
      continue;
    }
    if (arg === '--api-base') {
      args.apiBase = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg.startsWith('--api-base=')) {
      args.apiBase = arg.slice('--api-base='.length);
      continue;
    }
    if (arg === '--email') {
      args.email = argv[index + 1];
      index += 1;
      continue;
    }
    if (arg.startsWith('--email=')) {
      args.email = arg.slice('--email='.length);
      continue;
    }
    throw new Error(`Unknown argument "${arg}". Use --help for usage.`);
  }

  return args;
};

const normalizeApiBase = (apiBase) => {
  const trimmed = String(apiBase || '').trim().replace(/\/+$/, '');
  if (!trimmed) return DEFAULT_API_BASE;
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
};

const showUsage = () => {
  console.log(`
Usage:
  npm run seed:paper-packaging -- [--apply] [--api-base <url>] [--email <email>]

Examples:
  npm run seed:paper-packaging
  npm run seed:paper-packaging -- --apply --email ks176460@gmail.com
  npm run seed:paper-packaging -- --apply --api-base http://localhost:4000/api

Optional non-interactive password input:
  PAPER_PACKAGING_SEED_PASSWORD=<password> npm run seed:paper-packaging -- --apply --email you@example.com
`);
};

const promptVisible = async (label, fallbackValue) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  const promptLabel = fallbackValue ? `${label} (${fallbackValue}): ` : `${label}: `;
  const value = await new Promise((resolve) => {
    rl.question(promptLabel, (answer) => resolve(answer));
  });
  rl.close();
  const normalized = String(value || '').trim();
  return normalized || (fallbackValue ? String(fallbackValue).trim() : '');
};

const promptHidden = async (label) => {
  if (!process.stdin.isTTY) {
    throw new Error('Password prompt requires an interactive terminal');
  }

  const stdin = process.stdin;
  const stdout = process.stdout;

  stdout.write(`${label}: `);
  stdin.resume();
  stdin.setRawMode(true);
  stdin.setEncoding('utf8');

  return new Promise((resolve, reject) => {
    let value = '';

    const onData = (key) => {
      if (key === '\u0003') {
        cleanup();
        reject(new Error('Input cancelled by user'));
        return;
      }

      if (key === '\r' || key === '\n') {
        stdout.write('\n');
        cleanup();
        resolve(value.trim());
        return;
      }

      if (key === '\u0008' || key === '\u007f') {
        if (value.length > 0) {
          value = value.slice(0, -1);
          stdout.write('\b \b');
        }
        return;
      }

      value += key;
      stdout.write('*');
    };

    const cleanup = () => {
      stdin.removeListener('data', onData);
      stdin.setRawMode(false);
      stdin.pause();
    };

    stdin.on('data', onData);
  });
};

const withTimeout = async (promiseFactory, timeoutMs, timeoutMessage) => {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await promiseFactory(controller.signal);
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(timeoutMessage);
    }
    throw error;
  } finally {
    clearTimeout(timeoutHandle);
  }
};

const toJsonOrText = async (response) => {
  const rawText = await response.text();
  if (!rawText) return null;
  try {
    return JSON.parse(rawText);
  } catch (error) {
    return { message: rawText };
  }
};

const requestJson = async ({ apiBase, path, method = 'GET', token, body }) => {
  const url = `${apiBase}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = { Accept: 'application/json' };
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await withTimeout(
    (signal) =>
      fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal
      }),
    REQUEST_TIMEOUT_MS,
    `Request timeout for ${method} ${url}`
  );

  const data = await toJsonOrText(response);
  if (!response.ok) {
    const message = data?.message || data?.error || `Request failed with status ${response.status}`;
    throw new ApiRequestError(message, {
      status: response.status,
      method,
      url,
      data
    });
  }
  return data;
};

const inferMimeType = (url, fallback = 'image/jpeg') => {
  const lower = String(url || '').toLowerCase();
  if (lower.includes('.png')) return 'image/png';
  if (lower.includes('.webp')) return 'image/webp';
  if (lower.includes('.jpg') || lower.includes('.jpeg')) return 'image/jpeg';
  return fallback;
};

const downloadImage = async (url) => {
  const response = await withTimeout(
    (signal) => fetch(url, { method: 'GET', signal }),
    REQUEST_TIMEOUT_MS,
    `Image download timeout: ${url}`
  );
  if (!response.ok) {
    throw new Error(`Image download failed (${response.status}) for ${url}`);
  }
  const mimeType = response.headers.get('content-type') || inferMimeType(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (!buffer.length) {
    throw new Error(`Image download returned empty content for ${url}`);
  }
  return {
    base64: buffer.toString('base64'),
    mimeType
  };
};

const normalizeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeObject = (value) => {
  if (Array.isArray(value)) return value.map(normalizeObject);
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        acc[key] = normalizeObject(value[key]);
        return acc;
      }, {});
  }
  return value;
};

const deepEqual = (left, right) => JSON.stringify(normalizeObject(left)) === JSON.stringify(normalizeObject(right));

const normalizeProductComparisonShape = (value) => ({
  name: String(value?.name || '').trim(),
  description: String(value?.description || '').trim(),
  sku: String(value?.sku || '').trim().toUpperCase(),
  category: String(value?.category || '').trim(),
  subCategory: String(value?.subCategory || '').trim(),
  unit: String(value?.unit || '').trim(),
  visibility: String(value?.visibility || '').trim(),
  status: String(value?.status || '').trim(),
  price: {
    amount: normalizeNumber(value?.price?.amount),
    currency: String(value?.price?.currency || '').trim().toUpperCase(),
    unit: String(value?.price?.unit || '').trim()
  },
  contactPreferences: {
    allowChat: Boolean(value?.contactPreferences?.allowChat),
    allowCall: Boolean(value?.contactPreferences?.allowCall)
  },
  attributes: value?.attributes || {},
  metadata: value?.metadata || {}
});

const normalizeVariantComparisonShape = (value) => ({
  title: String(value?.title || '').trim(),
  sku: String(value?.sku || '').trim().toUpperCase(),
  options: value?.options || {},
  unit: String(value?.unit || '').trim(),
  status: String(value?.status || '').trim(),
  price: {
    amount: normalizeNumber(value?.price?.amount),
    currency: String(value?.price?.currency || '').trim().toUpperCase(),
    unit: String(value?.price?.unit || '').trim()
  },
  attributes: value?.attributes || {}
});

const buildProductPayload = (seedProduct) => ({
  name: seedProduct.name,
  description: seedProduct.description,
  sku: seedProduct.sku,
  category: seedProduct.category,
  subCategory: seedProduct.subCategory,
  unit: seedProduct.unit,
  visibility: 'public',
  status: 'active',
  price: {
    amount: seedProduct.price.amount,
    currency: seedProduct.price.currency,
    unit: seedProduct.price.unit
  },
  contactPreferences: {
    allowChat: true,
    allowCall: true
  },
  attributes: seedProduct.attributes || {},
  metadata: {
    seedTag: 'paper-packaging-v1'
  }
});

const buildVariantPayload = (seedVariant) => ({
  title: seedVariant.title,
  sku: seedVariant.sku,
  options: seedVariant.options,
  price: seedVariant.price,
  unit: seedVariant.unit,
  status: seedVariant.status || 'active',
  attributes: seedVariant.attributes || {}
});

const findProductBySku = async ({ apiBase, token, sku }) => {
  const params = new URLSearchParams({
    scope: 'company',
    search: sku,
    limit: '100',
    offset: '0'
  });
  const response = await requestJson({
    apiBase,
    path: `/products?${params.toString()}`,
    method: 'GET',
    token
  });
  const products = Array.isArray(response?.products) ? response.products : [];
  const exactMatches = products.filter((product) => String(product?.sku || '').trim().toUpperCase() === sku.toUpperCase());
  if (!exactMatches.length) return null;
  return exactMatches[0];
};

const getProductById = async ({ apiBase, token, productId }) => {
  const response = await requestJson({
    apiBase,
    path: `/products/${productId}?scope=company`,
    method: 'GET',
    token
  });
  return response?.product || null;
};

const listProductVariants = async ({ apiBase, token, productId }) => {
  const response = await requestJson({
    apiBase,
    path: `/products/${productId}/variants?limit=100&offset=0`,
    method: 'GET',
    token
  });
  return Array.isArray(response?.variants) ? response.variants : [];
};

const upsertSeedProduct = async ({ apiBase, token, seedProduct, apply }) => {
  const payload = buildProductPayload(seedProduct);
  const existing = await findProductBySku({ apiBase, token, sku: seedProduct.sku });

  if (!existing) {
    if (!apply) {
      return { status: 'would_create', productId: null, product: null };
    }
    const created = await requestJson({
      apiBase,
      path: '/products',
      method: 'POST',
      token,
      body: payload
    });
    return {
      status: 'created',
      productId: created?.product?._id,
      product: created?.product || null
    };
  }

  const isSame = deepEqual(
    normalizeProductComparisonShape(existing),
    normalizeProductComparisonShape(payload)
  );

  if (isSame) {
    return {
      status: apply ? 'skipped' : 'would_skip',
      productId: existing._id,
      product: existing
    };
  }

  if (!apply) {
    return {
      status: 'would_update',
      productId: existing._id,
      product: existing
    };
  }

  const updated = await requestJson({
    apiBase,
    path: `/products/${existing._id}`,
    method: 'PUT',
    token,
    body: payload
  });

  return {
    status: 'updated',
    productId: updated?.product?._id || existing._id,
    product: updated?.product || existing
  };
};

const upsertProductImages = async ({ apiBase, token, apply, productId, productSnapshot, seedProduct }) => {
  const existingImageNames = new Set(
    (productSnapshot?.images || [])
      .map((image) => String(image?.fileName || '').trim().toLowerCase())
      .filter(Boolean)
  );

  const result = {
    uploaded: 0,
    skipped: 0
  };

  for (const image of seedProduct.images) {
    const normalizedFileName = String(image.fileName || '').trim().toLowerCase();
    if (!normalizedFileName) {
      throw new Error(`Invalid image fileName for SKU ${seedProduct.sku}`);
    }

    if (existingImageNames.has(normalizedFileName)) {
      result.skipped += 1;
      continue;
    }

    if (!apply) {
      result.uploaded += 1;
      existingImageNames.add(normalizedFileName);
      continue;
    }

    const downloaded = await downloadImage(image.url);
    await requestJson({
      apiBase,
      path: `/products/${productId}/images`,
      method: 'POST',
      token,
      body: {
        fileName: image.fileName,
        mimeType: downloaded.mimeType || inferMimeType(image.url),
        content: downloaded.base64
      }
    });
    result.uploaded += 1;
    existingImageNames.add(normalizedFileName);
  }

  return result;
};

const upsertProductVariants = async ({ apiBase, token, apply, productId, seedProduct }) => {
  const existingVariants = productId ? await listProductVariants({ apiBase, token, productId }) : [];
  const variantBySku = new Map();
  existingVariants.forEach((variant) => {
    const sku = String(variant?.sku || '').trim().toUpperCase();
    if (sku) {
      variantBySku.set(sku, variant);
    }
  });

  const result = {
    created: 0,
    updated: 0,
    skipped: 0
  };

  for (const seedVariant of seedProduct.variants) {
    const payload = buildVariantPayload(seedVariant);
    const existing = variantBySku.get(seedVariant.sku.toUpperCase());

    if (!existing) {
      if (!apply) {
        result.created += 1;
        continue;
      }
      await requestJson({
        apiBase,
        path: `/products/${productId}/variants`,
        method: 'POST',
        token,
        body: payload
      });
      result.created += 1;
      continue;
    }

    const isSame = deepEqual(
      normalizeVariantComparisonShape(existing),
      normalizeVariantComparisonShape(payload)
    );

    if (isSame) {
      result.skipped += 1;
      continue;
    }

    if (!apply) {
      result.updated += 1;
      continue;
    }

    await requestJson({
      apiBase,
      path: `/products/${productId}/variants/${existing._id}`,
      method: 'PUT',
      token,
      body: payload
    });
    result.updated += 1;
  }

  return result;
};

const formatFailure = (error) => {
  if (!error) return 'Unknown error';
  if (error instanceof ApiRequestError) {
    const status = error.status ? `status=${error.status}` : 'status=n/a';
    return `${error.message} (${status})`;
  }
  return error.message || String(error);
};

const processSeedProduct = async ({ apiBase, token, apply, seedProduct }) => {
  const summary = {
    sku: seedProduct.sku,
    name: seedProduct.name,
    productStatus: 'skipped',
    images: { uploaded: 0, skipped: 0 },
    variants: { created: 0, updated: 0, skipped: 0 },
    error: null
  };

  let createdInRun = false;
  let createdProductId = null;

  try {
    const upsert = await upsertSeedProduct({ apiBase, token, seedProduct, apply });
    summary.productStatus = upsert.status;
    createdInRun = upsert.status === 'created';
    createdProductId = createdInRun ? upsert.productId : null;

    let productSnapshot = upsert.product;
    const canFetchSnapshot = Boolean(upsert.productId);
    if (canFetchSnapshot) {
      productSnapshot = await getProductById({ apiBase, token, productId: upsert.productId });
    } else {
      productSnapshot = { images: [] };
    }

    const imageSummary = await upsertProductImages({
      apiBase,
      token,
      apply,
      productId: upsert.productId,
      productSnapshot,
      seedProduct
    });
    summary.images = imageSummary;

    const variantSummary = await upsertProductVariants({
      apiBase,
      token,
      apply,
      productId: upsert.productId,
      seedProduct
    });
    summary.variants = variantSummary;
  } catch (error) {
    summary.error = formatFailure(error);

    if (apply && createdInRun && createdProductId) {
      try {
        await requestJson({
          apiBase,
          path: `/products/${createdProductId}`,
          method: 'DELETE',
          token
        });
        summary.error = `${summary.error}. Rolled back created product ${createdProductId}.`;
      } catch (rollbackError) {
        summary.error = `${summary.error}. Rollback failed: ${formatFailure(rollbackError)}`;
      }
    }
  }

  return summary;
};

const printSummary = ({ apply, apiBase, user, results }) => {
  console.log('\n[seed:paper-packaging] --------------------------------------------------');
  console.log(`[seed:paper-packaging] Mode       : ${apply ? 'APPLY' : 'DRY RUN'}`);
  console.log(`[seed:paper-packaging] API Base   : ${apiBase}`);
  console.log(`[seed:paper-packaging] User       : ${user?.email || user?.id || 'unknown'}`);
  console.log(`[seed:paper-packaging] Company    : ${user?.activeCompany || 'none'}`);
  console.log('[seed:paper-packaging] --------------------------------------------------');

  results.forEach((result) => {
    const baseLine = `${result.sku} | ${result.productStatus} | images u:${result.images.uploaded} s:${result.images.skipped} | variants c:${result.variants.created} u:${result.variants.updated} s:${result.variants.skipped}`;
    if (result.error) {
      console.log(`[FAIL] ${baseLine}`);
      console.log(`       ${result.error}`);
    } else {
      console.log(`[OK]   ${baseLine}`);
    }
  });

  const failedCount = results.filter((item) => item.error).length;
  const successCount = results.length - failedCount;
  console.log('[seed:paper-packaging] --------------------------------------------------');
  console.log(`[seed:paper-packaging] Success: ${successCount} | Failed: ${failedCount}`);
};

const run = async () => {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    showUsage();
    return 0;
  }

  const apiBase = normalizeApiBase(args.apiBase);

  console.log('[seed:paper-packaging] Initializing...');
  const email = String(args.email || '').trim() || (await promptVisible('Email'));
  if (!email) {
    throw new Error('Email is required');
  }

  const passwordFromEnv = String(process.env.PAPER_PACKAGING_SEED_PASSWORD || '').trim();
  const password = passwordFromEnv || (await promptHidden('Password'));
  if (!password) {
    throw new Error('Password is required');
  }

  console.log('[seed:paper-packaging] Authenticating...');
  const login = await requestJson({
    apiBase,
    path: '/auth/login',
    method: 'POST',
    body: { email, password }
  });

  const token = login?.token;
  const user = login?.user;
  if (!token) {
    throw new Error('Login succeeded but token was not returned');
  }
  if (!user?.activeCompany) {
    throw new Error(
      'No active company is set for this account. Select an active company in the app and retry.'
    );
  }

  const modeLabel = args.apply ? 'APPLY' : 'DRY RUN';
  console.log(`[seed:paper-packaging] Running in ${modeLabel} mode...`);

  const results = [];
  for (const seedProduct of SEED_PRODUCTS) {
    console.log(`[seed:paper-packaging] Processing ${seedProduct.sku}...`);
    const result = await processSeedProduct({
      apiBase,
      token,
      apply: args.apply,
      seedProduct
    });
    results.push(result);
  }

  printSummary({
    apply: args.apply,
    apiBase,
    user,
    results
  });

  const failedCount = results.filter((item) => item.error).length;
  if (args.apply && failedCount > 0) {
    return 1;
  }
  return 0;
};

run()
  .then((code) => {
    process.exit(code);
  })
  .catch((error) => {
    console.error(`[seed:paper-packaging] Failed: ${formatFailure(error)}`);
    process.exit(1);
  });
