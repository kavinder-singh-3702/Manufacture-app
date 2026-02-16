import { Text, TextProps, StyleProp, TextStyle } from "react-native";
import { useTheme } from "../../hooks/useTheme";

export type TypographyVariant = "display" | "heading" | "subheading" | "body" | "bodyStrong" | "caption";

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
  const variantStyle = typography[variant] ?? typography.body;

  if (children === undefined || children === null || children === "") {
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
