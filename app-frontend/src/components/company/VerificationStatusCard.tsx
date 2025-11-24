import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Company, VerificationRequest } from '../../types/company';

type Props = {
  company: Company;
  request?: VerificationRequest | null;
  onVerifyPress?: () => void;
};

const getStatusInfo = (status: Company['complianceStatus']) => {
  switch (status) {
    case 'pending':
      return {
        label: 'Not Verified',
        color: '#F5D47E', // Soft yellow for pending
        message: 'Get verified to unlock all features',
        action: 'Start Verification',
      };
    case 'submitted':
      return {
        label: 'Request sent',
        color: '#F5D47E', // Soft yellow for pending verification
        message: 'We received your documents. Our team is reviewing them shortly.',
        action: null,
      };
    case 'approved':
      return {
        label: 'Verified',
        color: '#6BCF7F', // Soft green for verified
        message: 'Your company is verified',
        action: null,
      };
    case 'rejected':
      return {
        label: 'Verification Rejected',
        color: '#EF6B6B', // Soft red for rejected
        message: 'Please resubmit with correct documents',
        action: 'Resubmit',
      };
    default:
      return {
        label: 'Unknown',
        color: '#6B6B6B',
        message: '',
        action: null,
      };
  }
};

export const VerificationStatusCard: React.FC<Props> = ({
  company,
  request,
  onVerifyPress,
}) => {
  const statusInfo = getStatusInfo(company.complianceStatus);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.indicator, { backgroundColor: statusInfo.color }]} />
        <Text style={styles.label}>{statusInfo.label}</Text>
      </View>

      <Text style={styles.message}>{statusInfo.message}</Text>

      {request?.rejectionReason && (
        <View style={styles.rejectionBox}>
          <Text style={styles.rejectionLabel}>Rejection Reason:</Text>
          <Text style={styles.rejectionText}>{request.rejectionReason}</Text>
        </View>
      )}

      {statusInfo.action && onVerifyPress && (
        <TouchableOpacity style={styles.button} onPress={onVerifyPress}>
          <Text style={styles.buttonText}>{statusInfo.action}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    padding: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  indicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  message: {
    fontSize: 14,
    color: '#B8B8B8',
    marginBottom: 12,
  },
  rejectionBox: {
    backgroundColor: '#1A1A1A',
    borderLeftWidth: 4,
    borderLeftColor: '#EF6B6B',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  rejectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF6B6B',
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  button: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
});
