import ExpoModulesCore
import UIKit

/**
 * Glass surface view.
 *
 * Hierarchy:
 *   GlassView (ExpoView, clipsToBounds for corner radius)
 *     ├─ visualEffectView (UIVisualEffectView fills bounds)
 *     │     └─ contentView (children mount here — see addSubview override)
 *     └─ borderLayer (1px highlight border, drawn above the blur)
 *
 * iOS 26+ uses real `UIGlassEffect` for true Liquid Glass.
 * iOS 15.1-25 fall back to `UIVisualEffectView` with `.systemUltraThinMaterial`.
 */
public final class GlassView: ExpoView {
  private let visualEffectView: UIVisualEffectView
  private let borderLayer = CALayer()

  private var currentTint: String = "system"
  private var currentBorderColor: UIColor = UIColor.white.withAlphaComponent(0.35)
  private var currentCornerRadius: CGFloat = 16

  public required init(appContext: AppContext? = nil) {
    // Initialise with a baseline blur; applyTint() will swap in the iOS 26 path
    // immediately after construction.
    let baseEffect = UIBlurEffect(style: .systemUltraThinMaterial)
    self.visualEffectView = UIVisualEffectView(effect: baseEffect)

    super.init(appContext: appContext)

    backgroundColor = .clear
    clipsToBounds = true
    layer.cornerCurve = .continuous

    visualEffectView.translatesAutoresizingMaskIntoConstraints = false
    addSubview(visualEffectView)
    NSLayoutConstraint.activate([
      visualEffectView.topAnchor.constraint(equalTo: topAnchor),
      visualEffectView.leadingAnchor.constraint(equalTo: leadingAnchor),
      visualEffectView.trailingAnchor.constraint(equalTo: trailingAnchor),
      visualEffectView.bottomAnchor.constraint(equalTo: bottomAnchor),
    ])

    borderLayer.borderWidth = 1
    borderLayer.borderColor = currentBorderColor.cgColor
    layer.addSublayer(borderLayer)

    applyTint(currentTint)
    applyCornerRadius(currentCornerRadius)
  }

  // MARK: - Layout

  public override func layoutSubviews() {
    super.layoutSubviews()
    CATransaction.begin()
    CATransaction.setDisableActions(true)
    borderLayer.frame = bounds
    borderLayer.cornerRadius = layer.cornerRadius
    CATransaction.commit()
  }

  // MARK: - Child mounting
  //
  // UIVisualEffectView's biggest footgun: subviews added directly to it (or to
  // the wrapper view) are invisible until placed inside `contentView`. RN/Expo
  // adds children via `addSubview` on this GlassView. We intercept that and
  // forward them to the visual effect view's contentView so they render above
  // the blur.

  public override func addSubview(_ view: UIView) {
    if view === visualEffectView {
      super.addSubview(view)
    } else {
      visualEffectView.contentView.addSubview(view)
    }
  }

  // MARK: - Props

  func applyTint(_ value: String) {
    currentTint = value

    if #available(iOS 26.0, *) {
      // Real iOS 26 Liquid Glass material.
      let glass = UIGlassEffect()
      visualEffectView.effect = glass
      return
    }

    // Pre-iOS 26 fallback.
    let style: UIBlurEffect.Style
    switch value {
    case "dark":
      style = .systemUltraThinMaterialDark
    case "light":
      style = .systemUltraThinMaterialLight
    default:
      style = .systemUltraThinMaterial
    }
    visualEffectView.effect = UIBlurEffect(style: style)
  }

  func applyIntensity(_ value: CGFloat) {
    // iOS material intensity is system-driven; we don't override it here for
    // visual consistency with native HIG. Reserved for future use (custom
    // overlay alpha, etc.).
    _ = value
  }

  func applyCornerRadius(_ value: CGFloat) {
    currentCornerRadius = value
    layer.cornerRadius = value
    setNeedsLayout()
  }

  func applyBorderColor(_ value: String) {
    currentBorderColor = parseColor(value) ?? UIColor.white.withAlphaComponent(0.35)
    borderLayer.borderColor = currentBorderColor.cgColor
  }

  // MARK: - Helpers

  /// Parses a subset of CSS-style color strings (rgba/rgb/hex) into UIColor.
  /// Returns nil on parse failure — caller falls back to the default tint.
  private func parseColor(_ raw: String) -> UIColor? {
    let trimmed = raw.trimmingCharacters(in: .whitespaces).lowercased()

    if trimmed.hasPrefix("rgba(") || trimmed.hasPrefix("rgb(") {
      let inside = trimmed
        .replacingOccurrences(of: "rgba(", with: "")
        .replacingOccurrences(of: "rgb(", with: "")
        .replacingOccurrences(of: ")", with: "")
      let parts = inside.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }
      guard parts.count >= 3,
            let r = Double(parts[0]),
            let g = Double(parts[1]),
            let b = Double(parts[2])
      else { return nil }
      let a: Double = parts.count >= 4 ? (Double(parts[3]) ?? 1.0) : 1.0
      return UIColor(red: CGFloat(r / 255), green: CGFloat(g / 255), blue: CGFloat(b / 255), alpha: CGFloat(a))
    }

    if trimmed.hasPrefix("#") {
      var hex = String(trimmed.dropFirst())
      if hex.count == 3 {
        hex = hex.map { "\($0)\($0)" }.joined()
      }
      guard hex.count == 6 || hex.count == 8 else { return nil }
      var value: UInt64 = 0
      Scanner(string: hex).scanHexInt64(&value)
      let r, g, b, a: CGFloat
      if hex.count == 8 {
        r = CGFloat((value & 0xFF000000) >> 24) / 255
        g = CGFloat((value & 0x00FF0000) >> 16) / 255
        b = CGFloat((value & 0x0000FF00) >> 8) / 255
        a = CGFloat(value & 0x000000FF) / 255
      } else {
        r = CGFloat((value & 0xFF0000) >> 16) / 255
        g = CGFloat((value & 0x00FF00) >> 8) / 255
        b = CGFloat(value & 0x0000FF) / 255
        a = 1
      }
      return UIColor(red: r, green: g, blue: b, alpha: a)
    }

    return nil
  }
}
