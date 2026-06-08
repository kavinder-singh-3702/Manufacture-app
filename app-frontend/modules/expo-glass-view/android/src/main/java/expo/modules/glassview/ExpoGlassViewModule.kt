package expo.modules.glassview

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoGlassViewModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoGlassView")

    View(GlassView::class) {
      Prop("tint") { view: GlassView, value: String? ->
        view.applyTint(value ?: "system")
      }
      Prop("intensity") { view: GlassView, value: Double? ->
        view.applyIntensity((value ?: 70.0).toFloat())
      }
      Prop("cornerRadius") { view: GlassView, value: Double? ->
        view.applyCornerRadius((value ?: 16.0).toFloat())
      }
      Prop("borderColor") { view: GlassView, value: String? ->
        view.applyBorderColor(value ?: "rgba(255,255,255,0.35)")
      }
    }
  }
}
