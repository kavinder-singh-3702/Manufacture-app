export const typography = {
  heading: {
    fontFamily: "System",
    fontSize: 24,
    fontWeight: "600" as const,
    lineHeight: 32,
  },
  subheading: {
    fontFamily: "System",
    fontSize: 18,
    fontWeight: "600" as const,
    lineHeight: 26,
  },
  body: {
    fontFamily: "System",
    fontSize: 15,
    fontWeight: "400" as const,
    lineHeight: 22,
  },
  caption: {
    fontFamily: "System",
    fontSize: 13,
    fontWeight: "500" as const,
    lineHeight: 18,
    textTransform: "uppercase" as const,
  },
} as const;
