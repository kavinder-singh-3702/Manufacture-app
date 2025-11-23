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
        color: '#F59E0B',
        message: 'Get verified to unlock all features',
        action: 'Start Verification',
      };
    case 'submitted':
      return {
        label: 'Request sent',
        color: '#3B82F6',
        message: 'We received your documents. Our team is reviewing them shortly.',
        action: null,
      };
    case 'approved':
      return {
        label: 'Verified',
        color: '#11A440',
        message: 'Your company is verified',
        action: null,
      };
    case 'rejected':
      return {
        label: 'Verification Rejected',
        color: '#DC2626',
        message: 'Please resubmit with correct documents',
        action: 'Resubmit',
      };
    default:
      return {
        label: 'Unknown',
        color: '#9CA3AF',
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    color: '#111827',
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  rejectionBox: {
    backgroundColor: '#FEE2E2',
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  rejectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 14,
    color: '#991B1B',
  },
  button: {
    backgroundColor: '#11A440',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
