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

const SKIP_FILES = new Set([
  path.join(PROJECT_ROOT, "src", "utils", "responsive.ts"),
  path.join(PROJECT_ROOT, "src", "screens", "StatsScreenDebug.tsx"),
  path.join(PROJECT_ROOT, "src", "screens", "StatsScreenExactAPI.tsx"),
]);

const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);

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

const files = TARGET_ROOTS.flatMap(collectFiles).filter((file) => !SKIP_FILES.has(file));

const findings = {
  dimensions: [],
  largeWidth: [],
  riskyRows: [],
  tailEllipsis: [],
  rawSingleLineText: [],
  categoryHardMaxWidth: [],
  rawTwoLineText: [],
  profileInventoryFixedWidth: [],
  profileInventoryTailEllipsis: [],
  profileInventoryRiskyRows: [],
};

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split(/\r?\n/);
  const isAdaptiveSingleLineText = file.endsWith(path.join("components", "text", "AdaptiveSingleLineText.tsx"));
  const isAdaptiveTwoLineText = file.endsWith(path.join("components", "text", "AdaptiveTwoLineText.tsx"));
  const normalizedFile = file.replace(/\\/g, "/");
  const isCategoryScopeFile =
    normalizedFile.endsWith("/src/screens/DashboardScreen.tsx") ||
    normalizedFile.endsWith("/src/screens/inventory/CategoryProductsScreen.tsx") ||
    normalizedFile.endsWith("/src/screens/inventory/ProductSearchScreen.tsx");
  const isProfileInventoryScopeFile =
    normalizedFile.includes("/src/screens/company/") ||
    normalizedFile.endsWith("/src/screens/StatsScreen.tsx");

  lines.forEach((line, index) => {
    const lineNo = index + 1;

    if (/Dimensions\.get\(\s*["']window["']\s*\)/.test(line)) {
      findings.dimensions.push({ file, line: lineNo, code: line.trim() });
    }

    if (/ellipsizeMode\s*=\s*["']tail["']/.test(line)) {
      findings.tailEllipsis.push({ file, line: lineNo, code: line.trim() });
      if (isProfileInventoryScopeFile) {
        findings.profileInventoryTailEllipsis.push({ file, line: lineNo, code: line.trim() });
      }
    }

    if (isCategoryScopeFile && /\bmaxWidth\s*:\s*(\d+|scale\(.+\))/.test(line)) {
      findings.categoryHardMaxWidth.push({ file, line: lineNo, code: line.trim() });
    }

    if (!isAdaptiveSingleLineText && /numberOfLines\s*=\s*\{1\}/.test(line)) {
      const context = lines.slice(Math.max(0, index - 2), index + 2).join("\n");
      const isNativeText = /<Text[\s>]/.test(context);
      const isAdaptive = /<AdaptiveSingleLineText[\s>]/.test(context);
      const hasNoTruncationProps =
        /ellipsizeMode\s*=\s*["']clip["']/.test(context) &&
        /adjustsFontSizeToFit/.test(context) &&
        /minimumFontScale\s*=\s*\{[0-9.]+\}/.test(context);
      if (isNativeText && !isAdaptive && !hasNoTruncationProps) {
        findings.rawSingleLineText.push({ file, line: lineNo, code: line.trim() });
      }
    }

    if (isCategoryScopeFile && !isAdaptiveTwoLineText && /numberOfLines\s*=\s*\{2\}/.test(line)) {
      const context = lines.slice(Math.max(0, index - 2), index + 2).join("\n");
      const isNativeText = /<Text[\s>]/.test(context);
      const isAdaptive = /<AdaptiveTwoLineText[\s>]/.test(context);
      const hasNoTruncationProps =
        /ellipsizeMode\s*=\s*["']clip["']/.test(context) &&
        /adjustsFontSizeToFit/.test(context) &&
        /minimumFontScale\s*=\s*\{[0-9.]+\}/.test(context);
      if (isNativeText && !isAdaptive && !hasNoTruncationProps) {
        findings.rawTwoLineText.push({ file, line: lineNo, code: line.trim() });
      }
    }

    const widthMatch = line.match(/\bwidth\s*:\s*(\d{3,})\b/);
    if (widthMatch) {
      const width = Number(widthMatch[1]);
      if (width >= 280) {
        findings.largeWidth.push({ file, line: lineNo, code: line.trim() });
      }
    }

    if (isProfileInventoryScopeFile) {
      const profileWidthMatch = line.match(/\bwidth\s*:\s*(\d{2,3})\b/);
      if (profileWidthMatch) {
        const width = Number(profileWidthMatch[1]);
        if (width >= 80) {
          findings.profileInventoryFixedWidth.push({ file, line: lineNo, code: line.trim() });
        }
      }
    }

    if (/flexDirection\s*:\s*["']row["']/.test(line)) {
      const nearby = lines.slice(index, index + 12).join("\n");
      const hasSpaceBetween = /justifyContent\s*:\s*["']space-between["']/.test(nearby);
      const hasWrap = /flexWrap\s*:\s*["']wrap["']/.test(nearby);
      const hasShrink = /flexShrink\s*:\s*1/.test(nearby) || /minWidth\s*:\s*0/.test(nearby);
      if (hasSpaceBetween && !hasWrap && !hasShrink) {
        findings.riskyRows.push({ file, line: lineNo, code: line.trim() });
        if (isProfileInventoryScopeFile) {
          findings.profileInventoryRiskyRows.push({ file, line: lineNo, code: line.trim() });
        }
      }
    }
  });
}

const printSection = (title, records, limit = 120) => {
  if (!records.length) return;
  console.log(`\n${title} (${records.length})`);
  records.slice(0, limit).forEach((record) => {
    const rel = path.relative(PROJECT_ROOT, record.file);
    console.log(`- ${rel}:${record.line} -> ${record.code}`);
  });
  if (records.length > limit) {
    console.log(`- ... ${records.length - limit} more`);
  }
};

const criticalCount = findings.dimensions.length;

if (
  criticalCount === 0 &&
  findings.riskyRows.length === 0 &&
  findings.largeWidth.length === 0 &&
  findings.tailEllipsis.length === 0 &&
  findings.rawSingleLineText.length === 0 &&
  findings.categoryHardMaxWidth.length === 0 &&
  findings.rawTwoLineText.length === 0
) {
  console.log("Responsive audit passed: no findings.");
  process.exit(0);
}

printSection("Critical: module-level Dimensions.get(window)", findings.dimensions);
printSection("Warning: fixed width usage (>=280)", findings.largeWidth);
printSection("Warning: row layout blocks without wrap/minWidth safeguards", findings.riskyRows, 80);
printSection("Warning: ellipsizeMode tail usage", findings.tailEllipsis, 80);
printSection("Warning: raw Text with numberOfLines={1}", findings.rawSingleLineText, 80);
printSection("Warning: category scope hard maxWidth usage", findings.categoryHardMaxWidth, 80);
printSection("Warning: category scope raw Text with numberOfLines={2}", findings.rawTwoLineText, 80);
printSection("Warning: profile/inventory fixed width usage", findings.profileInventoryFixedWidth, 80);
printSection("Warning: profile/inventory risky row blocks", findings.profileInventoryRiskyRows, 80);
printSection("Warning: profile/inventory ellipsize tail usage", findings.profileInventoryTailEllipsis, 80);

if (criticalCount > 0) {
  console.error(`\nResponsive audit failed with ${criticalCount} critical finding(s).`);
  process.exit(1);
}

console.warn(
  `\nResponsive audit passed with ${
    findings.largeWidth.length +
    findings.riskyRows.length +
    findings.tailEllipsis.length +
    findings.rawSingleLineText.length +
    findings.categoryHardMaxWidth.length +
    findings.rawTwoLineText.length +
    findings.profileInventoryFixedWidth.length +
    findings.profileInventoryRiskyRows.length +
    findings.profileInventoryTailEllipsis.length
  } warning(s).`
);
process.exit(0);
