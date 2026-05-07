import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../hooks/useTheme";
import { useThemeMode } from "../../hooks/useThemeMode";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import {
  productInquiryService,
  ProductInquiry,
  InquiryStatus,
  UpdateInquiryStatusPayload,
} from "../../services/productInquiry.service";
import { RootStackParamList } from "../../navigation/types";

const STATUS_LABELS: Record<InquiryStatus, string> = {
  pending: "Pending",
  seen: "Seen",
  responded: "Responded",
  closed: "Closed",
};

const useInquiriesPalette = () => {
  const { colors } = useTheme();
  const { resolvedMode } = useThemeMode();
  return useMemo(
    () => ({
      background: colors.background,
      surface: resolvedMode === "dark" ? "rgba(22,22,30,0.9)" : colors.surface,
      surfaceLight: resolvedMode === "dark" ? "rgba(32,32,42,0.8)" : colors.surfaceElevated,
      border: resolvedMode === "dark" ? "rgba(255,255,255,0.08)" : colors.border,
      borderLight: resolvedMode === "dark" ? "rgba(255,255,255,0.12)" : colors.borderLight,
      text: colors.text,
      textMuted: colors.textMuted,
      textSubtle: colors.textSecondary,
      accent: colors.primary,
      accentMuted: colors.badgePrimary,
      success: colors.success,
      successMuted: colors.badgeSuccess,
      warning: colors.warning,
      warningMuted: colors.badgeWarning,
      error: colors.error,
    }),
    [colors, resolvedMode]
  );
};

const formatRelativeTime = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const statusColor = (
  status: InquiryStatus,
  COLORS: ReturnType<typeof useInquiriesPalette>
): { bg: string; text: string } => {
  switch (status) {
    case "pending":  return { bg: COLORS.warningMuted, text: COLORS.warning };
    case "seen":     return { bg: COLORS.accentMuted,  text: COLORS.accent   };
    case "responded":return { bg: COLORS.successMuted, text: COLORS.success  };
    case "closed":   return { bg: COLORS.surfaceLight, text: COLORS.textMuted };
  }
};

const PAGE_SIZE = 20;

