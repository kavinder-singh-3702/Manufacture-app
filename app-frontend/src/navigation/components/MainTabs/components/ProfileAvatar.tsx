import React from "react";
import { View, Image, StyleSheet, ViewStyle, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Company, ComplianceStatus } from "../../../../types/company";
import { useTheme } from "../../../../hooks/useTheme";

type Props = {
  company: Company;
  size?: number;
  style?: ViewStyle;
};

const requiresVerification = (type: Company["type"]): boolean => {
  return type === "manufacturer" || type === "trader";
};

const getStatusColor = (status: Company["complianceStatus"], colors: ReturnType<typeof useTheme>["colors"]): string => {
  switch (status) {
    case "pending":
    case "submitted":
      return colors.warning;
    case "approved":
      return colors.success;
    case "rejected":
      return colors.error;
    default:
      return colors.border;
  }
};

export const CompanyAvatar: React.FC<Props> = ({
  company,
  size = 80,
  style,
}) => {
  const { colors, nativeGradients } = useTheme();
  const borderColor = getStatusColor(company.complianceStatus, colors);
  const badgeSize = Math.max(20, size * 0.3);
  const isVerified = company.complianceStatus === "approved";
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
          backgroundColor: colors.surface,
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
              backgroundColor: colors.surfaceElevated,
            },
          ]}
        >
          <Text style={[styles.placeholderText, { fontSize: size * 0.4, color: colors.textMuted }]}>
            {company.displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}

      {isVerified && (
        <LinearGradient
          colors={nativeGradients.ctaPrimary}
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
              borderColor: colors.surface,
              shadowColor: colors.primary,
            },
          ]}
        >
          <Text style={[styles.verifiedBadgeText, { fontSize: badgeSize * 0.6, color: colors.textOnPrimary }]}>✓</Text>
        </LinearGradient>
      )}

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
              backgroundColor: colors.error,
              borderColor: colors.surface,
              shadowColor: colors.error,
            },
          ]}
        >
          <Text style={[styles.alertBadgeText, { fontSize: badgeSize * 0.6, color: colors.textOnAccent }]}>!</Text>
        </View>
      )}
    </View>
  );
};

type CompactBadgeProps = {
  complianceStatus?: ComplianceStatus;
  companyType?: Company["type"];
  size?: number;
};

export const VerificationBadge: React.FC<CompactBadgeProps> = ({
  complianceStatus,
  companyType,
  size = 16,
}) => {
  const { colors, nativeGradients } = useTheme();
  const isVerified = complianceStatus === "approved";
  const needsVerification = (companyType === "manufacturer" || companyType === "trader") && !isVerified;

  if (isVerified) {
    return (
      <LinearGradient
        colors={nativeGradients.ctaPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.compactVerifiedBadge,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            shadowColor: colors.primary,
          },
        ]}
      >
        <Text style={[styles.verifiedBadgeText, { fontSize: size * 0.6, color: colors.textOnPrimary }]}>✓</Text>
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
            backgroundColor: colors.error,
            shadowColor: colors.error,
          },
        ]}
      >
        <Text style={[styles.alertBadgeText, { fontSize: size * 0.6, color: colors.textOnAccent }]}>!</Text>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    resizeMode: "cover",
  },
  placeholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontWeight: "600",
  },
  verifiedBadge: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  verifiedBadgeText: {
    fontWeight: "bold",
  },
  alertBadge: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  alertBadgeText: {
    fontWeight: "bold",
  },
  compactVerifiedBadge: {
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  compactAlertBadge: {
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
});
