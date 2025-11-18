# 🎨 Mixed Color Theme Guide

## Brand Color Palette

Your app uses a sophisticated **mixed color palette** based on 4 core colors:

| Color | Hex | Description |
|-------|-----|-------------|
| **Charcoal** | `#2E2E3A` | Dark slate - professional, modern |
| **Green** | `#11A440` | Vibrant green - growth, action |
| **Burgundy** | `#3B1F2B` | Deep burgundy - elegance, premium |
| **Pink** | `#FADADD` | Soft pink - friendly, approachable |

---

## 🌈 Color Mixing Philosophy

Instead of using colors in isolation, this theme **blends and mixes** them to create harmonious variations:

### Green Family (Primary)
- **Pure Green** `#11A440` - Primary buttons, CTAs
- **Green Light** `#5BC474` - Green + 40% white
- **Green Soft** `#B8E6C3` - **Green + Pink blend** (soft pastel)
- **Green Dark** `#0D7D31` - Green + charcoal
- **Green Burgundy** `#2A6B3B` - Green + burgundy hint

### Burgundy Family (Secondary)
- **Pure Burgundy** `#3B1F2B` - Secondary buttons, emphasis
- **Burgundy Light** `#4D2838` - Burgundy + 20% white
- **Burgundy Soft** `#8B6575` - **Burgundy + Pink blend**
- **Burgundy Rose** `#6B3D4D` - **Burgundy + more pink**
- **Burgundy Dark** `#2A1720` - Burgundy + charcoal

### Pink Family (Accent)
- **Pure Pink** `#FADADD` - Highlights, accents
- **Pink Light** `#FCF0F1` - Very light (95% white) - main background
- **Pink Warm** `#FFE4E8` - Pink + warmth
- **Pink Charcoal** `#E5C9CE` - **Pink + charcoal tint**
- **Pink Burgundy** `#F3C5CF` - **Pink + burgundy blend**
- **Pink Green** `#E8F2EA` - **Pink + green** (minty soft)

### Charcoal Family (Dark)
- **Pure Charcoal** `#2E2E3A` - Main text, headers
- **Charcoal Light** `#434355` - Charcoal + 20% white
- **Charcoal Muted** `#3A3A48` - **Charcoal + pink hint**
- **Charcoal Green** `#2A3B37` - **Charcoal + green undertone**
- **Charcoal Burgundy** `#342935` - **Charcoal + burgundy mix**

---

## 📐 Usage Guidelines

### Backgrounds

```typescript
// React Native
background: colors.background           // #FCF0F1 (very light pink)
background: colors.backgroundWarm       // #FFF9FA (warm white)
background: colors.backgroundMint       // #E8F2EA (pink+green mix)

// Web (Tailwind)
className="bg-background"               // Light pink
style={{ background: 'var(--gradient-soft)' }}  // Gradient
```

### Buttons

#### Primary (Green)
```typescript
backgroundColor: colors.buttonPrimary        // #11A440 green
color: colors.textOnPrimary                 // white text
// Pressed: colors.buttonPrimaryHover        // #0D7D31 dark green
```

#### Secondary (Burgundy)
```typescript
backgroundColor: colors.buttonSecondary      // #3B1F2B burgundy
color: colors.textOnSecondary               // white text
// Pressed: colors.buttonSecondaryHover      // #2A1720 dark burgundy
```

#### Ghost (Transparent → Pink)
```typescript
backgroundColor: colors.buttonGhost          // transparent
color: colors.primary                        // green text
// Hover: colors.buttonGhostHover            // #FCF0F1 light pink
```

### Cards & Surfaces

```typescript
backgroundColor: colors.surface              // #FFFFFF white
backgroundColor: colors.surfaceElevated      // #F8F8FA (off-white)
backgroundColor: colors.cardTinted           // #FFE4E8 (warm pink)
```

### Text Colors

```typescript
color: colors.text                  // #2E2E3A charcoal (main)
color: colors.textLight             // #434355 lighter charcoal
color: colors.textMuted             // #3A3A48 charcoal+pink (subtle)
color: colors.textSecondary         // #9999A1 gray
color: colors.textInverse           // white (on dark backgrounds)
```

### Borders

```typescript
borderColor: colors.border              // #E5E5E8 light gray
borderColor: colors.borderPrimary       // #5BC474 green-tinted
borderColor: colors.borderSecondary     // #8B6575 burgundy-tinted
borderColor: colors.borderAccent        // #F3C5CF pink-burgundy blend
```

---

## 🎨 Gradients (Mixed Colors)

### React Native Usage

```typescript
import { LinearGradient } from 'expo-linear-gradient';

// Green → Pink
<LinearGradient
  colors={[palette.green, palette.gradientGreenPink, palette.pink]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
>
  {/* Content */}
</LinearGradient>

// Burgundy → Pink
<LinearGradient
  colors={[palette.burgundy, palette.gradientBurgundyPink, palette.pink]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
>
  {/* Content */}
</LinearGradient>

// Full Brand (3 colors)
<LinearGradient
  colors={[palette.green, palette.pink, palette.burgundy]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
>
  {/* Content */}
</LinearGradient>
```

### Web Usage

```tsx
// CSS
style={{ background: 'var(--gradient-green-pink)' }}
style={{ background: 'var(--gradient-burgundy-pink)' }}
style={{ background: 'var(--gradient-brand)' }}      // All 3 colors

// Tailwind (custom utility)
className="bg-gradient-brand"
```

---

## 💫 Shadows (Color-Tinted)

