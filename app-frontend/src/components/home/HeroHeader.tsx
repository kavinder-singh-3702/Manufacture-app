import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View, ImageSourcePropType } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Typography } from "../common/Typography";
import { useTheme } from "../../hooks/useTheme";

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
  const { spacing, radius, colors: themeColors } = useTheme();

  return (
    <LinearGradient
      colors={[themeColors.primary, themeColors.accentWarm, themeColors.backgroundSecondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { padding: spacing.md, borderRadius: radius.lg }]}
    >
      <View style={styles.heroTopRow}>
        <TouchableOpacity style={[styles.hamburgerButton, { borderColor: "rgba(255,255,255,0.4)" }]} onPress={onMenuPress} accessibilityLabel="Open navigation">
          <View style={[styles.hamburgerLine, { backgroundColor: "#fff" }]} />
          <View style={[styles.hamburgerLine, { marginVertical: 4, backgroundColor: "#fff" }]} />
          <View style={[styles.hamburgerLine, { backgroundColor: "#fff" }]} />
        </TouchableOpacity>
        <View style={styles.logoRow}>
          <Image source={logoSource} style={styles.logoImage} />
          <Typography variant="subheading" color="#fff">
            {brandName}
          </Typography>
        </View>
        <TouchableOpacity style={[styles.alertButton, { borderColor: "rgba(255,255,255,0.4)" }]} onPress={onAlertPress} accessibilityLabel="Notifications">
          <View style={styles.alertDot} />
          <Text style={[styles.alertText, { color: "#fff" }]}>!</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.searchBar, { borderRadius: radius.pill }]}> 
        <View style={[styles.searchIcon, { borderColor: "#fff" }]} />
        <TextInput placeholder={searchPlaceholder} placeholderTextColor="rgba(255,255,255,0.75)" style={[styles.searchInput, { color: "#fff" }]} />
        <TouchableOpacity style={[styles.searchAction, { backgroundColor: themeColors.surface }]}> 
          <Text style={[styles.searchActionText, { color: "#fff" }]}>Go</Text>
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
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
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
  },
  hamburgerLine: {
    width: 24,
    height: 2,
    borderRadius: 2,
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
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
  },
  searchAction: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  searchActionText: {
    fontWeight: "600",
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
    backgroundColor: "#fff",
    opacity: 0.25,
  },
  heroCircleSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
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
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});
