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

      const payload: SubmitVerificationPayload = {
        gstCertificate: {
          fileName: gstDocument.fileName,
          mimeType: gstDocument.mimeType,
          content: gstDocument.base64,
        },
        aadhaarCard: {
          fileName: aadhaarDocument.fileName,
          mimeType: aadhaarDocument.mimeType,
          content: aadhaarDocument.base64,
        },
        notes: notes.trim() || undefined,
      };

      await verificationService.submitVerification(companyId, payload);

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
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Company Verification</Text>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },
  notesContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#11A440',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disclaimer: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
