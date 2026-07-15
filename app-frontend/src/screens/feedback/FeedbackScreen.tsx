import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { InputField } from "../../components/common/InputField";
import { Button } from "../../components/common/Button";
import { useToast } from "../../components/ui/Toast";
import { feedbackService } from "../../services/feedback.service";
import { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const FeedbackScreen = () => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { colors, spacing, radius } = useTheme();
  const { success, error } = useToast();

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ message?: string; subject?: string }>({});
  // Ref-based re-entrancy guard — React `submitting` state updates async
  // so a double-tap can fire two POSTs before disabled={submitting}
  // commits. The ref flips synchronously and blocks the second call.
  const inFlightRef = useRef(false);

  const setMessageField = (value: string) => {
    setMessage(value);
    if (fieldErrors.message) setFieldErrors((prev) => ({ ...prev, message: undefined }));
  };
  const setSubjectField = (value: string) => {
    setSubject(value);
    if (fieldErrors.subject) setFieldErrors((prev) => ({ ...prev, subject: undefined }));
  };

  const submit = async () => {
    if (inFlightRef.current) return;
    const trimmedMessage = message.trim();
    const nextErrors: typeof fieldErrors = {};
    if (!trimmedMessage) nextErrors.message = "Tell us what's on your mind";
    if (trimmedMessage.length > 2000) nextErrors.message = "Keep it under 2000 characters";
    if (subject.trim().length > 120) nextErrors.subject = "Subject is too long";
    if (Object.keys(nextErrors).length) {
      setFieldErrors(nextErrors);
      return;
    }

    inFlightRef.current = true;
    try {
      setSubmitting(true);
      await feedbackService.submit({
        subject: subject.trim() || undefined,
        message: trimmedMessage,
        rating: rating > 0 ? rating : null,
      });
      success("Feedback sent", "Thanks — our team will review it soon.");
      navigation.goBack();
    } catch (err: any) {
      error("Could not send feedback", err?.message || "Please try again in a moment.");
    } finally {
      setSubmitting(false);
      inFlightRef.current = false;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={[colors.surfaceCanvasStart, colors.surfaceCanvasMid, colors.surfaceCanvasEnd]}
          locations={[0, 0.58, 1]}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={[colors.surfaceOverlayPrimary, "transparent", colors.surfaceOverlayAccent]}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: spacing.xxl + insets.bottom,
            gap: spacing.md,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          <View style={styles.headerRow}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
              style={[
                styles.backButton,
                { borderRadius: radius.md, borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            >
              <Ionicons name="arrow-back" size={16} color={colors.text} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Send feedback</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                Tell us what's working, what isn't, or what you'd love to see next.
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.card,
              { borderRadius: radius.md, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md },
            ]}
          >
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>How do you rate the app?</Text>
            <View style={[styles.starsRow, { marginTop: spacing.xs }]}>
              {[1, 2, 3, 4, 5].map((n) => {
                const filled = n <= rating;
                return (
                  <TouchableOpacity
                    key={n}
                    onPress={() => setRating(n === rating ? 0 : n)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={`Rate ${n} star${n === 1 ? "" : "s"}`}
                    accessibilityState={{ selected: rating >= n }}
                    style={{ paddingHorizontal: 4 }}
                  >
                    <Ionicons
                      name={filled ? "star" : "star-outline"}
                      size={30}
                      color={filled ? colors.warning : colors.textMuted}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
            {rating > 0 ? (
              <Text style={[styles.ratingHint, { color: colors.textMuted, marginTop: 4 }]}>
                Tap the same star again to clear the rating.
              </Text>
            ) : (
              <Text style={[styles.ratingHint, { color: colors.textMuted, marginTop: 4 }]}>
                Optional — leave blank if you'd rather not rate.
              </Text>
            )}
          </View>

          <View
            style={[
              styles.card,
              { borderRadius: radius.md, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, gap: spacing.sm },
            ]}
          >
            <InputField
              label="Subject"
              value={subject}
              onChangeText={setSubjectField}
              placeholder="One line about your feedback"
              maxLength={120}
              errorText={fieldErrors.subject}
              helperText="Optional"
            />
            <InputField
              label="Message"
              value={message}
              onChangeText={setMessageField}
              placeholder="Tell us more…"
              required
              multiline
              maxLength={2000}
              style={{ minHeight: 140, textAlignVertical: "top" }}
              errorText={fieldErrors.message}
              helperText={`${message.length} / 2000`}
            />
          </View>

          <Button
            label={submitting ? "Sending…" : "Send feedback"}
            onPress={submit}
            loading={submitting}
            disabled={submitting}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 12 },
  backButton: { width: 36, height: 36, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  headerTitle: { fontSize: 20, fontWeight: "800", letterSpacing: -0.4 },
  headerSubtitle: { fontSize: 13, fontWeight: "500", marginTop: 2 },
  card: { borderWidth: 1 },
  sectionLabel: { fontSize: 12, fontWeight: "700", letterSpacing: 0.6, textTransform: "uppercase" },
  starsRow: { flexDirection: "row", alignItems: "center" },
  ratingHint: { fontSize: 12, fontWeight: "500" },
});
