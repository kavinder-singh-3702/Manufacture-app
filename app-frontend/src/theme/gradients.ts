import { palette } from "./colors";

// Linear gradient definitions - Luxury Indigo & Muted Salmon Theme
export const gradients = {
  // Primary gradients (Royal Indigo)
  primaryLight: `linear-gradient(135deg, ${palette.royalIndigo} 0%, ${palette.greenLight} 100%)`,
  primaryDark: `linear-gradient(135deg, ${palette.greenDark} 0%, ${palette.royalIndigo} 100%)`,

  // Indigo + Salmon blends (signature luxury theme)
  greenToPink: `linear-gradient(135deg, ${palette.royalIndigo} 0%, ${palette.mutedSalmon} 100%)`,
  greenToPinkSoft: `linear-gradient(135deg, ${palette.greenSoft} 0%, ${palette.peachLight} 100%)`,
  greenToPinkLight: `linear-gradient(135deg, ${palette.greenLight} 0%, ${palette.peachWarm} 100%)`,

  // Indigo + Salmon luxury blends
  burgundyToPink: `linear-gradient(135deg, ${palette.royalIndigo} 0%, ${palette.mutedSalmon} 100%)`,
  burgundyToPinkSoft: `linear-gradient(135deg, ${palette.greenSoft} 0%, ${palette.mutedSalmon} 100%)`,
  burgundyRose: `linear-gradient(135deg, ${palette.greenLight} 0%, ${palette.mutedSalmon} 100%)`,

  // Dark surface blends (luxury sophisticated)
  charcoalToGreen: `linear-gradient(135deg, ${palette.richBackground} 0%, ${palette.elevatedSurface} 50%, ${palette.royalIndigo} 100%)`,
  charcoalToBurgundy: `linear-gradient(135deg, ${palette.richBackground} 0%, ${palette.elevatedSurface} 50%, ${palette.mutedSalmon} 100%)`,
  charcoalMuted: `linear-gradient(135deg, ${palette.charcoalMuted} 0%, ${palette.charcoalLight} 100%)`,

  // Brand blends (Indigo + Salmon + Aqua)
  brandFull: `linear-gradient(135deg, ${palette.royalIndigo} 0%, ${palette.mutedSalmon} 50%, ${palette.aquaBlue} 100%)`,
  brandSubtle: `linear-gradient(135deg, ${palette.greenSoft} 0%, ${palette.peachLight} 50%, ${palette.infoSoft} 100%)`,
  brandDark: `linear-gradient(135deg, ${palette.richBackground} 0%, ${palette.elevatedSurface} 50%, ${palette.royalIndigo} 100%)`,

  // Dark backgrounds (luxury dark theme)
  backgroundSoft: `linear-gradient(180deg, ${palette.elevatedSurface} 0%, ${palette.richBackground} 100%)`,
  backgroundMint: `linear-gradient(180deg, ${palette.elevatedSurface} 0%, ${palette.charcoalMuted} 100%)`,
  backgroundWarm: `linear-gradient(180deg, ${palette.richBackground} 0%, ${palette.elevatedSurface} 100%)`,

  // Overlay gradients (luxury dark)
  overlayDark: `linear-gradient(180deg, rgba(15, 17, 21, 0.95) 0%, rgba(15, 17, 21, 0.8) 100%)`,
  overlayBurgundy: `linear-gradient(180deg, rgba(108, 99, 255, 0.15) 0%, rgba(108, 99, 255, 0.05) 100%)`,
  overlaySalmon: `linear-gradient(180deg, rgba(255, 140, 60, 0.15) 0%, rgba(255, 140, 60, 0.05) 100%)`,
  overlayPink: `linear-gradient(180deg, rgba(255, 140, 60, 0.15) 0%, rgba(255, 140, 60, 0.05) 100%)`,

  // Radial gradients (for special effects)
  radialGreen: `radial-gradient(circle, ${palette.greenLight} 0%, ${palette.royalIndigo} 100%)`,
  radialPink: `radial-gradient(circle, ${palette.peachLight} 0%, ${palette.mutedSalmon} 100%)`,
  radialBurgundy: `radial-gradient(circle, ${palette.greenSoft} 0%, ${palette.royalIndigo} 100%)`,

  // Mesh gradient (complex multi-stop luxury)
  mesh: `linear-gradient(135deg,
    ${palette.royalIndigo} 0%,
    ${palette.greenLight} 25%,
    ${palette.mutedSalmon} 50%,
    ${palette.peachWarm} 75%,
    ${palette.aquaBlue} 100%)`,
} as const;

// Shadow definitions - Luxury Indigo & Muted Salmon Theme
export const shadows = {
  // Soft dark shadows
  sm: `0 1px 2px 0 rgba(0, 0, 0, 0.4)`,
  md: `0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.4)`,
  lg: `0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)`,
  xl: `0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.25)`,

  // Deep dark shadows
  smDark: `0 1px 3px 0 rgba(0, 0, 0, 0.5)`,
  mdDark: `0 4px 6px -1px rgba(0, 0, 0, 0.6), 0 2px 4px -1px rgba(0, 0, 0, 0.5)`,
  lgDark: `0 10px 15px -3px rgba(0, 0, 0, 0.6), 0 4px 6px -2px rgba(0, 0, 0, 0.4)`,
  xlDark: `0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.3)`,

  // Colored shadows (brand colors)
  green: `0 4px 12px rgba(108, 99, 255, 0.4)`,
  burgundy: `0 4px 12px rgba(108, 99, 255, 0.3)`,
  pink: `0 4px 12px rgba(255, 140, 60, 0.4)`,
  salmon: `0 4px 12px rgba(255, 140, 60, 0.4)`,

  // Luxury color glows
  greenGlow: `0 0 20px rgba(108, 99, 255, 0.5), 0 0 40px rgba(108, 99, 255, 0.25)`,
  pinkGlow: `0 0 20px rgba(255, 140, 60, 0.5), 0 0 40px rgba(255, 140, 60, 0.25)`,
  salmonGlow: `0 0 20px rgba(255, 140, 60, 0.5), 0 0 40px rgba(255, 140, 60, 0.25)`,
  burgundyGlow: `0 0 20px rgba(108, 99, 255, 0.4), 0 0 40px rgba(108, 99, 255, 0.2)`,
} as const;
