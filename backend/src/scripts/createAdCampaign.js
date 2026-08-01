/**
 * One-off: create (and activate) a single "Everyone" ad campaign promoting
 * an existing product, with an image or video creative — either a local
 * file uploaded to S3, or a direct hosted URL used as-is (no upload).
 *
 * "Everyone" targeting is not a stored value — it's simply an empty
 * `targeting` object (see ad.service.js matchTargeting: no conditions =>
 * always eligible), so this script never sets `targeting` at all.
 *
 * Usage (upload a local file):
 *   node src/scripts/createAdCampaign.js \
 *     --product <productId> --name "Campaign name" --media image \
 *     --file /tmp/ad-photo.png \
 *     [--placements hero_banner,dashboard_home] [--title] [--subtitle] [--cta]
 *
 * Usage (use an already-hosted URL, e.g. for video — skips upload entirely):
 *   node src/scripts/createAdCampaign.js \
 *     --product <productId> --name "Campaign name" --media video \
 *     --url https://example.com/clip.mp4 \
 *     [--placements ...] [--title] [--subtitle] [--cta]
 *
 *   --media must be "image" or "video". Exactly one of --file / --url is required.
 */

const fs = require('fs');
const path = require('path');
const config = require('../config/env');
const { connectDatabase, disconnectDatabase } = require('../config/database');
const User = require('../models/user.model');
// Side-effect requires: createCampaign populates refs (e.g. product.company)
// that only resolve if their schemas have been registered somewhere in this
// process. The real server registers every model via app.js's route
// requires; this standalone script has to do it explicitly.
require('../models/company.model');
require('../models/product.model');
const { createCampaign } = require('../modules/ads/services/ad.service');

const parseArgs = (argv) => {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const value = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : true;
      args[key] = value;
      if (value !== true) i += 1;
    }
  }
  return args;
};

const run = async () => {
  const args = parseArgs(process.argv.slice(2));

  if (!args.product || !args.name || !args.media || (!args.file && !args.url)) {
    console.error('Usage: node src/scripts/createAdCampaign.js --product <id> --name "..." --media image|video (--file <path> | --url <hosted-url>) [--placements a,b] [--title] [--subtitle] [--cta]');
    process.exit(1);
  }

  if (args.file && args.url) {
    console.error('Pass either --file or --url, not both.');
    process.exit(1);
  }

  if (!['image', 'video'].includes(args.media)) {
    console.error(`--media must be "image" or "video", got "${args.media}"`);
    process.exit(1);
  }

  let base64 = null;
  let mimeType = null;

  if (args.file) {
    const filePath = path.resolve(args.file);
    if (!fs.existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      process.exit(1);
    }

    const fileBuffer = fs.readFileSync(filePath);
    base64 = fileBuffer.toString('base64');

    // Matches the allowed-type lists in storage.service.js (uploadAdBanner) —
    // no point guessing a type it would reject anyway.
    const MIME_BY_EXT = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4'
    };
    const ext = path.extname(filePath).toLowerCase();
    mimeType = MIME_BY_EXT[ext];
    if (!mimeType) {
      console.error(`Unsupported file extension "${ext}". Allowed: ${Object.keys(MIME_BY_EXT).join(', ')}`);
      process.exit(1);
    }
  }

  const placements = args.placements
    ? String(args.placements).split(',').map((p) => p.trim()).filter(Boolean)
    : ['hero_banner', 'dashboard_home'];

  await connectDatabase(config.mongoUri);

  const admin = await User.findOne({ role: { $in: ['admin', 'super-admin'] } })
    .sort({ createdAt: 1 })
    .select('_id')
    .lean();

  if (!admin) {
    console.error('No admin user found to attribute this campaign to.');
    await disconnectDatabase();
    process.exit(1);
  }

  const creative = {
    title: args.title,
    subtitle: args.subtitle,
    ctaLabel: args.cta || 'View Product'
  };

  if (args.url) {
    // Direct hosted URL — normalizeCreative() stores this as-is and
    // processBannerMedia() only overrides when base64 is present, so no
    // upload happens here.
    creative.bannerMediaType = args.media;
    if (args.media === 'image') {
      creative.bannerImageUrl = args.url;
    } else {
      creative.bannerVideoUrl = args.url;
    }
  } else if (args.media === 'image') {
    creative.bannerImageBase64 = base64;
    creative.bannerMimeType = mimeType;
  } else {
    creative.bannerVideoBase64 = base64;
    creative.bannerMimeType = mimeType;
  }

  const campaign = await createCampaign({
    actorId: admin._id,
    payload: {
      name: args.name,
      productId: args.product,
      status: 'active',
      placements,
      creative
      // targeting intentionally omitted => shown to everyone
    }
  });

  console.log(JSON.stringify({
    id: campaign.id || campaign._id,
    name: campaign.name,
    status: campaign.status,
    placements: campaign.placements,
    mediaType: campaign.creative?.bannerMediaType,
    imageUrl: campaign.creative?.bannerImageUrl,
    videoUrl: campaign.creative?.bannerVideoUrl
  }, null, 2));

  await disconnectDatabase();
};

run().catch(async (err) => {
  console.error('[create-ad-campaign] FAILED:', err?.message || err);
  process.exit(1);
});
