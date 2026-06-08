import ExpoModulesCore
import UIKit

public final class ExpoGlassViewModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoGlassView")

    View(GlassView.self) {
      Prop("tint") { (view: GlassView, value: String?) in
        view.applyTint(value ?? "system")
      }
      Prop("intensity") { (view: GlassView, value: Double?) in
        view.applyIntensity(CGFloat(value ?? 70))
      }
      Prop("cornerRadius") { (view: GlassView, value: Double?) in
        view.applyCornerRadius(CGFloat(value ?? 16))
      }
      Prop("borderColor") { (view: GlassView, value: String?) in
        view.applyBorderColor(value ?? "rgba(255,255,255,0.35)")
      }
    }
  }
}
