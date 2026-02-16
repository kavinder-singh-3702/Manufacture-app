#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const TARGET_ROOTS = [
  path.join(PROJECT_ROOT, "src", "screens"),
  path.join(PROJECT_ROOT, "src", "components"),
  path.join(PROJECT_ROOT, "src", "navigation"),
];

const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);

const STRICT_FILES = new Set([
  "src/components/common/Button.tsx",
  "src/components/common/InputField.tsx",
  "src/components/common/Card.tsx",
  "src/components/ui/Toast.tsx",
  "src/components/ui/AnimatedButton.tsx",
  "src/components/ui/AnimatedCard.tsx",
  "src/navigation/routes.ts",
  "src/navigation/MainTabs.tsx",
  "src/navigation/components/MainTabs/components/navigation.tokens.ts",
  "src/navigation/components/MainTabs/components/HomeToolbar.tsx",
  "src/navigation/components/MainTabs/components/FooterRail.tsx",
  "src/navigation/components/MainTabs/components/ProfileAvatar.tsx",
  "src/components/navigation/SidebarMenu.tsx",
  "src/screens/DashboardScreen.tsx",
  "src/screens/dashboard/components/CampaignSlide.tsx",
  "src/screens/dashboard/components/RecommendedProductsRail.tsx",
  "src/screens/admin/CampaignStudioScreen.tsx",
  "src/screens/admin/UserPreferenceScreen.tsx",
]);

const SKIP_PREFIXES = [
  "src/theme/",
  "src/constants/",
];

const COLOR_REGEX = /#[0-9A-Fa-f]{3,8}|rgba?\([^\)]*\)/g;

const collectFiles = (dir) => {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(full));
      continue;
    }
    if (EXTENSIONS.has(path.extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
};

const files = TARGET_ROOTS.flatMap(collectFiles);

const strictFindings = [];
const generalFindings = [];

for (const file of files) {
  const rel = path.relative(PROJECT_ROOT, file).replace(/\\/g, "/");
  if (SKIP_PREFIXES.some((prefix) => rel.startsWith(prefix))) continue;

  const content = fs.readFileSync(file, "utf8");
  const lines = content.split(/\r?\n/);

  lines.forEach((line, index) => {
    COLOR_REGEX.lastIndex = 0;
    if (!COLOR_REGEX.test(line)) return;
    COLOR_REGEX.lastIndex = 0;

    const record = {
      file: rel,
      line: index + 1,
      code: line.trim(),
    };

    if (STRICT_FILES.has(rel)) {
      strictFindings.push(record);
    } else {
      generalFindings.push(record);
    }
  });
}

const printSection = (title, records, limit = 80) => {
  if (!records.length) return;
  console.log(`\n${title} (${records.length})`);
  records.slice(0, limit).forEach((record) => {
    console.log(`- ${record.file}:${record.line} -> ${record.code}`);
  });
  if (records.length > limit) {
    console.log(`- ... ${records.length - limit} more`);
  }
};

if (strictFindings.length === 0) {
  console.log("Theme token audit passed for strict migrated scope.");
  if (generalFindings.length) {
    console.warn(`Theme token audit note: ${generalFindings.length} literal color usages remain outside strict scope.`);
  }
  process.exit(0);
}

printSection("Theme token audit failures in strict migrated scope", strictFindings, 120);
console.error(`\nTheme token audit failed with ${strictFindings.length} strict finding(s).`);
process.exit(1);
