import { ThemeGradientKey } from "../../../theme";
import { CampaignThemeKey } from "../../../services/preference.service";

export type ResolvedCampaignThemeKey = "campaignFocus" | "campaignWarmEmber" | "campaignCyan";

const THEME_ALIASES: Record<string, ResolvedCampaignThemeKey> = {
  default: "campaignFocus",
  premium: "campaignFocus",
  campaignfocus: "campaignFocus",
  warm: "campaignWarmEmber",
  campaignwarmember: "campaignWarmEmber",
  ember: "campaignWarmEmber",
  emerald: "campaignCyan",
  campaigncyan: "campaignCyan",
  cyan: "campaignCyan",
};

export const CAMPAIGN_THEME_OPTIONS: Array<{
  key: ResolvedCampaignThemeKey;
  label: string;
  description: string;
  gradientKey: ThemeGradientKey;
}> = [
  {
    key: "campaignFocus",
    label: "Focus",
    description: "Balanced cyan-coral spotlight",
    gradientKey: "campaignFocus",
  },
  {
    key: "campaignWarmEmber",
    label: "Warm Ember",
    description: "Red-orange urgency emphasis",
    gradientKey: "campaignWarmEmber",
  },
  {
    key: "campaignCyan",
    label: "Cyan",
    description: "Cool cyan professional tone",
    gradientKey: "campaignCyan",
  },
];

export const normalizeCampaignThemeKey = (themeKey?: CampaignThemeKey): ResolvedCampaignThemeKey => {
  const raw = `${themeKey || ""}`.trim().toLowerCase();
  if (!raw) return "campaignFocus";
  return THEME_ALIASES[raw] || "campaignFocus";
};

export const resolveCampaignGradientKey = (themeKey?: CampaignThemeKey): ThemeGradientKey => {
  const resolved = normalizeCampaignThemeKey(themeKey);
  switch (resolved) {
    case "campaignWarmEmber":
      return "campaignWarmEmber";
    case "campaignCyan":
      return "campaignCyan";
    case "campaignFocus":
    default:
      return "campaignFocus";
  }
};

export type NativeGradientStops = readonly [string, string, ...string[]];
type NativeGradientMap = Record<ThemeGradientKey, NativeGradientStops>;

export const resolveCampaignGradient = (nativeGradients: NativeGradientMap, themeKey?: CampaignThemeKey) => {
  const gradientKey = resolveCampaignGradientKey(themeKey);
  return nativeGradients[gradientKey];
};

export const getCampaignThemeLabel = (themeKey?: CampaignThemeKey): string => {
  const normalized = normalizeCampaignThemeKey(themeKey);
  const match = CAMPAIGN_THEME_OPTIONS.find((option) => option.key === normalized);
  return match?.label || "Focus";
};
