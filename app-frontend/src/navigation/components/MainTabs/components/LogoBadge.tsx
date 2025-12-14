import { FC } from "react";
import { Image, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Typography } from "../../../../components/common/Typography";
import { useTheme } from "../../../../hooks/useTheme";

type LogoBadgeProps = {
  label?: string;
  imageUri?: string;
  style?: StyleProp<ViewStyle>;
};

export const LogoBadge: FC<LogoBadgeProps> = ({ label = "MF", imageUri, style }) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} />
      ) : (
        <Typography variant="subheading" color={colors.textSecondary}>
          {label}
        </Typography>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 22,
    resizeMode: "cover",
  },
});
