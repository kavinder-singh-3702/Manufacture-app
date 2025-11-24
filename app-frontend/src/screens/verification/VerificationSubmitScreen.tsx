import React, { useState } from 'react';
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { DocumentUploader, PickedDocument } from '../../components/company/DocumentUploader';
import { verificationService } from '../../services/verificationService';
import { SubmitVerificationPayload } from '../../types/company';

type RouteParams = {
  VerificationSubmit: {
    companyId: string;
  };
};

export const VerificationSubmitScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RouteParams, 'VerificationSubmit'>>();
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
        [{ text: 'OK', onPress: () => navigation.goBack() }]
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
    <SafeAreaView style={styles.container}>
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
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                (!gstDocument || !aadhaarDocument || isSubmitting) &&
                styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!gstDocument || !aadhaarDocument || isSubmitting}
              activeOpacity={0.7}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Submit for Verification</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              * Required fields. Your documents will be reviewed within 2-3 business days.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  headerBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0F0F0F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  backIcon: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: -2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
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
    color: '#B8B8B8',
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
    color: '#FFFFFF',
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#2A2A2A',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#FFFFFF',
    backgroundColor: '#1A1A1A',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3A3A3A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: '#1A1A1A',
    borderColor: '#2A2A2A',
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#6B6B6B',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 16,
  },
});
