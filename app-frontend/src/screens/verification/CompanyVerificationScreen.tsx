import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { CompanyAvatar } from '../../navigation/components/MainTabs/components/ProfileAvatar';
import { VerificationStatusCard } from '../../components/company/VerificationStatusCard';
import { verificationService } from '../../services/verificationService';
import { Company, VerificationRequest } from '../../types/company';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CompanyVerification'>;
type RouteParams = RouteProp<RootStackParamList, 'CompanyVerification'>;

export const CompanyVerificationScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const { companyId } = route.params;

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
    } catch (error: any) {
      console.error('Failed to load verification status:', error);
      Alert.alert('Error', 'Failed to load verification status');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPress = () => {
    if (company) {
      navigation.navigate('VerificationSubmit', { companyId: company.id });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#11A440" />
          <Text style={styles.loadingText}>Loading verification status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!company) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Company not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Company Verification</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Company Info */}
        <View style={styles.companyCard}>
          <CompanyAvatar company={company} size={80} />
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{company.displayName}</Text>
            {company.legalName && (
              <Text style={styles.companyLegalName}>{company.legalName}</Text>
            )}
            <Text style={styles.companyType}>
              {company.type.charAt(0).toUpperCase() + company.type.slice(1)}
            </Text>
          </View>
        </View>

        {/* Verification Status Card */}
        <VerificationStatusCard
          company={company}
          request={request}
          onVerifyPress={handleVerifyPress}
        />

        {/* Request Details (if exists) */}
        {request && (
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Request Details</Text>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Request ID:</Text>
              <Text style={styles.detailValue}>{request.id}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Submitted:</Text>
              <Text style={styles.detailValue}>
                {new Date(request.createdAt).toLocaleDateString()}
              </Text>
            </View>

            {request.decidedBy && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reviewed By:</Text>
                  <Text style={styles.detailValue}>
                    {request.decidedBy.displayName}
                  </Text>
                </View>

                {request.decidedAt && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Reviewed On:</Text>
                    <Text style={styles.detailValue}>
                      {new Date(request.decidedAt).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </>
            )}

            {request.notes && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Notes:</Text>
                <Text style={styles.detailValue}>{request.notes}</Text>
              </View>
            )}

            {/* Documents */}
            {(request.documents.gstCertificate || request.documents.aadhaarCard) && (
              <View style={styles.documentsSection}>
                <Text style={styles.documentsTitle}>Submitted Documents</Text>

                {request.documents.gstCertificate && (
                  <View style={styles.documentItem}>
                    <Text style={styles.documentIcon}>📄</Text>
                    <View style={styles.documentInfo}>
                      <Text style={styles.documentName}>
                        {request.documents.gstCertificate.fileName}
                      </Text>
                      <Text style={styles.documentMeta}>
                        GST Certificate • {(request.documents.gstCertificate.size / 1024).toFixed(2)} KB
                      </Text>
                    </View>
                  </View>
                )}

                {request.documents.aadhaarCard && (
                  <View style={styles.documentItem}>
                    <Text style={styles.documentIcon}>📄</Text>
                    <View style={styles.documentInfo}>
                      <Text style={styles.documentName}>
                        {request.documents.aadhaarCard.fileName}
                      </Text>
                      <Text style={styles.documentMeta}>
                        Aadhaar Card • {(request.documents.aadhaarCard.size / 1024).toFixed(2)} KB
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Information Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>About Verification</Text>
          <Text style={styles.infoText}>
            Company verification helps build trust in the marketplace. Verified companies get:
          </Text>
          <Text style={styles.infoBullet}>• Green verified badge on profile</Text>
          <Text style={styles.infoBullet}>• Access to premium features</Text>
          <Text style={styles.infoBullet}>• Higher visibility in search results</Text>
          <Text style={styles.infoBullet}>• Increased trust from partners</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  backIcon: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#11A440',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  companyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  companyInfo: {
    marginLeft: 16,
    flex: 1,
  },
  companyName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  companyLegalName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  companyType: {
    fontSize: 12,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    flex: 1,
    textAlign: 'right',
  },
  documentsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  documentsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  documentIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  documentMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  infoBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1E3A8A',
    marginBottom: 8,
  },
  infoBullet: {
    fontSize: 14,
    color: '#1E3A8A',
    marginBottom: 4,
  },
});
