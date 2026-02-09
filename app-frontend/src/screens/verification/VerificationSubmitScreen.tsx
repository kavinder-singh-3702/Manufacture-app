import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../hooks/useTheme';
import { useThemeMode } from '../../hooks/useThemeMode';
import { DocumentUploader, PickedDocument } from '../../components/company/DocumentUploader';
import { verificationService } from '../../services/verificationService';
import { SubmitVerificationPayload } from '../../types/company';
import { RootStackParamList } from '../../navigation/types';

export const VerificationSubmitScreen = () => {
  const { colors } = useTheme();
  const { resolvedMode } = useThemeMode();
  const isDark = resolvedMode === "dark";
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'VerificationSubmit'>>();
  const { companyId } = route.params;

  const [gstDocument, setGstDocument] = useState<PickedDocument | null>(null);
  const [aadhaarDocument, setAadhaarDocument] = useState<PickedDocument | null>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!gstDocument) {
      Alert.alert('Missing Document', 'Please upload GST certificate');
      return;
    }

    if (!aadhaarDocument) {
      Alert.alert('Missing Document', 'Please upload Aadhaar card');
      return;
    }

    try {
      setIsSubmitting(true);

      await verificationService.submitVerification(companyId, {
        gstCertificate: gstDocument,
        aadhaarCard: aadhaarDocument,
        notes: notes.trim() || undefined,
      });

      Alert.alert(
        'Success',
        'Your verification request has been submitted. Our team will review it shortly.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('CompanyVerification', { companyId }),
          },
        ]
      );
    } catch (error: any) {
      console.error('Verification submission error:', error);
      Alert.alert(
        'Submission Failed',
        error.message || 'Failed to submit verification request'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.surfaceCanvasStart, colors.surfaceCanvasMid, colors.surfaceCanvasEnd]}
      locations={[0, 0.5, 1]}
      style={styles.container}
    >
      {/* Indigo glow - top left */}
      <LinearGradient
        colors={[colors.surfaceOverlayPrimary, colors.surfaceOverlayPrimary.replace("0.12", "0.04"), "transparent"]}
        locations={[0, 0.4, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 0.7 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Salmon glow - bottom right */}
      <LinearGradient
        colors={["transparent", colors.surfaceOverlayAccent.replace("0.10", "0.06"), colors.surfaceOverlayAccent]}
        locations={[0, 0.6, 1]}
        start={{ x: 0.3, y: 0.3 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Company Verification</Text>
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardAvoid}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <Text style={styles.subtitle}>
                Upload your GST certificate and Aadhaar card to verify your company
              </Text>

              <DocumentUploader
                type="gstCertificate"
                label="GST Certificate *"
                onDocumentPicked={setGstDocument}
                pickedDocument={gstDocument || undefined}
              />

              <DocumentUploader
                type="aadhaarCard"
                label="Aadhaar Card *"
                onDocumentPicked={setAadhaarDocument}
                pickedDocument={aadhaarDocument || undefined}
              />

              <View style={styles.notesContainer}>
                <Text style={styles.label}>Additional Notes (Optional)</Text>
                <TextInput
                  style={styles.textArea}
                  multiline
                  numberOfLines={4}
                  placeholder="Add any additional information..."
                  placeholderTextColor={colors.textTertiary}
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButtonWrapper,
                  (!gstDocument || !aadhaarDocument || isSubmitting) &&
                  styles.submitButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!gstDocument || !aadhaarDocument || isSubmitting}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={(!gstDocument || !aadhaarDocument || isSubmitting)
                    ? [colors.buttonSecondary, colors.backgroundSecondary]
                    : [colors.primary, colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitButton}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={colors.textOnPrimary} />
                  ) : (
                    <Text style={styles.submitButtonText}>Submit for Verification</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <Text style={styles.disclaimer}>
                * Required fields. Your documents will be reviewed within 2-3 business days.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const createStyles = (colors: ReturnType<typeof useTheme>["colors"], isDark: boolean) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 15,
    backgroundColor: 'transparent',
  },
  headerBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backIcon: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    marginLeft: -2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  content: {
    padding: 16,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 24,
    marginTop: 16,
    lineHeight: 20,
  },
  notesContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    backgroundColor: isDark ? 'rgba(22, 24, 29, 0.9)' : colors.surface,
    textAlignVertical: 'top',
    minHeight: 100,
  },
  submitButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  submitButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
    shadowColor: colors.shadow,
    shadowOpacity: 0.2,
  },
  submitButtonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  disclaimer: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 16,
  },
  });
