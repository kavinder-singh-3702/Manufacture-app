import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import { CompanyAvatar } from "../../navigation/components/MainTabs/components/ProfileAvatar";
import { VerificationStatusCard } from "../../components/company/VerificationStatusCard";
import { verificationService } from "../../services/verificationService";
import { Company, VerificationRequest } from "../../types/company";
import { useTheme } from "../../hooks/useTheme";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CompanyVerification'>;
type RouteParams = RouteProp<RootStackParamList, 'CompanyVerification'>;

export const CompanyVerificationScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteParams>();
  const { companyId } = route.params;
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();

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
    if (!company?.id) return;
    // Open the document upload screen for this company
    navigation.navigate("VerificationSubmit", { companyId: company.id });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Loading verification status...</Text>
        </View>
      </View>
    );
  }

  if (!company) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>Company not found</Text>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.primary }]} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[styles.headerBackButton, { backgroundColor: colors.surfaceElevated }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.backIcon, { color: colors.text }]}>‹</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Company Verification</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.content, { paddingBottom: spacing.xl + insets.bottom }]}>
        {/* Company Info */}
        <View
          style={[
            styles.companyCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              shadowColor: "transparent",
            },
          ]}
        >
          <CompanyAvatar company={company} size={80} />
          <View style={styles.companyInfo}>
            <Text style={[styles.companyName, { color: colors.text }]}>{company.displayName}</Text>
            {company.legalName ? <Text style={[styles.companyLegalName, { color: colors.muted }]}>{company.legalName}</Text> : null}
            <View style={{ flexDirection: "row", marginTop: 6 }}>
              <Badge label={company.type} tone="primary" />
              <Badge label={company.complianceStatus ?? "pending"} tone={company.complianceStatus === "approved" ? "success" : "warning"} />
            </View>
          </View>
        </View>

        {/* Verification Status Card */}
        <VerificationStatusCard company={company} request={request} onVerifyPress={handleVerifyPress} />

        {/* Request Details (if exists) */}
        {request && (
          <View style={styles.detailsCard}>
            <Text style={[styles.detailsTitle, { color: colors.text }]}>Request Details</Text>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.muted }]}>Request ID:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{request.id}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.muted }]}>Submitted:</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {new Date(request.createdAt).toLocaleDateString()}
              </Text>
            </View>

            {request.decidedBy && (
              <>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.muted }]}>Reviewed By:</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {request.decidedBy.displayName}
                  </Text>
                </View>

                {request.decidedAt && (
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.muted }]}>Reviewed On:</Text>
                    <Text style={[styles.detailValue, { color: colors.text }]}>
                      {new Date(request.decidedAt).toLocaleDateString()}
                    </Text>
                  </View>
                )}
              </>
            )}

            {request.notes && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.muted }]}>Notes:</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{request.notes}</Text>
              </View>
            )}

            {/* Documents */}
            {(request.documents.gstCertificate || request.documents.aadhaarCard) && (
              <View style={styles.documentsSection}>
                <Text style={[styles.documentsTitle, { color: colors.text }]}>Submitted Documents</Text>

                {request.documents.gstCertificate && (
                  <View style={[styles.documentItem, { backgroundColor: colors.surfaceElevated }]}>
                    <Text style={styles.documentIcon}>📄</Text>
                    <View style={styles.documentInfo}>
                      <Text style={[styles.documentName, { color: colors.text }]}>
                        {request.documents.gstCertificate.fileName}
                      </Text>
                      <Text style={[styles.documentMeta, { color: colors.muted }]}>
                        GST Certificate • {(request.documents.gstCertificate.size / 1024).toFixed(2)} KB
                      </Text>
                    </View>
                  </View>
                )}

                {request.documents.aadhaarCard && (
                  <View style={[styles.documentItem, { backgroundColor: colors.surfaceElevated }]}>
                    <Text style={styles.documentIcon}>📄</Text>
                    <View style={styles.documentInfo}>
                      <Text style={[styles.documentName, { color: colors.text }]}>
                        {request.documents.aadhaarCard.fileName}
                      </Text>
                      <Text style={[styles.documentMeta, { color: colors.muted }]}>
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
        <View style={[styles.infoBox, { backgroundColor: colors.surfaceElevated, borderLeftColor: colors.primary }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>About Verification</Text>
          <Text style={[styles.infoText, { color: colors.muted }]}>
            Company verification helps build trust in the marketplace. Verified companies get:
          </Text>
          <Text style={[styles.infoBullet, { color: colors.text }]}>• Green verified badge on profile</Text>
          <Text style={[styles.infoBullet, { color: colors.text }]}>• Access to premium features</Text>
          <Text style={[styles.infoBullet, { color: colors.text }]}>• Higher visibility in search results</Text>
          <Text style={[styles.infoBullet, { color: colors.text }]}>• Increased trust from partners</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
  },
  backButton: {
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
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  companyInfo: {
    marginLeft: 16,
    flex: 1,
  },
  companyName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  companyLegalName: {
    fontSize: 14,
    marginBottom: 4,
  },
  detailsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  documentsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  documentsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginBottom: 2,
  },
  documentMeta: {
    fontSize: 12,
  },
  infoBox: {
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
  },
  infoBullet: {
    fontSize: 14,
    marginBottom: 4,
  },
});
const Badge = ({ label, tone = "default" }: { label: string; tone?: "default" | "primary" | "success" | "warning" }) => {
  const { colors, spacing } = useTheme();
  const palette = {
    default: { bg: colors.surfaceElevated, text: colors.text },
    primary: { bg: "rgba(59, 130, 246, 0.12)", text: "#1D4ED8" },
    success: { bg: "rgba(16, 185, 129, 0.12)", text: "#059669" },
    warning: { bg: "rgba(234, 179, 8, 0.15)", text: "#92400E" },
  }[tone];

  return (
    <View
      style={{
        paddingHorizontal: spacing.sm,
        paddingVertical: spacing.xs,
        borderRadius: 999,
        backgroundColor: palette.bg,
        marginRight: spacing.xs,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: "700", color: palette.text, textTransform: "capitalize" }}>{label}</Text>
    </View>
  );
};
