import React from 'react';
import { View, Image, StyleSheet, ViewStyle, Text } from 'react-native';
import { Company } from '../../../../types/company';


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

export const CompanyAvatar: React.FC<Props> = ({
  company,
  size = 80,
  style
}) => {
  const borderColor = getStatusColor(company.complianceStatus);

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
          <Text style={styles.placeholderText}>
            {company.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      {/* Verified Badge */}
      {company.complianceStatus === 'approved' && (
        <View style={[styles.badge, { bottom: 0, right: 0 }]}>
          <Text style={styles.badgeText}>✓</Text>
        </View>
      )}
    </View>
  );
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
    fontSize: 32,
    fontWeight: '600',
    color: '#B8B8B8',
  },
  badge: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#6BCF7F',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  badgeText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