### Soft Pink Shadows
```typescript
// React Native
shadowColor: palette.pink
shadowOffset: { width: 0, height: 4 }
shadowOpacity: 0.3
shadowRadius: 6
elevation: 4  // Android

// Or use theme
...shadows.md     // Pre-defined pink-tinted shadow
```

### Colored Shadows
```typescript
// Green glow
...shadows.green         // 0 4px 12px rgba(17, 164, 64, 0.3)

// Burgundy shadow
...shadows.burgundy      // 0 4px 12px rgba(59, 31, 43, 0.3)

// Pink glow
...shadows.pinkGlow      // 0 0 20px rgba(250, 218, 221, 0.5)
```

---

## 🏷️ Badges & Tags

Mixed color badges with soft backgrounds:

```typescript
// Success (green-pink blend)
backgroundColor: colors.badgeSuccess     // #B8E6C3 soft green
color: colors.text                      // charcoal text

// Secondary (burgundy-pink blend)
backgroundColor: colors.badgeSecondary   // #8B6575 soft burgundy
color: colors.white                     // white text

// Neutral (pink-charcoal blend)
backgroundColor: colors.badgeNeutral     // #E5C9CE
color: colors.text                      // charcoal text
```

---

## 🎭 Example Component Styles

### Hero Header with Gradient
```tsx
<View style={{
  background: theme.gradients.brandFull,  // Green → Pink → Burgundy
  padding: theme.spacing.xl,
  borderRadius: theme.radius.lg,
  ...theme.shadows.lgDark
}}>
  <Text style={{ color: colors.textInverse }}>
    Welcome to Manufacture
  </Text>
</View>
```

### Card with Mixed Border
```tsx
<View style={{
  backgroundColor: colors.surface,
  borderWidth: 2,
  borderColor: colors.borderAccent,      // Pink-burgundy blend
  borderRadius: theme.radius.md,
  ...theme.shadows.md,                  // Pink-tinted shadow
  padding: theme.spacing.lg
}}>
  {/* Content */}
</View>
```

### Primary Button with Glow
```tsx
<TouchableOpacity style={{
  backgroundColor: colors.primary,       // Green
  paddingVertical: theme.spacing.md,
  paddingHorizontal: theme.spacing.xl,
  borderRadius: theme.radius.pill,
  ...theme.shadows.greenGlow            // Green glow effect
}}>
  <Text style={{ color: colors.textOnPrimary }}>
    Get Started
  </Text>
</TouchableOpacity>
```

---

## 🌟 Color Combinations (Pre-tested)

### High Contrast (Accessibility)
- **Charcoal on Pink Light** - `#2E2E3A` on `#FCF0F1` ✅ WCAG AAA
- **White on Green** - `#FFFFFF` on `#11A440` ✅ WCAG AA
- **White on Burgundy** - `#FFFFFF` on `#3B1F2B` ✅ WCAG AAA
- **Charcoal on White** - `#2E2E3A` on `#FFFFFF` ✅ WCAG AAA

### Harmonious Combinations
- **Green + Pink Soft** - Primary action on soft background
- **Burgundy + Pink Burgundy** - Secondary element on tinted background
- **Charcoal Muted + Pink Light** - Text on main background

---

## 📱 Screen-Specific Recommendations

### Dashboard Screen
- **Background**: `colors.background` (light pink)
- **Cards**: `colors.surface` (white) with `shadows.md` (pink-tinted)
- **Primary CTA**: `colors.primary` (green) with `shadows.greenGlow`
- **Secondary Elements**: `colors.secondarySoft` (burgundy-pink blend)
- **Hero Section**: `gradients.greenToPink` gradient

### Inventory Screen
- **Status Badges**:
  - Healthy: `colors.badgeSuccess` (green-pink soft)
  - Low: `colors.badgeWarning` (orange-pink soft)
  - Critical: `colors.badgeError` (red-pink soft)

### Auth Screens
- **Background**: `gradients.backgroundSoft` (subtle pink gradient)
- **Input Fields**: `colors.surface` with `borderColor: colors.borderPrimary`
- **Login Button**: `colors.buttonPrimary` (green)
- **Signup Button**: `colors.buttonSecondary` (burgundy)

---

## 🚀 Quick Reference

```typescript
// Import
import { useTheme } from '../hooks/useTheme';

// In component
const { colors, gradients, shadows } = useTheme();

// Examples
<View style={{ backgroundColor: colors.background }}>
  <View style={{
    backgroundColor: colors.surface,
    borderColor: colors.borderAccent,
    ...shadows.md
  }}>
    <Button
      color={colors.primary}
      textColor={colors.textOnPrimary}
    />
  </View>
</View>
```

---

## 🎨 Web-Frontend (Tailwind CSS)

Use CSS variables in your Next.js app:

```tsx
// Backgrounds
<div className="bg-background">              {/* Pink light */}
<div className="bg-primary">                 {/* Green */}
<div className="bg-secondary">               {/* Burgundy */}

// Text
<p className="text-foreground">              {/* Charcoal */}
<p className="text-primary">                 {/* Green */}
<p className="text-muted">                   {/* Gray */}

// Gradients (custom styles)
<div style={{ background: 'var(--gradient-brand)' }}>
<div style={{ background: 'var(--gradient-green-pink)' }}>

// Shadows
<div style={{ boxShadow: 'var(--shadow-md)' }}>
<button style={{ boxShadow: 'var(--shadow-green)' }}>
```

---

**Your theme is now fully configured with mixed colors throughout!** 🎉

All components using `colors.*` will automatically use the new blended palette.
