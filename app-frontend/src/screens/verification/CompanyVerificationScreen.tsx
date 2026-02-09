import React, { useEffect, useMemo, useState } from "react";
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
  const styles = useMemo(() => createStyles(colors), [colors]);
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
        colors={[colors.surfaceCanvasStart, colors.surfaceCanvasMid, colors.surfaceCanvasEnd]}
        locations={[0, 0.5, 1]}
        style={[styles.container, { paddingTop: insets.top }]}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading verification status...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!company) {
    return (
      <LinearGradient
        colors={[colors.surfaceCanvasStart, colors.surfaceCanvasMid, colors.surfaceCanvasEnd]}
        locations={[0, 0.5, 1]}
        style={[styles.container, { paddingTop: insets.top }]}
      >
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Company not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
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
      colors={[colors.surfaceCanvasStart, colors.surfaceCanvasMid, colors.surfaceCanvasEnd]}
      locations={[0, 0.5, 1]}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Indigo glow - top left */}
      <LinearGradient
        colors={[colors.surfaceOverlayPrimary, colors.surfaceOverlaySecondary, "transparent"]}
        locations={[0, 0.4, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 0.7 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Salmon glow - bottom right */}
      <LinearGradient
        colors={["transparent", colors.surfaceOverlayAccent, colors.surfaceOverlayPrimary]}
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

const createStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 15,
      backgroundColor: "transparent",
    },
    headerBackButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surfaceElevated,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    backIcon: {
      fontSize: 26,
      fontWeight: "700",
      color: colors.text,
      marginLeft: -2,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: -0.5,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: colors.textMuted,
    },
    errorContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    errorText: {
      fontSize: 16,
      marginBottom: 16,
      color: colors.error,
    },
    backButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
    },
    backButtonText: {
      color: colors.textOnPrimary,
      fontSize: 16,
      fontWeight: "700",
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
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    companyInfo: {
      marginLeft: 16,
      flex: 1,
    },
    companyName: {
      fontSize: 20,
      fontWeight: "700",
      marginBottom: 4,
      color: colors.text,
    },
    companyLegalName: {
      fontSize: 14,
      marginBottom: 4,
      color: colors.textMuted,
    },
    detailsCard: {
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    detailsTitle: {
      fontSize: 16,
      fontWeight: "700",
      marginBottom: 16,
      color: colors.text,
    },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    detailLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textMuted,
    },
    detailValue: {
      fontSize: 14,
      flex: 1,
      textAlign: "right",
      color: colors.text,
    },
    documentsSection: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    documentsTitle: {
      fontSize: 14,
      fontWeight: "600",
      marginBottom: 12,
      color: colors.text,
    },
    documentItem: {
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      backgroundColor: colors.badgePrimary,
      borderWidth: 1,
      borderColor: colors.primary + "44",
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
      fontWeight: "600",
      marginBottom: 2,
      color: colors.text,
    },
    documentMeta: {
      fontSize: 12,
      color: colors.textMuted,
    },
    infoBox: {
      borderRadius: 12,
      padding: 16,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      backgroundColor: colors.badgeInfo,
    },
    infoTitle: {
      fontSize: 14,
      fontWeight: "700",
      marginBottom: 8,
      color: colors.text,
    },
    infoText: {
      fontSize: 14,
      marginBottom: 8,
      color: colors.textMuted,
    },
    infoBullet: {
      fontSize: 14,
      marginBottom: 4,
      color: colors.text,
    },
  });
const Badge = ({ label, tone = "default" }: { label: string; tone?: "default" | "primary" | "success" | "warning" }) => {
  const { spacing, colors } = useTheme();
  const palette = {
    default: { bg: colors.badgeNeutral, text: colors.text },
    primary: { bg: colors.badgePrimary, text: colors.primary },
    success: { bg: colors.badgeSuccess, text: colors.success },
    warning: { bg: colors.badgeWarning, text: colors.warning },
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
