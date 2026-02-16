import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

type DocumentType = 'gstCertificate' | 'aadhaarCard';

export type PickedDocument = {
  fileName: string;
  mimeType: string;
  uri: string;
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

  const requestCameraPermission = async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera access in your device settings to capture documents.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const captureFromCamera = async () => {
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return;

      setIsLoading(true);

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled) {
        setIsLoading(false);
        return;
      }

      const image = result.assets[0];
      const fileName = `${type}_${Date.now()}.jpg`;

      const pickedDoc: PickedDocument = {
        fileName,
        mimeType: 'image/jpeg',
        uri: image.uri,
        size: image.fileSize || 0,
      };

      onDocumentPicked(pickedDoc);
      setIsLoading(false);
    } catch (error) {
      console.error('Camera capture error:', error);
      Alert.alert('Error', 'Failed to capture image');
      setIsLoading(false);
    }
  };

  const pickFromGallery = async () => {
    try {
      setIsLoading(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled) {
        setIsLoading(false);
        return;
      }

      const image = result.assets[0];
      const fileName = image.fileName || `${type}_${Date.now()}.jpg`;

      // Check file size (max 5MB)
      if (image.fileSize && image.fileSize > 5 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Please select an image smaller than 5MB');
        setIsLoading(false);
        return;
      }

      const pickedDoc: PickedDocument = {
        fileName,
        mimeType: image.mimeType || 'image/jpeg',
        uri: image.uri,
        size: image.fileSize || 0,
      };

      onDocumentPicked(pickedDoc);
      setIsLoading(false);
    } catch (error) {
      console.error('Gallery picking error:', error);
      Alert.alert('Error', 'Failed to pick image');
      setIsLoading(false);
    }
  };

  const pickDocument = async () => {
    try {
      setIsLoading(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
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

      const pickedDoc: PickedDocument = {
        fileName: file.name,
        mimeType: file.mimeType || 'application/pdf',
        uri: file.uri,
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

  const showOptions = () => {
    // Simple picker to match profile upload flow (image or PDF)
    pickDocument().catch(() => setIsLoading(false));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        style={[
          styles.uploadButton,
          pickedDocument && styles.uploadButtonSuccess,
        ]}
        onPress={showOptions}
        disabled={isLoading}
      >
        {pickedDocument ? (
          <View style={styles.uploadedContent}>
            <Text style={styles.checkmark}>✓</Text>
            <Text style={styles.uploadButtonTextSuccess} numberOfLines={1} ellipsizeMode="clip" adjustsFontSizeToFit minimumFontScale={0.72}>
              {pickedDocument.fileName}
            </Text>
          </View>
        ) : (
          <View style={styles.uploadContent}>
            <Text style={styles.uploadIcon}>📄</Text>
            <Text style={styles.uploadButtonText}>
              {isLoading ? 'Loading...' : 'Tap to upload'}
            </Text>
            <Text style={styles.uploadHint}>Camera, Gallery, or PDF</Text>
          </View>
        )}
      </TouchableOpacity>

      {pickedDocument && (
        <View style={styles.fileInfoRow}>
          <Text style={styles.fileInfo}>
            Size: {(pickedDocument.size / 1024).toFixed(2)} KB
          </Text>
          <TouchableOpacity onPress={showOptions}>
            <Text style={styles.changeButton}>Change</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  uploadButton: {
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(22, 24, 29, 0.9)',
  },
  uploadButtonSuccess: {
    borderColor: '#10B981',
    borderStyle: 'solid',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  uploadContent: {
    alignItems: 'center',
  },
  uploadedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  checkmark: {
    fontSize: 18,
    color: '#10B981',
    fontWeight: '700',
    marginRight: 8,
  },
  uploadButtonText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  uploadButtonTextSuccess: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    maxWidth: 200,
  },
  uploadHint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 4,
  },
  fileInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  fileInfo: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  changeButton: {
    fontSize: 12,
    color: '#6C63FF',
    fontWeight: '600',
  },
});
