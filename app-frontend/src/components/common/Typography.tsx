import { Text, TextProps, StyleProp, TextStyle } from "react-native";
import { useTheme } from "../../hooks/useTheme";

export type TypographyVariant = "heading" | "subheading" | "body" | "caption";

type TypographyProps = TextProps & {
  variant?: TypographyVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
};

export const Typography = ({
  variant = "body",
  color,
  style,
  children,
  ...rest
}: TypographyProps) => {
  const { typography, colors } = useTheme();
  const variantStyle = typography[variant];

  // Safety check: Don't render if children is undefined, null, or empty
  if (children === undefined || children === null || children === '') {
    return null;
  }

  return (
    <Text
      {...rest}
      style={[
        variantStyle,
        { color: color ?? colors.text },
        style,
      ]}
    >
      {children}
    </Text>
  );
};
