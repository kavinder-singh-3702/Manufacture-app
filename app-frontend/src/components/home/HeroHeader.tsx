import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View, ImageSourcePropType } from "react-native";
import { Typography } from "../common/Typography";
import { useTheme } from "../../hooks/useTheme";
import { colors, palette } from "../../theme/colors";

type HeroHeaderProps = {
  brandName: string;
  logoSource: ImageSourcePropType;
  headline: string;
  description: string;
  pillars: readonly string[];
  searchPlaceholder?: string;
  onMenuPress?: () => void;
  onAlertPress?: () => void;
};

export const HeroHeader = ({
  brandName,
  logoSource,
  headline,
  description,
  pillars,
  searchPlaceholder = "Search marketplace",
  onMenuPress,
  onAlertPress,
}: HeroHeaderProps) => {
  const { spacing, radius } = useTheme();

  return (
    <View style={[styles.container, { padding: spacing.md, borderRadius: radius.lg }]}>
      <View style={styles.heroTopRow}>
        <TouchableOpacity style={styles.hamburgerButton} onPress={onMenuPress} accessibilityLabel="Open navigation">
          <View style={styles.hamburgerLine} />
          <View style={[styles.hamburgerLine, { marginVertical: 4 }]} />
          <View style={styles.hamburgerLine} />
        </TouchableOpacity>
        <View style={styles.logoRow}>
          <Image source={logoSource} style={styles.logoImage} />
          <Typography variant="subheading" color="#fff">
            {brandName}
          </Typography>
        </View>
        <TouchableOpacity style={styles.alertButton} onPress={onAlertPress} accessibilityLabel="Notifications">
          <View style={styles.alertDot} />
          <Text style={styles.alertText}>!</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.searchBar, { borderRadius: radius.pill }]}>
        <View style={styles.searchIcon} />
        <TextInput
          placeholder={searchPlaceholder}
          placeholderTextColor="rgba(255,255,255,0.75)"
          style={styles.searchInput}
        />
        <TouchableOpacity style={styles.searchAction}>
          <Text style={styles.searchActionText}>Go</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.heroContent, { marginTop: spacing.md }]}>
        <View style={{ flex: 1, marginRight: spacing.md }}>
          <Typography variant="heading" color="#fff">
            {headline}
          </Typography>
          <Text style={styles.heroCopy}>{description}</Text>
        </View>
        <View style={styles.heroIllustration}>
          <View style={styles.heroCircleLarge} />
          <View style={styles.heroCircleSmall} />
        </View>
      </View>

      <View style={styles.pillarsRow}>
        {pillars.map((pillar) => (
          <View key={pillar} style={styles.pillarChip}>
            <Text style={styles.pillarText}>{pillar}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.charcoalGreen,
    overflow: "hidden",
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  hamburgerButton: {
    padding: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  hamburgerLine: {
    width: 24,
    height: 2,
    borderRadius: 2,
    backgroundColor: palette.white,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginHorizontal: 12,
  },
  logoImage: {
    width: 28,
    height: 28,
    marginRight: 8,
  },
  alertButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  alertDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF7373",
  },
  alertText: {
    color: palette.white,
    fontWeight: "700",
    fontSize: 14,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 16,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  searchIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: palette.white,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: palette.white,
    fontSize: 15,
    paddingVertical: 8,
  },
  searchAction: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: palette.white,
  },
  searchActionText: {
    fontWeight: "600",
    color: colors.primary,
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroCopy: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  heroIllustration: {
    width: 110,
    height: 110,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  heroCircleLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: palette.white,
    opacity: 0.25,
  },
  heroCircleSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.white,
    opacity: 0.4,
    position: "absolute",
    bottom: 18,
    right: 16,
  },
  pillarsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 16,
  },
  pillarChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 999,
    marginRight: 8,
    marginBottom: 8,
    borderColor: "rgba(255,255,255,0.35)",
  },
  pillarText: {
    color: palette.white,
    fontSize: 13,
    fontWeight: "600",
  },
});
