export const typography = {
  display: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 28,
    fontWeight: "700" as const,
    lineHeight: 34,
    letterSpacing: 0.2,
  },
  heading: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 24,
    fontWeight: "700" as const,
    lineHeight: 31,
    letterSpacing: 0.15,
  },
  subheading: {
    fontFamily: "SpaceGrotesk_600SemiBold",
    fontSize: 18,
    fontWeight: "600" as const,
    lineHeight: 24,
    letterSpacing: 0.1,
  },
  body: {
    fontFamily: "System",
    fontSize: 15,
    fontWeight: "400" as const,
    lineHeight: 22,
  },
  bodyStrong: {
    fontFamily: "System",
    fontSize: 15,
    fontWeight: "600" as const,
    lineHeight: 22,
  },
  caption: {
    fontFamily: "System",
    fontSize: 12,
    fontWeight: "600" as const,
    lineHeight: 17,
    textTransform: "uppercase" as const,
    letterSpacing: 0.35,
  },
} as const;
