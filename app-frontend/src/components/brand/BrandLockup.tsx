import { Image, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { APP_NAME, BRAND_IMAGES } from "../../constants/brand";

type BrandLockupProps = {
  compact?: boolean;
  showSubtitle?: boolean;
  subtitle?: string;
  textColor?: string;
  subtitleColor?: string;
  style?: StyleProp<ViewStyle>;
};

export const BrandLockup = ({
  compact = false,
  showSubtitle = false,
  subtitle = "Industrial Network",
  textColor = "#FFFFFF",
  subtitleColor = "rgba(255,255,255,0.68)",
  style,
}: BrandLockupProps) => {
  const logoSize = compact ? 28 : 40;

  return (
    <View style={[styles.row, style]}>
      <Image
        source={BRAND_IMAGES.logo}
        style={[
          styles.logo,
          {
            width: logoSize,
            height: logoSize,
            borderRadius: compact ? 8 : 12,
          },
        ]}
      />
      <View style={styles.textWrap}>
        <Text
          style={[
            styles.title,
            {
              fontSize: compact ? 13 : 18,
              color: textColor,
              letterSpacing: compact ? 0.7 : 1.1,
            },
          ]}
        >
          {APP_NAME}
        </Text>
        {showSubtitle ? (
          <Text
            style={[
              styles.subtitle,
              {
                color: subtitleColor,
                fontSize: compact ? 10 : 12,
              },
            ]}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    resizeMode: "cover",
  },
  textWrap: {
    marginLeft: 10,
  },
  title: {
    fontWeight: "900",
    textTransform: "uppercase",
  },
  subtitle: {
    marginTop: 1,
    fontWeight: "600",
  },
});
