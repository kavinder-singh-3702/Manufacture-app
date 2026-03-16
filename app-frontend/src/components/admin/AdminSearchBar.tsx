import { useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";

type AdminSearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export const AdminSearchBar = ({
  value,
  onChangeText,
  placeholder = "Search...",
}: AdminSearchBarProps) => {
  const { colors, radius } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const { width } = useWindowDimensions();
  const compact = width < 390;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderColor: isFocused ? colors.text + "35" : colors.text + "20",
          borderWidth: 1.5,
        },
      ]}
    >
      <Ionicons
        name="search"
        size={18}
        color={colors.textSecondary}
        style={styles.searchIcon}
      />
      <TextInput
        style={[styles.input, { color: colors.text, fontSize: compact ? 13 : 14 }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => onChangeText("")}
          style={[styles.clearButton, { backgroundColor: colors.textMuted + "30" }]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={12} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 44,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    height: "100%",
  },
  clearButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
});
