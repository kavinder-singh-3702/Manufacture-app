import { FC } from "react";
import { View, TouchableOpacity } from "react-native";
import { Typography } from "../../../components/common/Typography";
import { useTheme } from "../../../hooks/useTheme";
import { styles } from "./MainTabs.styles";

type UserHeaderProps = {
  displayName: string;
  email?: string | null;
  onMenuPress: () => void;
};

export const UserHeader: FC<UserHeaderProps> = ({ displayName, email, onMenuPress }) => {
  const { colors, spacing } = useTheme();

  return (
    <View
      style={[
        styles.header,
        {
          borderBottomColor: colors.border,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        },
      ]}
    >
      <TouchableOpacity style={styles.hamburger} onPress={onMenuPress} accessibilityLabel="Open menu">
        <View style={[styles.hamburgerLine, { backgroundColor: colors.text }]} />
        <View style={[styles.hamburgerLine, { backgroundColor: colors.text, marginVertical: 4 }]} />
        <View style={[styles.hamburgerLine, { backgroundColor: colors.text }]} />
      </TouchableOpacity>
      <View style={styles.userInfo}>
        <Typography variant="subheading">Hi, {displayName}</Typography>
        {email ? (
          <Typography variant="caption" color={colors.muted} style={{ marginTop: 2 }}>
            {email}
          </Typography>
        ) : null}
      </View>
    </View>
  );
};
