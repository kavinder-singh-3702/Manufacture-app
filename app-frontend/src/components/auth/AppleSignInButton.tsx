import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";
import { useAuth } from "../../hooks/useAuth";
import { useThemeMode } from "../../hooks/useThemeMode";

type AppleSignInButtonProps = {
  onError?: (message: string) => void;
  width?: number | "100%";
  height?: number;
  cornerRadius?: number;
};

export const AppleSignInButton = ({
  onError,
  width = "100%",
  height = 50,
  cornerRadius = 14,
}: AppleSignInButtonProps) => {
  const { signInWithApple } = useAuth();
  const { resolvedMode } = useThemeMode();
  const [available, setAvailable] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (Platform.OS !== "ios") return;
    AppleAuthentication.isAvailableAsync()
      .then(setAvailable)
      .catch(() => setAvailable(false));
  }, []);

  if (Platform.OS !== "ios" || !available) return null;

  const handlePress = async () => {
    try {
      setLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!credential.identityToken) {
        onError?.("Apple sign-in did not return a token. Try again.");
        return;
      }

      const fullName = credential.fullName
        ? [credential.fullName.givenName, credential.fullName.familyName]
            .filter(Boolean)
            .join(" ")
            .trim()
        : undefined;

      await signInWithApple({
        identityToken: credential.identityToken,
        fullName: fullName || undefined,
      });
    } catch (error: unknown) {
      const code = (error as { code?: string })?.code;
      if (code === "ERR_REQUEST_CANCELED") return;
      const message = error instanceof Error ? error.message : "Apple sign-in failed";
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  const buttonStyle = resolvedMode === "dark"
    ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
    : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK;

  return (
    <View style={styles.wrap}>
      <AppleAuthentication.AppleAuthenticationButton
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={buttonStyle}
        cornerRadius={cornerRadius}
        style={{ width, height }}
        onPress={handlePress}
      />
      {loading ? (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator color={resolvedMode === "dark" ? "#000" : "#fff"} />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    position: "relative",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
