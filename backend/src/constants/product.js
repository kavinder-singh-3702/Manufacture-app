const PRODUCT_STATUSES = Object.freeze(['draft', 'active', 'inactive', 'archived']);
const PRODUCT_VISIBILITY = Object.freeze(['public', 'private']);
const PRODUCT_CATEGORIES = Object.freeze([
  {
    id: 'food-beverage-manufacturing',
    label: 'Food & Beverage Manufacturing',
    subCategories: [
      'Rice mills & flour mills',
      'Sugar mills',
      'Dairy products',
      'Bakery & confectionery',
      'Snacks, namkeen & beverages',
      'Bottled water',
      'Meat & seafood processing'
    ]
  },
  {
    id: 'textile-apparel-manufacturing',
    label: 'Textile & Apparel Manufacturing',
    subCategories: [
      'Cotton, wool & silk textiles',
      'Yarn & fabric manufacturing',
      'Garments & readymade clothes',
      'Denim & hosiery',
      'Home textiles'
    ]
  },
  {
    id: 'paper-packaging-industry',
    label: 'Paper & Packaging Industry',
    subCategories: [
      'Paper mills',
      'Corrugated box manufacturing',
      'Cartons & duplex boxes',
      'Tissue paper & notebooks',
      'Flexible packaging (pouches, films)'
    ]
  },
  {
    id: 'chemical-manufacturing',
    label: 'Chemical Manufacturing',
    subCategories: [
      'Industrial chemicals',
      'Fertilizers & pesticides',
      'Paints & coatings',
      'Dyes & pigments',
      'Adhesives & resins'
    ]
  },
  {
    id: 'pharmaceutical-medical',
    label: 'Pharmaceutical & Medical Manufacturing',
    subCategories: [
      'Medicines & tablets',
      'Syrups & injections',
      'Medical devices',
      'Surgical instruments',
      'PPE kits & masks'
    ]
  },
  {
    id: 'plastic-polymer-industry',
    label: 'Plastic & Polymer Industry',
    subCategories: [
      'Plastic molding products',
      'PET bottles & containers',
      'PVC pipes & fittings',
      'Plastic packaging',
      'Household plastic items'
    ]
  },
  {
    id: 'rubber-industry',
    label: 'Rubber Industry',
    subCategories: ['Tyres & tubes', 'Rubber sheets', 'Seals & gaskets', 'Footwear']
  },
  {
    id: 'metal-steel-industry',
    label: 'Metal & Steel Industry',
    subCategories: [
      'Iron & steel plants',
      'Aluminium & copper products',
      'Casting & forging',
      'Metal fabrication',
      'Sheets, rods & wires'
    ]
  },
  {
    id: 'automobile-auto-components',
    label: 'Automobile & Auto Components',
    subCategories: ['Cars, bikes & tractors', 'Auto parts', 'Batteries', 'Tyres & accessories']
  },
  {
    id: 'electrical-electronics-manufacturing',
    label: 'Electrical & Electronics Manufacturing',
    subCategories: [
      'Wires & cables',
      'Switches, fans & lights',
      'Home appliances',
      'Mobile phones & parts',
      'Solar panels'
    ]
  },
  {
    id: 'machinery-heavy-engineering',
    label: 'Machinery & Heavy Engineering',
    subCategories: ['Industrial machines', 'Agricultural equipment', 'Construction machinery', 'Machine tools']
  },
  {
    id: 'wood-furniture-industry',
    label: 'Wood & Furniture Industry',
    subCategories: ['Furniture', 'Plywood & MDF boards', 'Doors & windows', 'Wooden packaging']
  },
  {
    id: 'construction-material-industry',
    label: 'Construction Material Industry',
    subCategories: ['Cement', 'Bricks & tiles', 'Glass & ceramics', 'Sanitaryware']
  },
  {
    id: 'leather-industry',
    label: 'Leather Industry',
    subCategories: ['Leather processing', 'Shoes & footwear', 'Bags, belts & wallets']
  },
  {
    id: 'petroleum-energy-manufacturing',
    label: 'Petroleum & Energy-Based Manufacturing',
    subCategories: ['Oil refining', 'Lubricants', 'Petrochemicals', 'Biofuels']
  },
  {
    id: 'defence-aerospace-manufacturing',
    label: 'Defence & Aerospace Manufacturing',
    subCategories: ['Aircraft components', 'Missiles & weapons', 'Defence electronics', 'Space equipment']
  },
  {
    id: 'consumer-goods-fmcg',
    label: 'Consumer Goods (FMCG) Manufacturing',
    subCategories: ['Soaps & detergents', 'Cosmetics & personal care', 'Home cleaning products', 'Stationery']
  },
  {
    id: 'printing-publishing',
    label: 'Printing & Publishing',
    subCategories: ['Books & newspapers', 'Labels & stickers', 'Packaging printing']
  },
  {
    id: 'toys-sports-goods',
    label: 'Toys & Sports Goods Manufacturing',
    subCategories: ['Toys', 'Sports equipment', 'Fitness items']
  },
  {
    id: 'handicrafts-cottage-industries',
    label: 'Handicrafts & Cottage Industries',
    subCategories: ['Handloom', 'Pottery', 'Hand-made items', 'Decorative products']
  },
  // Legacy buckets retained for compatibility
  { id: 'finished-goods', label: 'Finished Goods' },
  { id: 'components', label: 'Components & Parts' },
  { id: 'raw-materials', label: 'Raw Materials' },
  { id: 'machinery', label: 'Machinery & Equipment' },
  { id: 'packaging', label: 'Packaging' },
  { id: 'services', label: 'Services' },
  { id: 'other', label: 'Other' }
]);
const DISCOUNT_TYPES = Object.freeze(['percentage', 'flat']);
const DEFAULT_CURRENCY = 'INR';

module.exports = {
  PRODUCT_STATUSES,
  PRODUCT_VISIBILITY,
  PRODUCT_CATEGORIES,
  DISCOUNT_TYPES,
  DEFAULT_CURRENCY
};
