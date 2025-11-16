import { FC } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Typography } from "../../../../components/common/Typography";
import { useTheme } from "../../../../hooks/useTheme";

type LogoBadgeProps = {
  label?: string;
  style?: StyleProp<ViewStyle>;
};

export const LogoBadge: FC<LogoBadgeProps> = ({ label = "MF", style }) => {
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
      <Typography variant="subheading" color={colors.primary}>
        {label}
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
});
