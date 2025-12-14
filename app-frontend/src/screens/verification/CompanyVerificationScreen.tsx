import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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
      <LinearGradient
        colors={["#0F1115", "#101318", "#0F1115"]}
        locations={[0, 0.5, 1]}
        style={[styles.container, { paddingTop: insets.top }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={[styles.loadingText, { color: colors.muted }]}>Loading verification status...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!company) {
    return (
      <LinearGradient
        colors={["#0F1115", "#101318", "#0F1115"]}
        locations={[0, 0.5, 1]}
        style={[styles.container, { paddingTop: insets.top }]}
      >
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: "#FF6B6B" }]}>Company not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <LinearGradient
              colors={["#6C63FF", "#5248E6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>Go Back</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#0F1115", "#101318", "#0F1115"]}
      locations={[0, 0.5, 1]}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Indigo glow - top left */}
      <LinearGradient
        colors={["rgba(108, 99, 255, 0.12)", "rgba(108, 99, 255, 0.04)", "transparent"]}
        locations={[0, 0.4, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 0.7 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Salmon glow - bottom right */}
      <LinearGradient
        colors={["transparent", "rgba(255, 140, 60, 0.06)", "rgba(255, 140, 60, 0.1)"]}
        locations={[0, 0.6, 1]}
        start={{ x: 0.3, y: 0.3 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Company Verification</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: spacing.xl + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Company Info */}
        <View style={styles.companyCard}>
          <CompanyAvatar company={company} size={80} />
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{company.displayName}</Text>
            {company.legalName ? <Text style={styles.companyLegalName}>{company.legalName}</Text> : null}
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
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1115',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 15,
    backgroundColor: 'transparent',
  },
  headerBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  backIcon: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: -2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
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
    color: '#FF6B6B',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  companyCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(22, 24, 29, 0.8)',
  },
  companyInfo: {
    marginLeft: 16,
    flex: 1,
  },
  companyName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    color: '#FFFFFF',
  },
  companyLegalName: {
    fontSize: 14,
    marginBottom: 4,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  detailsCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(22, 24, 29, 0.8)',
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
    color: '#FFFFFF',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  detailValue: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
    color: '#FFFFFF',
  },
  documentsSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  documentsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#FFFFFF',
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.2)',
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
    color: '#FFFFFF',
  },
  documentMeta: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  infoBox: {
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#6C63FF',
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    color: '#FFFFFF',
  },
  infoText: {
    fontSize: 14,
    marginBottom: 8,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  infoBullet: {
    fontSize: 14,
    marginBottom: 4,
    color: '#FFFFFF',
  },
});
const Badge = ({ label, tone = "default" }: { label: string; tone?: "default" | "primary" | "success" | "warning" }) => {
  const { spacing } = useTheme();
  const palette = {
    default: { bg: "rgba(255, 255, 255, 0.1)", text: "#FFFFFF" },
    primary: { bg: "rgba(108, 99, 255, 0.2)", text: "#6C63FF" },
    success: { bg: "rgba(74, 222, 128, 0.15)", text: "#4ADE80" },
    warning: { bg: "rgba(255, 140, 60, 0.15)", text: "#FF8C3C" },
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
