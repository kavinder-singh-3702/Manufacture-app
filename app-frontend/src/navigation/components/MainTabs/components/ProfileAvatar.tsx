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
      return '#F59E0B'; 
    case 'submitted':
      return '#3B82F6';
    case 'approved':
      return '#11A440'; 
    case 'rejected':
      return '#DC2626'; 
    default:
      return '#9CA3AF'; 
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
    backgroundColor: '#fff',
  },
  image: {
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#6B7280',
  },
  badge: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#11A440',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
