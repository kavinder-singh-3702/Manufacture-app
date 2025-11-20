import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { CompanyAvatar } from '../../navigation/components/MainTabs/components/ProfileAvatar';
import { verificationService } from '../../services/verificationService';
import { Company, VerificationRequest } from '../../types/company';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Props = {
  companyId: string;
};

const getStatusMessage = (status: Company['complianceStatus']) => {
  switch (status) {
    case 'pending':
      return {
        title: 'Verify Your Company',
        message: 'Get verified to unlock premium features and build trust',
        action: 'Start Verification',
        showAction: true,
      };
    case 'submitted':
      return {
        title: 'Verification In Progress',
        message: 'Your documents are being reviewed by our team',
        action: 'View Status',
        showAction: true,
      };
    case 'approved':
      return {
        title: 'Company Verified',
        message: 'You have access to all premium features',
        action: 'View Details',
        showAction: false,
      };
    case 'rejected':
      return {
        title: 'Verification Rejected',
        message: 'Please resubmit your documents',
        action: 'Resubmit',
        showAction: true,
      };
    default:
      return {
        title: 'Company Status',
        message: 'Manage your company verification',
        action: 'View',
        showAction: true,
      };
  }
};

export const CompanyVerificationWidget: React.FC<Props> = ({ companyId }) => {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState<Company | null>(null);
  const [request, setRequest] = useState<VerificationRequest | null>(null);

  useEffect(() => {
    loadVerificationStatus();
  }, [companyId]);

  const loadVerificationStatus = async () => {
    try {
      setLoading(true);
      const response = await verificationService.getVerificationStatus(companyId);
      setCompany(response.company);
      setRequest(response.request);
    } catch (error) {
      console.error('Failed to load verification status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = () => {
    navigation.navigate('CompanyVerification', { companyId });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#11A440" />
      </View>
    );
  }

  if (!company) {
    return null;
  }

  const statusInfo = getStatusMessage(company.complianceStatus);

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.content}>
        <CompanyAvatar company={company} size={60} />

        <View style={styles.info}>
          <Text style={styles.companyName} numberOfLines={1}>
            {company.displayName}
          </Text>
          <Text style={styles.title}>{statusInfo.title}</Text>
          <Text style={styles.message} numberOfLines={2}>
            {statusInfo.message}
          </Text>
        </View>
      </View>

      {statusInfo.showAction && (
        <View style={styles.actionButton}>
          <Text style={styles.actionText}>{statusInfo.action}</Text>
          <Text style={styles.arrow}>›</Text>
        </View>
      )}

      {company.complianceStatus === 'approved' && (
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>✓ Verified</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginVertical: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  info: {
    flex: 1,
    marginLeft: 16,
  },
  companyName: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#11A440',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  actionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  arrow: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  verifiedBadge: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#11A440',
  },
  verifiedText: {
    color: '#11A440',
    fontSize: 14,
    fontWeight: '600',
  },
});
