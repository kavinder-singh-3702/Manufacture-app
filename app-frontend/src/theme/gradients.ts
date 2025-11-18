import { palette } from "./colors";

// Linear gradient definitions for mixed color theme
export const gradients = {
  // Primary gradients (Green-based)
  primaryLight: `linear-gradient(135deg, ${palette.green} 0%, ${palette.greenLight} 100%)`,
  primaryDark: `linear-gradient(135deg, ${palette.greenDark} 0%, ${palette.green} 100%)`,

  // Green + Pink blends (signature mixed theme)
  greenToPink: `linear-gradient(135deg, ${palette.green} 0%, ${palette.gradientGreenPink} 50%, ${palette.pink} 100%)`,
  greenToPinkSoft: `linear-gradient(135deg, ${palette.greenSoft} 0%, ${palette.pink} 100%)`,
  greenToPinkLight: `linear-gradient(135deg, ${palette.greenLight} 0%, ${palette.pinkWarm} 100%)`,

  // Burgundy + Pink blends (rich warm tones)
  burgundyToPink: `linear-gradient(135deg, ${palette.burgundy} 0%, ${palette.gradientBurgundyPink} 50%, ${palette.pink} 100%)`,
  burgundyToPinkSoft: `linear-gradient(135deg, ${palette.burgundySoft} 0%, ${palette.pinkBurgundy} 100%)`,
  burgundyRose: `linear-gradient(135deg, ${palette.burgundyRose} 0%, ${palette.pink} 100%)`,

  // Charcoal blends (dark sophisticated)
  charcoalToGreen: `linear-gradient(135deg, ${palette.charcoal} 0%, ${palette.gradientCharcoalGreen} 50%, ${palette.green} 100%)`,
  charcoalToBurgundy: `linear-gradient(135deg, ${palette.charcoal} 0%, ${palette.gradientCharcoalBurgundy} 50%, ${palette.burgundy} 100%)`,
  charcoalMuted: `linear-gradient(135deg, ${palette.charcoalMuted} 0%, ${palette.charcoalLight} 100%)`,

  // Triple blends (all colors mixed)
  brandFull: `linear-gradient(135deg, ${palette.green} 0%, ${palette.pink} 50%, ${palette.burgundy} 100%)`,
  brandSubtle: `linear-gradient(135deg, ${palette.greenSoft} 0%, ${palette.pinkLight} 50%, ${palette.burgundySoft} 100%)`,
  brandDark: `linear-gradient(135deg, ${palette.charcoal} 0%, ${palette.charcoalBurgundy} 50%, ${palette.burgundy} 100%)`,

  // Soft backgrounds (very subtle)
  backgroundSoft: `linear-gradient(180deg, ${palette.pinkLight} 0%, ${palette.warmWhite} 100%)`,
  backgroundMint: `linear-gradient(180deg, ${palette.pinkLight} 0%, ${palette.pinkGreen} 100%)`,
  backgroundWarm: `linear-gradient(180deg, ${palette.warmWhite} 0%, ${palette.pinkWarm} 100%)`,

  // Overlay gradients
  overlayDark: `linear-gradient(180deg, rgba(46, 46, 58, 0.9) 0%, rgba(46, 46, 58, 0.7) 100%)`,
  overlayBurgundy: `linear-gradient(180deg, rgba(59, 31, 43, 0.9) 0%, rgba(59, 31, 43, 0.6) 100%)`,
  overlayPink: `linear-gradient(180deg, rgba(250, 218, 221, 0.95) 0%, rgba(250, 218, 221, 0.8) 100%)`,

  // Radial gradients (for special effects)
  radialGreen: `radial-gradient(circle, ${palette.greenLight} 0%, ${palette.green} 100%)`,
  radialPink: `radial-gradient(circle, ${palette.pinkLight} 0%, ${palette.pink} 100%)`,
  radialBurgundy: `radial-gradient(circle, ${palette.burgundySoft} 0%, ${palette.burgundy} 100%)`,

  // Mesh gradient (complex multi-stop)
  mesh: `linear-gradient(135deg,
    ${palette.green} 0%,
    ${palette.gradientGreenPink} 25%,
    ${palette.pink} 50%,
    ${palette.pinkBurgundy} 75%,
    ${palette.burgundy} 100%)`,
} as const;

// Shadow definitions using mixed colors
export const shadows = {
  // Soft pink-tinted shadows
  sm: `0 1px 2px 0 rgba(250, 218, 221, 0.3)`,
  md: `0 4px 6px -1px rgba(250, 218, 221, 0.4), 0 2px 4px -1px rgba(250, 218, 221, 0.3)`,
  lg: `0 10px 15px -3px rgba(250, 218, 221, 0.5), 0 4px 6px -2px rgba(250, 218, 221, 0.3)`,
  xl: `0 20px 25px -5px rgba(250, 218, 221, 0.5), 0 10px 10px -5px rgba(250, 218, 221, 0.2)`,

  // Charcoal shadows (standard dark)
  smDark: `0 1px 3px 0 rgba(46, 46, 58, 0.15)`,
  mdDark: `0 4px 6px -1px rgba(46, 46, 58, 0.15), 0 2px 4px -1px rgba(46, 46, 58, 0.1)`,
  lgDark: `0 10px 15px -3px rgba(46, 46, 58, 0.15), 0 4px 6px -2px rgba(46, 46, 58, 0.1)`,
  xlDark: `0 20px 25px -5px rgba(46, 46, 58, 0.15), 0 10px 10px -5px rgba(46, 46, 58, 0.05)`,

  // Colored shadows (brand colors)
  green: `0 4px 12px rgba(17, 164, 64, 0.3)`,
  burgundy: `0 4px 12px rgba(59, 31, 43, 0.3)`,
  pink: `0 4px 12px rgba(250, 218, 221, 0.4)`,

  // Mixed color glow
  greenGlow: `0 0 20px rgba(17, 164, 64, 0.4), 0 0 40px rgba(17, 164, 64, 0.2)`,
  pinkGlow: `0 0 20px rgba(250, 218, 221, 0.5), 0 0 40px rgba(250, 218, 221, 0.3)`,
  burgundyGlow: `0 0 20px rgba(59, 31, 43, 0.4), 0 0 40px rgba(59, 31, 43, 0.2)`,
} as const;