export const AdminProductInquiriesScreen = () => {
  const COLORS = useInquiriesPalette();
  const styles = useMemo(() => createStyles(COLORS), [COLORS]);
  const { colors, spacing, radius } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isXCompact } = useResponsiveLayout();

  const [inquiries, setInquiries] = useState<ProductInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ total: 0, limit: PAGE_SIZE, offset: 0, hasMore: false });

  const [filterStatus, setFilterStatus] = useState<InquiryStatus | "all">("all");

  // Detail / status update sheet
  const [selectedInquiry, setSelectedInquiry] = useState<ProductInquiry | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [newStatus, setNewStatus] = useState<InquiryStatus>("seen");
  const [adminNotes, setAdminNotes] = useState("");
  const [updating, setUpdating] = useState(false);

  const loadInquiries = useCallback(async (offset = 0, append = false) => {
    if (append) { setLoadingMore(true); } else { setLoading(true); setError(null); }
    try {
      const params: any = { limit: PAGE_SIZE, offset };
      if (filterStatus !== "all") params.status = filterStatus;
      const res = await productInquiryService.adminList(params);
      setInquiries((prev) => append ? [...prev, ...res.inquiries] : res.inquiries);
      setPagination(res.pagination);
    } catch (err: any) {
      setError(err?.message || "Failed to load inquiries");
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [filterStatus]);

  useFocusEffect(
    useCallback(() => {
      loadInquiries(0, false);
    }, [loadInquiries])
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadInquiries(0, false);
  }, [loadInquiries]);

  const handleLoadMore = useCallback(() => {
    if (loading || loadingMore || !pagination.hasMore) return;
    loadInquiries(pagination.offset + pagination.limit, true);
  }, [loading, loadingMore, pagination, loadInquiries]);

  const openDetail = useCallback((inquiry: ProductInquiry) => {
    setSelectedInquiry(inquiry);
    setNewStatus(inquiry.status === "pending" ? "seen" : inquiry.status);
    setAdminNotes(inquiry.adminNotes || "");
    setDetailVisible(true);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailVisible(false);
    setSelectedInquiry(null);
  }, []);

  const handleUpdateStatus = useCallback(async () => {
    if (!selectedInquiry) return;
    try {
      setUpdating(true);
      const payload: UpdateInquiryStatusPayload = { status: newStatus };
      if (adminNotes.trim()) payload.adminNotes = adminNotes.trim();
      const updated = await productInquiryService.adminUpdateStatus(selectedInquiry._id, payload);
      setInquiries((prev) => prev.map((item) => item._id === updated._id ? updated : item));
      closeDetail();
    } catch (err: any) {
      // silently keep modal open on error
    } finally {
      setUpdating(false);
    }
  }, [selectedInquiry, newStatus, adminNotes, closeDetail]);

  const renderInquiryCard = useCallback(({ item }: { item: ProductInquiry }) => {
    const sc = statusColor(item.status, COLORS);
    const productImage = item.product?.images?.[0]?.url;
    const productName = item.productSnapshot?.name || item.product?.name || "Product";
    const buyerName = item.buyerSnapshot?.name || item.buyer?.displayName || "Unknown";
    const buyerPhone = item.buyerSnapshot?.phone || item.buyer?.phone;
    const buyerEmail = item.buyerSnapshot?.email || item.buyer?.email;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.card}
        onPress={() => openDetail(item)}
      >
        <LinearGradient
          colors={["rgba(124,138,255,0.04)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Top row: image + product info + status */}
        <View style={styles.cardTop}>
          <View style={styles.productThumb}>
            {productImage ? (
              <Image source={{ uri: productImage }} style={styles.thumbImage} />
            ) : (
              <View style={styles.thumbPlaceholder}>
                <Text style={{ fontSize: 18 }}>📦</Text>
              </View>
            )}
          </View>
          <View style={styles.cardProductInfo}>
            <Text style={styles.productName} numberOfLines={2}>{productName}</Text>
            {item.variant?.title ? (
              <Text style={[styles.variantText, { color: COLORS.accent }]}>{item.variant.title}</Text>
            ) : null}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusText, { color: sc.text }]}>{STATUS_LABELS[item.status]}</Text>
          </View>
        </View>

        {/* Buyer info */}
        <View style={[styles.buyerRow, { backgroundColor: COLORS.surfaceLight, borderColor: COLORS.border }]}>
          <View style={[styles.buyerAvatar, { backgroundColor: COLORS.accentMuted }]}>
            <Ionicons name="person-outline" size={14} color={COLORS.accent} />
          </View>
          <View style={styles.buyerInfo}>
            <Text style={styles.buyerName}>{buyerName}</Text>
            {buyerPhone ? <Text style={styles.buyerContact}>{buyerPhone}</Text> : null}
            {buyerEmail ? <Text style={styles.buyerContact}>{buyerEmail}</Text> : null}
          </View>
        </View>

        {/* Request details */}
        <View style={styles.detailsRow}>
          {item.quantity != null ? (
            <View style={styles.detailChip}>
              <Ionicons name="layers-outline" size={12} color={COLORS.textSubtle} />
              <Text style={styles.detailChipText}>Qty: {item.quantity}</Text>
            </View>
          ) : null}
          {item.location ? (
            <View style={styles.detailChip}>
              <Ionicons name="location-outline" size={12} color={COLORS.textSubtle} />
              <Text style={styles.detailChipText} numberOfLines={1}>{item.location}</Text>
            </View>
          ) : null}
        </View>

        {item.message ? (
          <Text style={styles.messageText} numberOfLines={2}>{item.message}</Text>
        ) : null}

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.timeText}>{formatRelativeTime(item.createdAt)}</Text>
          <View style={styles.tapHint}>
            <Text style={[styles.tapHintText, { color: COLORS.accent }]}>Tap to respond</Text>
            <Ionicons name="chevron-forward" size={12} color={COLORS.accent} />
          </View>
        </View>

        <View style={[styles.cardAccentLine, { backgroundColor: sc.text }]} />
      </TouchableOpacity>
    );
  }, [COLORS, styles, openDetail]);

  const renderFilterChips = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterChips}
    >
      {(["all", "pending", "seen", "responded", "closed"] as const).map((s) => {
        const active = filterStatus === s;
        return (
          <TouchableOpacity
            key={s}
            style={[styles.filterChip, active && { backgroundColor: COLORS.accentMuted, borderColor: COLORS.accent }]}
            onPress={() => setFilterStatus(s)}
          >
            <Text style={[styles.filterChipText, active && { color: COLORS.accent }]}>
              {s === "all" ? "All" : STATUS_LABELS[s]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  if (loading && !refreshing && inquiries.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.bgOrbContainer}>
          <LinearGradient colors={[COLORS.accent, "transparent"]} style={[styles.bgOrb, styles.bgOrb1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          <LinearGradient colors={[COLORS.success, "transparent"]} style={[styles.bgOrb, styles.bgOrb2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        </View>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loaderText}>Loading requests...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.bgOrbContainer}>
        <LinearGradient colors={[COLORS.accent, "transparent"]} style={[styles.bgOrb, styles.bgOrb1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        <LinearGradient colors={[COLORS.success, "transparent"]} style={[styles.bgOrb, styles.bgOrb2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Ionicons name="chevron-back" size={20} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Purchase Requests</Text>
          <Text style={styles.headerSubtitle}>
            {pagination.total} {pagination.total === 1 ? "request" : "requests"} total
          </Text>
        </View>
      </View>

      {/* Filter chips */}
      <View style={[styles.filterBar, { borderBottomColor: COLORS.border }]}>
        {renderFilterChips()}
      </View>

      {/* List */}
      <FlatList
        data={inquiries}
        keyExtractor={(item) => item._id}
        renderItem={renderInquiryCard}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={COLORS.accent} />
        }
        onEndReachedThreshold={0.4}
        onEndReached={handleLoadMore}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator color={COLORS.accent} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <LinearGradient
                colors={[COLORS.accentMuted, "transparent"]}
                style={styles.emptyIconBg}
              >
                <Text style={{ fontSize: 36 }}>📬</Text>
              </LinearGradient>
              <Text style={styles.emptyTitle}>No purchase requests</Text>
              <Text style={styles.emptySubtitle}>
                {filterStatus !== "all"
                  ? `No ${STATUS_LABELS[filterStatus].toLowerCase()} requests`
                  : "Requests from buyers will appear here"}
              </Text>
            </View>
          ) : null
        }
        ListHeaderComponent={
          error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={() => loadInquiries(0, false)}>
                <Text style={[styles.errorText, { color: COLORS.accent, marginLeft: 8 }]}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
      />

      {/* Detail / Status update sheet */}
      <Modal
        visible={detailVisible}
        transparent
        animationType="slide"
        onRequestClose={closeDetail}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeDetail}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalHandle} />

            {selectedInquiry ? (
              <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  automaticallyAdjustKeyboardInsets
                >
                  <Text style={styles.modalTitle}>Request Detail</Text>

                  {/* Product */}
                  <View style={[styles.detailSection, { borderColor: COLORS.border }]}>
                    <Text style={styles.detailSectionTitle}>Product</Text>
                    <Text style={styles.detailValue}>
                      {selectedInquiry.productSnapshot?.name || selectedInquiry.product?.name || "—"}
                    </Text>
                    {selectedInquiry.variant?.title ? (
                      <Text style={[styles.detailMeta, { color: COLORS.accent }]}>
                        {selectedInquiry.variant.title}
                      </Text>
                    ) : null}
                  </View>

                  {/* Buyer */}
                  <View style={[styles.detailSection, { borderColor: COLORS.border }]}>
                    <Text style={styles.detailSectionTitle}>Buyer Contact</Text>
                    {[
                      { icon: "person-outline" as const, value: selectedInquiry.buyerSnapshot?.name || selectedInquiry.buyer?.displayName },
                      { icon: "call-outline" as const, value: selectedInquiry.buyerSnapshot?.phone || selectedInquiry.buyer?.phone },
                      { icon: "mail-outline" as const, value: selectedInquiry.buyerSnapshot?.email || selectedInquiry.buyer?.email },
                    ].map(({ icon, value }) =>
                      value ? (
                        <View key={icon} style={styles.contactRow}>
                          <Ionicons name={icon} size={14} color={COLORS.textSubtle} />
                          <Text style={styles.contactValue}>{value}</Text>
                        </View>
                      ) : null
                    )}
                  </View>

                  {/* Request details */}
                  <View style={[styles.detailSection, { borderColor: COLORS.border }]}>
                    <Text style={styles.detailSectionTitle}>Request Details</Text>
                    {selectedInquiry.quantity != null ? (
                      <View style={styles.contactRow}>
                        <Ionicons name="layers-outline" size={14} color={COLORS.textSubtle} />
                        <Text style={styles.contactValue}>Quantity: {selectedInquiry.quantity}</Text>
                      </View>
                    ) : null}
                    {selectedInquiry.location ? (
                      <View style={styles.contactRow}>
                        <Ionicons name="location-outline" size={14} color={COLORS.textSubtle} />
                        <Text style={styles.contactValue}>{selectedInquiry.location}</Text>
                      </View>
                    ) : null}
                    {selectedInquiry.message ? (
                      <Text style={[styles.detailValue, { marginTop: 6 }]}>{selectedInquiry.message}</Text>
                    ) : null}
                    {!selectedInquiry.quantity && !selectedInquiry.location && !selectedInquiry.message ? (
                      <Text style={styles.detailMeta}>No additional details provided</Text>
                    ) : null}
                  </View>

                  {/* Update status */}
                  <Text style={[styles.detailSectionTitle, { marginBottom: 8 }]}>Update Status</Text>
                  <View style={styles.statusRow}>
                    {(["pending", "seen", "responded", "closed"] as InquiryStatus[]).map((s) => {
                      const active = newStatus === s;
                      const sc = statusColor(s, COLORS);
                      return (
                        <TouchableOpacity
                          key={s}
                          style={[
                            styles.statusOption,
                            { borderColor: active ? sc.text : COLORS.border, backgroundColor: active ? sc.bg : COLORS.surfaceLight },
                          ]}
                          onPress={() => setNewStatus(s)}
                        >
                          <Text style={[styles.statusOptionText, { color: active ? sc.text : COLORS.textMuted }]}>
                            {STATUS_LABELS[s]}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View style={{ marginTop: 12 }}>
                    <Text style={[styles.detailSectionTitle, { marginBottom: 6 }]}>Notes (optional)</Text>
                    <TextInput
                      value={adminNotes}
                      onChangeText={setAdminNotes}
                      style={[styles.notesInput, { borderColor: colors.border, backgroundColor: colors.surfaceElevated, color: colors.text }]}
                      placeholder="Add internal notes or response details..."
                      placeholderTextColor={colors.textMuted}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity style={[styles.modalBtnSecondary, { borderColor: COLORS.border }]} onPress={closeDetail} disabled={updating}>
                      <Text style={[styles.modalBtnSecondaryText, { color: COLORS.text }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.modalBtnPrimary, { backgroundColor: COLORS.accent }]}
                      onPress={handleUpdateStatus}
                      disabled={updating}
                    >
                      <Text style={styles.modalBtnPrimaryText}>{updating ? "Saving..." : "Save"}</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </KeyboardAvoidingView>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (COLORS: ReturnType<typeof useInquiriesPalette>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    bgOrbContainer: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
    bgOrb: { position: "absolute", borderRadius: 999, opacity: 0.08 },
    bgOrb1: { width: 280, height: 280, top: -80, right: -100 },
    bgOrb2: { width: 200, height: 200, bottom: 200, left: -80 },

    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.border,
      gap: 10,
    },
    backButton: {
      width: 34, height: 34, borderRadius: 10,
      borderWidth: 1, borderColor: COLORS.border,
      backgroundColor: COLORS.surface,
      alignItems: "center", justifyContent: "center",
    },
    headerTitleWrap: { flex: 1 },
    headerTitle: { fontSize: 22, fontWeight: "800", color: COLORS.text },
    headerSubtitle: { fontSize: 13, fontWeight: "500", color: COLORS.textMuted, marginTop: 1 },

    filterBar: { borderBottomWidth: 1, paddingVertical: 4 },
    filterChips: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
    filterChip: {
      paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12,
      borderWidth: 1, borderColor: COLORS.border,
      backgroundColor: COLORS.surface,
    },
    filterChipText: { fontSize: 12, fontWeight: "700", color: COLORS.textMuted },

    loader: { flex: 1, alignItems: "center", justifyContent: "center" },
    loaderText: { color: COLORS.textMuted, marginTop: 12, fontWeight: "600" },

    listContent: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 100 },
    footerLoader: { paddingVertical: 20, alignItems: "center" },

    card: {
      backgroundColor: COLORS.surface, borderRadius: 16,
      borderWidth: 1, borderColor: COLORS.border, overflow: "hidden",
      padding: 14, gap: 10,
    },
    cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    productThumb: {
      width: 52, height: 52, borderRadius: 10,
      backgroundColor: COLORS.surfaceLight, overflow: "hidden",
      alignItems: "center", justifyContent: "center",
      borderWidth: 1, borderColor: COLORS.border,
    },
    thumbImage: { width: "100%", height: "100%", resizeMode: "cover" },
    thumbPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
    cardProductInfo: { flex: 1 },
    productName: { fontSize: 14, fontWeight: "700", color: COLORS.text, lineHeight: 20 },
    variantText: { fontSize: 12, fontWeight: "600", marginTop: 2 },
    statusBadge: {
      paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
    },
    statusText: { fontSize: 11, fontWeight: "800" },

    buyerRow: {
      flexDirection: "row", alignItems: "flex-start", gap: 10,
      padding: 10, borderRadius: 10, borderWidth: 1,
    },
    buyerAvatar: {
      width: 30, height: 30, borderRadius: 15,
      alignItems: "center", justifyContent: "center",
    },
    buyerInfo: { flex: 1, gap: 2 },
    buyerName: { fontSize: 13, fontWeight: "700", color: COLORS.text },
    buyerContact: { fontSize: 12, fontWeight: "500", color: COLORS.textSubtle },

    detailsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
    detailChip: {
      flexDirection: "row", alignItems: "center", gap: 4,
      paddingHorizontal: 8, paddingVertical: 4,
      backgroundColor: COLORS.surfaceLight, borderRadius: 8,
    },
    detailChipText: { fontSize: 12, fontWeight: "600", color: COLORS.textSubtle },

    messageText: { fontSize: 13, fontWeight: "500", color: COLORS.textSubtle, lineHeight: 18 },

    cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    timeText: { fontSize: 11, fontWeight: "600", color: COLORS.textMuted },
    tapHint: { flexDirection: "row", alignItems: "center", gap: 2 },
    tapHintText: { fontSize: 12, fontWeight: "700" },

    cardAccentLine: { height: 2, opacity: 0.35, marginTop: 2 },

    emptyState: { alignItems: "center", paddingVertical: 60, paddingHorizontal: 32 },
    emptyIconBg: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 20 },
    emptyTitle: { fontSize: 18, fontWeight: "800", color: COLORS.text },
    emptySubtitle: { fontSize: 14, fontWeight: "500", color: COLORS.textMuted, textAlign: "center", marginTop: 8 },

    errorBox: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      marginHorizontal: 2, padding: 12, borderRadius: 12, marginBottom: 10,
      backgroundColor: "rgba(255,123,123,0.1)", borderWidth: 1, borderColor: "rgba(255,123,123,0.2)",
    },
    errorText: { color: "#ff7b7b", fontWeight: "600", flex: 1 },

    // Modal
    modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
    modalCard: {
      backgroundColor: COLORS.surface,
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      padding: 20, paddingBottom: 36,
      borderWidth: 1, borderBottomWidth: 0, borderColor: COLORS.border,
      maxHeight: "88%",
    },
    modalHandle: {
      width: 36, height: 4, backgroundColor: COLORS.borderLight,
      borderRadius: 2, alignSelf: "center", marginBottom: 16,
    },
    modalTitle: { fontSize: 20, fontWeight: "900", color: COLORS.text, marginBottom: 16 },

    detailSection: { borderBottomWidth: 1, paddingBottom: 12, marginBottom: 12, gap: 4 },
    detailSectionTitle: { fontSize: 11, fontWeight: "900", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
    detailValue: { fontSize: 14, fontWeight: "600", color: COLORS.text },
    detailMeta: { fontSize: 12, fontWeight: "500", color: COLORS.textMuted },
    contactRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
    contactValue: { fontSize: 13, fontWeight: "600", color: COLORS.text, flex: 1 },

    statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
    statusOption: {
      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5,
    },
    statusOptionText: { fontSize: 13, fontWeight: "800" },

    notesInput: {
      borderWidth: 1, borderRadius: 10,
      paddingHorizontal: 12, paddingVertical: 10,
      fontSize: 13, fontWeight: "500", minHeight: 80,
    },

    modalActions: { flexDirection: "row", gap: 10, marginTop: 16 },
    modalBtnSecondary: {
      flex: 1, paddingVertical: 14, borderRadius: 12, borderWidth: 1,
      alignItems: "center",
    },
    modalBtnSecondaryText: { fontSize: 14, fontWeight: "700" },
    modalBtnPrimary: { flex: 1.2, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
    modalBtnPrimaryText: { fontSize: 14, fontWeight: "900", color: "#fff" },
  });
