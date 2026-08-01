const { BUSINESS_CATEGORIES } = require('../../../constants/business');

const CATEGORY_SET = new Set(BUSINESS_CATEGORIES);

const normalizeCategories = (categories = []) => {
  const list = Array.isArray(categories) ? categories : [];
  const normalized = list
    .map((value) => (typeof value === 'string' ? value.trim().toLowerCase() : ''))
    .filter(Boolean);
  const unique = [...new Set(normalized)];
  return unique.filter((category) => CATEGORY_SET.has(category));
};

const buildCompanyResponse = (company) => {
  if (!company) return null;
  const normalize = (value) => {
    if (!value) return null;
    const plain = typeof value.toObject === 'function' ? value.toObject({ versionKey: false }) : value;
    if (!plain) return null;
    const { __v, _id, ...rest } = plain;
    return { ...rest, id: plain.id || (_id ? _id.toString() : undefined) };
  };
  return normalize(company);
};

const stripAddress = (address) => {
  if (!address) return undefined;
  const { city, state, country } = address;
  if (!city && !state && !country) return undefined;
  return { city, state, country };
};

const stripContact = (contact) => {
  if (!contact) return undefined;
  const { email, phone, website, supportEmail, supportPhone } = contact;
  if (!email && !phone && !website && !supportEmail && !supportPhone) return undefined;
  return { email, phone, website, supportEmail, supportPhone };
};

// Field-whitelisted shape for the unauthenticated public seller profile page
// (arvann.in/sellers/:id). This is deliberately NOT buildCompanyResponse
// filtered down — it's built up field-by-field so a future addition to the
// Company schema (e.g. a new compliance field) is private by default instead
// of silently becoming public.
//
// `contact` (phone/email/website) is included on purpose: it's the
// business's own listed sales contact, not personal owner PII, and the
// frontend's RevealPhoneButton / email-link / website-link UI on this exact
// page already assumes it's there (the sign-in gate in that UI is a
// conversion prompt, not access control — this is just the first time the
// data actually reaches that UI instead of 401ing before it arrives).
// Never included: documents (gstNumber/panNumber/cinNumber/attachments),
// owner/createdBy/updatedBy, metadata, settings, archivedReason.
const buildPublicCompanyResponse = (company) => {
  if (!company) return null;
  const plain = typeof company.toObject === 'function' ? company.toObject({ versionKey: false }) : company;
  return {
    id: plain.id || plain._id?.toString(),
    displayName: plain.displayName,
    legalName: plain.legalName,
    description: plain.description,
    logoUrl: plain.logoUrl,
    coverImageUrl: plain.coverImageUrl,
    categories: plain.categories,
    sizeBucket: plain.sizeBucket,
    foundedAt: plain.foundedAt,
    complianceStatus: plain.complianceStatus,
    type: plain.type,
    contact: stripContact(plain.contact),
    headquarters: stripAddress(plain.headquarters),
    locations: Array.isArray(plain.locations)
      ? plain.locations.map(stripAddress).filter(Boolean)
      : undefined
  };
};

module.exports = {
  normalizeCategories,
  buildCompanyResponse,
  buildPublicCompanyResponse
};
