import * as React from "react";

import NativeGlassView from "./NativeGlassView";
import type { GlassViewProps } from "./GlassView.types";

/**
 * Native glass surface. On iOS 26+ uses real `UIGlassEffect` (Liquid Glass);
 * on iOS 15.1-25 falls back to `UIVisualEffectView` with `.systemUltraThinMaterial`.
 * On Android 12+ (API 31) uses `RenderEffect.createBlurEffect`; on older Android
 * uses a translucent surface so the layout still looks intentional.
 *
 * Children render INSIDE the glass surface (RN handles child mounting; iOS native
 * code attaches them to the visual effect view's `contentView` so they remain visible).
 */
export function GlassView({
  tint = "system",
  intensity = 70,
  cornerRadius = 16,
  borderColor = "rgba(255,255,255,0.35)",
  style,
  children,
  ...rest
}: GlassViewProps) {
  return (
    <NativeGlassView
      tint={tint}
      intensity={intensity}
      cornerRadius={cornerRadius}
      borderColor={borderColor}
      style={style}
      {...rest}
    >
      {children}
    </NativeGlassView>
  );
}
