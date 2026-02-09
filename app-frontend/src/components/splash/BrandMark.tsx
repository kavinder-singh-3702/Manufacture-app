import { Image, StyleSheet, View } from "react-native";
import { BRAND_IMAGES } from "../../constants/brand";

type BrandMarkProps = {
  size?: number;
};

/**
 * BrandMark renders the canonical ARVANN logo artwork.
 * Keep the `size` API stable so existing splash consumers remain unchanged.
 */
export const BrandMark = ({ size = 184 }: BrandMarkProps) => {
  return (
    <View style={[styles.frame, { width: size, height: size }]}>
      <Image source={BRAND_IMAGES.logo} style={styles.image} />
    </View>
  );
};

const styles = StyleSheet.create({
  frame: {
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
});
