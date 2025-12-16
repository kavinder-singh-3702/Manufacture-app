import Svg, { Defs, LinearGradient, Stop, Path, Circle } from "react-native-svg";

type BrandMarkProps = {
  size?: number;
};

/**
 * BrandMark - Geometric "M" logomark with layered gradients.
 *
 * This is reusable so we can drop the brand in other parts of the app without
 * re-creating the artwork.
 */
export const BrandMark = ({ size = 180 }: BrandMarkProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <LinearGradient id="bgGlow" x1="30%" y1="0%" x2="70%" y2="100%">
          <Stop offset="0%" stopColor="#6C63FF" stopOpacity="0.18" />
          <Stop offset="100%" stopColor="#FF8C3C" stopOpacity="0.08" />
        </LinearGradient>
        <LinearGradient id="primary" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#8B84FF" />
          <Stop offset="100%" stopColor="#5248E6" />
        </LinearGradient>
        <LinearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#FFB07A" />
          <Stop offset="100%" stopColor="#FF8C3C" />
        </LinearGradient>
        <LinearGradient id="shine" x1="0%" y1="30%" x2="100%" y2="70%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.2" />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </LinearGradient>
      </Defs>

      {/* Soft glow behind the mark */}
      <Circle cx="100" cy="100" r="94" fill="url(#bgGlow)" opacity={0.55} />

      {/* Primary "M" silhouette */}
      <Path
        d="M38 168V36L82 134L100 70L118 134L162 36V168H130V108L118 148L100 88L82 148L70 108V168H38Z"
        fill="url(#primary)"
      />

      {/* Accent overlay for depth */}
      <Path
        d="M50 156V62L86 140L100 94L114 140L150 62V156H130V112L114 154L100 110L86 154L70 112V156H50Z"
        fill="url(#accent)"
        opacity={0.9}
      />

      {/* Highlight ribbon */}
      <Path
        d="M50 90L70 132L86 90L100 126L114 90L130 132L150 90"
        fill="url(#shine)"
        opacity={0.75}
      />

      {/* Crisp outline */}
      <Path
        d="M38 168V36L82 134L100 70L118 134L162 36V168H130V108L118 148L100 88L82 148L70 108V168H38Z"
        fill="none"
        stroke="#0B0B0F"
        strokeWidth={3}
        opacity={0.5}
      />
    </Svg>
  );
};
