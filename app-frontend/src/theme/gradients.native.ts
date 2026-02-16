const darkNativeGradients = {
  canvasSubtle: ["#05070C", "#0B0F14", "#121923"] as [string, string, string],
  heroCyan: ["#0E2230", "#148DB2", "#4CCEEF"] as [string, string, string],
  heroCoral: ["#30131A", "#D5616D", "#FF8E98"] as [string, string, string],
  ctaPrimary: ["#19B8E6", "#4CCEEF"] as [string, string],
  accentDiagonal: ["#F56E79", "#19B8E6"] as [string, string],
  statusInfo: ["rgba(25,184,230,0.22)", "rgba(76,206,239,0.12)"] as [string, string],
  campaignCyan: ["#132633", "#148DB2", "#4CCEEF"] as [string, string, string],
  campaignWarmEmber: ["#341B21", "#F56E79", "#F57E52"] as [string, string, string],
  campaignFocus: ["#122738", "#19B8E6", "#F56E79"] as [string, string, string],
  recommendationShell: ["#121923", "#1B2432"] as [string, string],
  recommendationAccent: ["#19B8E6", "#F57E52"] as [string, string],
} as const;

const lightNativeGradients = {
  canvasSubtle: ["#F4F8FC", "#EDF4FB", "#E8F0F9"] as [string, string, string],
  heroCyan: ["#EAF8FC", "#CFEFFA", "#A7E3F6"] as [string, string, string],
  heroCoral: ["#FFF1F3", "#FFDDE1", "#FFC8CF"] as [string, string, string],
  ctaPrimary: ["#148DB2", "#2BAED6"] as [string, string],
  accentDiagonal: ["#D5616D", "#148DB2"] as [string, string],
  statusInfo: ["rgba(20,141,178,0.18)", "rgba(43,174,214,0.10)"] as [string, string],
  campaignCyan: ["#EAF7FC", "#CFEFFA", "#A8E4F7"] as [string, string, string],
  campaignWarmEmber: ["#FFF2EE", "#FFD7CC", "#FFBC9F"] as [string, string, string],
  campaignFocus: ["#EAF5FB", "#C8EAF6", "#FFD2D8"] as [string, string, string],
  recommendationShell: ["#FFFFFF", "#F2F8FD"] as [string, string],
  recommendationAccent: ["#148DB2", "#E46A42"] as [string, string],
} as const;

export type ThemeGradientKey = keyof typeof darkNativeGradients;

export const nativeGradients = {
  dark: darkNativeGradients,
  light: lightNativeGradients,
} as const;

type NativeGradientMode = "light" | "dark";

export const getNativeGradients = (resolvedMode: NativeGradientMode) => nativeGradients[resolvedMode];
