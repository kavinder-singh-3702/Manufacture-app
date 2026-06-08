import { requireNativeViewManager } from "expo-modules-core";

import type { GlassViewProps } from "./GlassView.types";

export default requireNativeViewManager<GlassViewProps>("ExpoGlassView");
