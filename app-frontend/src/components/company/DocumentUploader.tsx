import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';

type DocumentType = 'gstCertificate' | 'aadhaarCard';

export type PickedDocument = {
  fileName: string;
  mimeType: string;
  base64: string;
  size: number;
};

type Props = {
  type: DocumentType;
  label: string;
  onDocumentPicked: (doc: PickedDocument) => void;
  pickedDocument?: PickedDocument;
};

export const DocumentUploader: React.FC<Props> = ({
  type,
  label,
  onDocumentPicked,
  pickedDocument,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const pickDocument = async () => {
    try {
      setIsLoading(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setIsLoading(false);
        return;
      }

      const file = result.assets[0];

      // Check file size (max 5MB)
      if (file.size && file.size > 5 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Please select a file smaller than 5MB');
        setIsLoading(false);
        return;
      }

      // Convert to base64
      const base64 = await FileSystem.readAsStringAsync(file.uri, {
        encoding: 'base64',
      });

      const pickedDoc: PickedDocument = {
        fileName: file.name,
        mimeType: file.mimeType || 'application/octet-stream',
        base64,
        size: file.size || 0,
      };

      onDocumentPicked(pickedDoc);
      setIsLoading(false);
    } catch (error) {
      console.error('Document picking error:', error);
      Alert.alert('Error', 'Failed to pick document');
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        style={[
          styles.uploadButton,
          pickedDocument && styles.uploadButtonSuccess,
        ]}
        onPress={pickDocument}
        disabled={isLoading}
      >
        <Text style={styles.uploadButtonText}>
          {isLoading
            ? 'Loading...'
            : pickedDocument
            ? `✓ ${pickedDocument.fileName}`
            : 'Choose File'}
        </Text>
      </TouchableOpacity>

      {pickedDocument && (
        <Text style={styles.fileInfo}>
          Size: {(pickedDocument.size / 1024).toFixed(2)} KB
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  uploadButton: {
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  uploadButtonSuccess: {
    borderColor: '#11A440',
    backgroundColor: '#F0FDF4',
  },
  uploadButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  fileInfo: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
