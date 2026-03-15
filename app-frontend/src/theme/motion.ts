export const motion = {
  duration: {
    fast: 220,
    normal: 360,
    medium: 520,
    slow: 900,
    ambient: 2800,
    ambientLong: 3600,
  },
  delay: {
    short: 120,
    medium: 220,
    long: 420,
  },
  distance: {
    tiny: 6,
    small: 10,
    medium: 16,
  },
} as const;

export type MotionTokens = typeof motion;
