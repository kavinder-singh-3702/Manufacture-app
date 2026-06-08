package expo.modules.glassview

import android.content.Context
import android.graphics.Color
import android.graphics.Outline
import android.graphics.RenderEffect
import android.graphics.Shader
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.view.View
import android.view.ViewOutlineProvider
import androidx.annotation.RequiresApi
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.views.ExpoView

/**
 * Android glass surface.
 *
 * API 31+ (Android 12+): uses RenderEffect.createBlurEffect on the view's own
 * rendering to approximate native iOS UIVisualEffectView. Note: this blurs the
 * view's contents, not the background. For full background blur Android would
 * need an off-screen capture pass — not feasible cross-app, so we keep the
 * pragmatic "frosted layer" look which still feels premium.
 *
 * API 24-30: translucent surface + thin border. Looks clean, doesn't try to fake
 * a blur it can't deliver.
 */
class GlassView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {

  private val backdrop = GradientDrawable().apply {
    shape = GradientDrawable.RECTANGLE
  }

  private var tint: String = "system"
  private var intensity: Float = 70f
  private var cornerRadiusPx: Float = dp(16f)
  private var borderColorInt: Int = Color.argb(89, 255, 255, 255) // ~35% white

  init {
    background = backdrop
    applyVisualState()

    // Clip children to the rounded outline so the blur + border + content all
    // share the same bounds.
    outlineProvider = object : ViewOutlineProvider() {
      override fun getOutline(view: View, outline: Outline) {
        outline.setRoundRect(0, 0, view.width, view.height, cornerRadiusPx)
      }
    }
    clipToOutline = true
  }

  // MARK: - Props

  fun applyTint(value: String) {
    tint = value
    applyVisualState()
  }

  fun applyIntensity(value: Float) {
    intensity = value.coerceIn(0f, 100f)
    applyVisualState()
  }

  fun applyCornerRadius(valueDp: Float) {
    cornerRadiusPx = dp(valueDp)
    backdrop.cornerRadius = cornerRadiusPx
    invalidateOutline()
  }

  fun applyBorderColor(raw: String) {
    borderColorInt = parseColor(raw) ?: Color.argb(89, 255, 255, 255)
    backdrop.setStroke(dp(1f).toInt().coerceAtLeast(1), borderColorInt)
  }

  // MARK: - Internal

  private fun applyVisualState() {
    val (fillAlpha, fillBase) = when (tint) {
      "dark" -> Pair(80, intArrayOf(20, 20, 24))
      "light" -> Pair(110, intArrayOf(255, 255, 255))
      else -> Pair(95, intArrayOf(245, 245, 250))
    }
    backdrop.setColor(Color.argb(fillAlpha, fillBase[0], fillBase[1], fillBase[2]))
    backdrop.cornerRadius = cornerRadiusPx
    backdrop.setStroke(dp(1f).toInt().coerceAtLeast(1), borderColorInt)

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      applyRenderEffect()
    }
  }

  @RequiresApi(Build.VERSION_CODES.S)
  private fun applyRenderEffect() {
    // RenderEffect intensity maps loosely to a blur radius. We clamp into a
    // sane visual range (4f..30f) so callers passing 0-100 get reasonable
    // results without manual conversion.
    val radius = (intensity / 100f).coerceIn(0.04f, 1f) * 28f + 4f
    setRenderEffect(
      RenderEffect.createBlurEffect(radius, radius, Shader.TileMode.CLAMP)
    )
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
    // Avoid retaining the RenderEffect after detach — small but important for
    // memory hygiene during navigation.
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      setRenderEffect(null)
    }
  }

  private fun dp(value: Float): Float = value * resources.displayMetrics.density

  private fun parseColor(raw: String): Int? {
    val trimmed = raw.trim().lowercase()

    if (trimmed.startsWith("rgba(") || trimmed.startsWith("rgb(")) {
      val inside = trimmed
        .removePrefix("rgba(")
        .removePrefix("rgb(")
        .removeSuffix(")")
      val parts = inside.split(",").map { it.trim() }
      if (parts.size < 3) return null
      val r = parts[0].toIntOrNull() ?: return null
      val g = parts[1].toIntOrNull() ?: return null
      val b = parts[2].toIntOrNull() ?: return null
      val a = if (parts.size >= 4) {
        ((parts[3].toFloatOrNull() ?: 1f) * 255).toInt().coerceIn(0, 255)
      } else 255
      return Color.argb(a, r, g, b)
    }

    if (trimmed.startsWith("#")) {
      return try {
        Color.parseColor(trimmed)
      } catch (e: IllegalArgumentException) {
        null
      }
    }

    return null
  }
}
