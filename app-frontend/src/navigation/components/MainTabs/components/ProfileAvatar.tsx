import React from 'react';
import { View, Image, StyleSheet, ViewStyle, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Company, ComplianceStatus } from '../../../../types/company';

type Props = {
  company: Company;
  size?: number;
  style?: ViewStyle;
};

const getStatusColor = (status: Company['complianceStatus']): string => {
  switch (status) {
    case 'pending':
      return '#F5D47E'; // Soft yellow ring for not verified
    case 'submitted':
      return '#F5D47E'; // Soft yellow ring for pending verification
    case 'approved':
      return '#6BCF7F'; // Soft green ring for verified
    case 'rejected':
      return '#EF6B6B'; // Soft red ring for rejected
    default:
      return '#B8B8B8'; // Gray ring as default
  }
};

// Check if company type requires verification
const requiresVerification = (type: Company['type']): boolean => {
  return type === 'manufacturer' || type === 'trader';
};

export const CompanyAvatar: React.FC<Props> = ({
  company,
  size = 80,
  style
}) => {
  const borderColor = getStatusColor(company.complianceStatus);
  const badgeSize = Math.max(20, size * 0.3);
  const isVerified = company.complianceStatus === 'approved';
  const needsVerification = requiresVerification(company.type) && !isVerified;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor,
        },
        style,
      ]}
    >
      {company.logoUrl ? (
        <Image
          source={{ uri: company.logoUrl }}
          style={[
            styles.image,
            {
              width: size - 8,
              height: size - 8,
              borderRadius: (size - 8) / 2,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            {
              width: size - 8,
              height: size - 8,
              borderRadius: (size - 8) / 2,
            },
          ]}
        >
          <Text style={[styles.placeholderText, { fontSize: size * 0.4 }]}>
            {company.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      {/* Verified Badge - Instagram style blue tick */}
      {isVerified && (
        <LinearGradient
          colors={['#6C63FF', '#4AC9FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.verifiedBadge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              bottom: 0,
              right: 0,
            },
          ]}
        >
          <Text style={[styles.verifiedBadgeText, { fontSize: badgeSize * 0.6 }]}>✓</Text>
        </LinearGradient>
      )}

      {/* Alert Badge - Red warning for unverified manufacturer/trader */}
      {needsVerification && (
        <View
          style={[
            styles.alertBadge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              bottom: 0,
              right: 0,
            },
          ]}
        >
          <Text style={[styles.alertBadgeText, { fontSize: badgeSize * 0.6 }]}>!</Text>
        </View>
      )}
    </View>
  );
};

// Compact badge component for smaller UI elements (like footer pills)
type CompactBadgeProps = {
  complianceStatus?: ComplianceStatus;
  companyType?: Company['type'];
  size?: number;
};

export const VerificationBadge: React.FC<CompactBadgeProps> = ({
  complianceStatus,
  companyType,
  size = 16,
}) => {
  const isVerified = complianceStatus === 'approved';
  const needsVerification = (companyType === 'manufacturer' || companyType === 'trader') && !isVerified;

  if (isVerified) {
    return (
      <LinearGradient
        colors={['#6C63FF', '#4AC9FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.compactVerifiedBadge,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <Text style={[styles.verifiedBadgeText, { fontSize: size * 0.6 }]}>✓</Text>
      </LinearGradient>
    );
  }

  if (needsVerification) {
    return (
      <View
        style={[
          styles.compactAlertBadge,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
      >
        <Text style={[styles.alertBadgeText, { fontSize: size * 0.6 }]}>!</Text>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontWeight: '600',
    color: '#B8B8B8',
  },
  verifiedBadge: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1A1A1A',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  verifiedBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  alertBadge: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#1A1A1A',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  alertBadgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  compactVerifiedBadge: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  compactAlertBadge: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
});
