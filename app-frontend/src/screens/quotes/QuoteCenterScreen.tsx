import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useIsFocused, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../components/ui/Toast";
import { chatService } from "../../services/chat.service";
import {
  quoteService,
  Quote,
  QuoteMode,
  QuoteStatus,
  RespondQuotePayload,
} from "../../services/quote.service";
import { RootStackParamList } from "../../navigation/types";
import { QuoteCard } from "./components/QuoteCard";
import { QuoteResponseSheet } from "./components/QuoteResponseSheet";

const PAGE_SIZE = 12;

type StatusChip = "all" | QuoteStatus;

type Nav = NativeStackNavigationProp<RootStackParamList>;
type QuoteCenterRoute = RouteProp<RootStackParamList, "QuoteCenter">;

const COMMON_STATUS_FILTERS: StatusChip[] = [
  "all",
  "pending",
  "quoted",
  "accepted",
  "rejected",
  "cancelled",
  "expired",
];

const RECEIVED_STATUS_FILTERS: StatusChip[] = ["all", "quoted", "accepted", "rejected", "expired"];

const MODE_LABEL: Record<QuoteMode, string> = {
  asked: "Asked",
  received: "Received",
  incoming: "Incoming",
};

const statusToLabel = (status: StatusChip) =>
  status === "all" ? "All" : status.charAt(0).toUpperCase() + status.slice(1);

const parseApiErrorMessage = (error: any): string => {
  if (Array.isArray(error?.data?.errors) && error.data.errors.length > 0) {
    const first = error.data.errors[0];
    if (first?.msg) return String(first.msg);
  }
  return error?.message || "Request failed";
};

const getSellerPhone = (quote: Quote) => quote?.seller?.phone || quote?.sellerCompany?.contact?.phone;

export const QuoteCenterScreen = () => {
  const { colors, spacing, radius } = useTheme();
  const styles = useMemo(() => createStyles(colors, spacing, radius), [colors, spacing, radius]);
  const navigation = useNavigation<Nav>();
  const route = useRoute<QuoteCenterRoute>();
  const isFocused = useIsFocused();
  const { user, requestLogin } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const initialTab = route.params?.initialTab || "asked";

  const [activeTab, setActiveTab] = useState<QuoteMode>(initialTab);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusChip>("all");

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ total: 0, limit: PAGE_SIZE, offset: 0, hasMore: false });
  const [hasIncoming, setHasIncoming] = useState(activeTab === "incoming");

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [responseQuote, setResponseQuote] = useState<Quote | null>(null);
  const [responseSaving, setResponseSaving] = useState(false);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!isFocused) return;
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [isFocused, searchInput]);

  const checkIncomingAvailability = useCallback(async () => {
    if (!user || user.role === "guest") {
      setHasIncoming(false);
      return;
    }

    try {
      const res = await quoteService.list({ mode: "incoming", limit: 1, offset: 0 });
      setHasIncoming((res.pagination?.total || 0) > 0);
    } catch {
      setHasIncoming(false);
    }
  }, [user]);

  const fetchQuotes = useCallback(
    async (offset = 0, append = false) => {
      if (!user || user.role === "guest") {
        setQuotes([]);
        setPagination({ total: 0, limit: PAGE_SIZE, offset: 0, hasMore: false });
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        return;
      }

      try {
        setError(null);
        if (append) {
          setLoadingMore(true);
        } else if (!refreshing) {
          setLoading(true);
        }

        const response = await quoteService.list({
          mode: activeTab,
          status: statusFilter === "all" ? undefined : statusFilter,
          search: search || undefined,
          limit: PAGE_SIZE,
          offset,
        });

        setQuotes((previous) => (append ? [...previous, ...(response.quotes || [])] : response.quotes || []));
        setPagination(response.pagination || { total: 0, limit: PAGE_SIZE, offset, hasMore: false });
      } catch (err: any) {
        setError(parseApiErrorMessage(err));
        if (!append) {
          setQuotes([]);
          setPagination({ total: 0, limit: PAGE_SIZE, offset: 0, hasMore: false });
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [activeTab, refreshing, search, statusFilter, user]
  );

  useFocusEffect(
    useCallback(() => {
      fetchQuotes(0, false);
      checkIncomingAvailability();
    }, [checkIncomingAvailability, fetchQuotes])
  );

  useEffect(() => {
    if (!isFocused) return;
    fetchQuotes(0, false);
  }, [activeTab, fetchQuotes, isFocused, search, statusFilter]);

  useEffect(() => {
    if (activeTab === "incoming") return;
    setStatusFilter("all");
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "incoming" && !hasIncoming) {
      setActiveTab("asked");
    }
  }, [activeTab, hasIncoming]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchQuotes(0, false), checkIncomingAvailability()]);
  }, [checkIncomingAvailability, fetchQuotes]);

  const onEndReached = useCallback(() => {
    if (loading || loadingMore || refreshing || !pagination.hasMore) return;
    const nextOffset = pagination.offset + pagination.limit;
    fetchQuotes(nextOffset, true);
  }, [fetchQuotes, loading, loadingMore, pagination.hasMore, pagination.limit, pagination.offset, refreshing]);

  const openConversation = useCallback(
    async (quote: Quote) => {
      if (!user || user.role === "guest") {
        requestLogin();
        return;
      }

      const target = activeTab === "incoming" ? quote.buyer : quote.seller;
      const recipientId = target?._id;
      if (!recipientId) {
        toastError("Chat unavailable", "Participant details are missing for this quote.");
        return;
      }

      try {
        const conversationId = await chatService.startConversation(String(recipientId));
        navigation.navigate("Chat", {
          conversationId,
          recipientId: String(recipientId),
          recipientName: target.displayName || "Quote contact",
          recipientPhone: target.phone,
        });
      } catch (err: any) {
        toastError("Chat unavailable", err?.message || "Could not open the conversation.");
      }
    },
    [activeTab, navigation, requestLogin, toastError, user]
  );

  const callContact = useCallback(
    async (quote: Quote) => {
      const phone = activeTab === "incoming" ? quote.buyer?.phone : getSellerPhone(quote);
      if (!phone) {
        toastError("Call unavailable", "Phone number is not available.");
        return;
      }

      try {
        await Linking.openURL(`tel:${phone}`);
      } catch {
        toastError("Call unavailable", "Your device could not initiate the call.");
      }
    },
    [activeTab, toastError]
  );

  const updateStatus = useCallback(
    async (quote: Quote, status: "accepted" | "rejected" | "cancelled" | "expired") => {
      try {
        setActionLoadingId(quote._id);
        await quoteService.updateStatus(quote._id, { status });
        toastSuccess("Quote updated", `Status changed to ${status}.`);
        await Promise.all([fetchQuotes(0, false), checkIncomingAvailability()]);
      } catch (err: any) {
        toastError("Update failed", parseApiErrorMessage(err));
      } finally {
        setActionLoadingId(null);
      }
    },
    [checkIncomingAvailability, fetchQuotes, toastError, toastSuccess]
  );

  const submitResponse = useCallback(
    async (payload: RespondQuotePayload) => {
      if (!responseQuote) return;
      try {
        setResponseSaving(true);
        await quoteService.respond(responseQuote._id, payload);
        toastSuccess("Quote sent", "Your quote response has been saved.");
        setResponseQuote(null);
        await Promise.all([fetchQuotes(0, false), checkIncomingAvailability()]);
      } catch (err: any) {
        toastError("Response failed", parseApiErrorMessage(err));
      } finally {
        setResponseSaving(false);
      }
    },
    [checkIncomingAvailability, fetchQuotes, responseQuote, toastError, toastSuccess]
  );

  const statusFilters = activeTab === "received" ? RECEIVED_STATUS_FILTERS : COMMON_STATUS_FILTERS;
  const tabs: QuoteMode[] = hasIncoming || activeTab === "incoming" ? ["asked", "received", "incoming"] : ["asked", "received"];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <View style={[styles.header, { borderBottomColor: colors.border }]}> 
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.title, { color: colors.text }]}>Quotes</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {pagination.total} records in {MODE_LABEL[activeTab]}
          </Text>
        </View>
      </View>

      {!user || user.role === "guest" ? (
        <View style={styles.centerState}>
          <Ionicons name="lock-closed-outline" size={26} color={colors.primary} />
          <Text style={[styles.centerTitle, { color: colors.text }]}>Login to manage quotes</Text>
          <Text style={[styles.centerSubtitle, { color: colors.textMuted }]}>Track quote requests, responses, and actions in one place.</Text>
          <TouchableOpacity
            style={[styles.loginBtn, { borderRadius: radius.md, backgroundColor: colors.primary }]}
            onPress={requestLogin}
          >
            <Text style={[styles.loginBtnText, { color: colors.textOnPrimary }]}>Login</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={[styles.tabRow, { borderBottomColor: colors.border }]}> 
            {tabs.map((tab) => {
              const active = tab === activeTab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tabBtn,
                    {
                      borderBottomColor: active ? colors.primary : "transparent",
                    },
                  ]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabBtnText, { color: active ? colors.primary : colors.textMuted }]}>{MODE_LABEL[tab]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.searchWrap}>
            <View style={[styles.searchInputWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}> 
              <Ionicons name="search" size={16} color={colors.textMuted} />
              <TextInput
                value={searchInput}
                onChangeText={setSearchInput}
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search requirements or product"
                placeholderTextColor={colors.textMuted}
              />
              {searchInput.length ? (
                <TouchableOpacity onPress={() => setSearchInput("")} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {statusFilters.map((chip) => {
                const active = statusFilter === chip;
                return (
                  <TouchableOpacity
                    key={chip}
                    style={[
                      styles.filterChip,
                      {
                        borderColor: active ? colors.primary : colors.border,
                        backgroundColor: active ? colors.primary + "1A" : colors.surface,
                        borderRadius: radius.pill,
                      },
                    ]}
                    onPress={() => setStatusFilter(chip)}
                  >
                    <Text style={[styles.filterChipText, { color: active ? colors.primary : colors.text }]}>
                      {statusToLabel(chip)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {error ? (
            <View style={[styles.errorBanner, { borderColor: colors.error + "55", backgroundColor: colors.error + "14", borderRadius: radius.md }]}> 
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]} numberOfLines={2}>
                {error}
              </Text>
              <TouchableOpacity onPress={() => fetchQuotes(0, false)}>
                <Text style={[styles.retryText, { color: colors.primary }]}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {loading && !quotes.length ? (
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.centerSubtitle, { color: colors.textMuted }]}>Loading quotes...</Text>
            </View>
          ) : quotes.length === 0 ? (
            <View style={styles.centerState}>
              <Ionicons name="document-text-outline" size={26} color={colors.textMuted} />
              <Text style={[styles.centerTitle, { color: colors.text }]}>No quote records</Text>
              <Text style={[styles.centerSubtitle, { color: colors.textMuted }]}>Your {MODE_LABEL[activeTab].toLowerCase()} list is currently empty.</Text>
            </View>
          ) : (
            <FlatList
              data={quotes}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View style={{ opacity: actionLoadingId === item._id ? 0.72 : 1 }}>
                  <QuoteCard
                    quote={item}
                    tab={activeTab}
                    onMessagePress={openConversation}
                    onCallPress={callContact}
                    onRespondPress={(quote) => setResponseQuote(quote)}
                    onAcceptPress={(quote) => updateStatus(quote, "accepted")}
                    onRejectPress={(quote) => updateStatus(quote, "rejected")}
                    onCancelPress={(quote) => updateStatus(quote, "cancelled")}
                  />
                </View>
              )}
              contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xl, gap: spacing.sm }}
              ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
              onEndReached={onEndReached}
              onEndReachedThreshold={0.35}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
              ListFooterComponent={
                loadingMore ? (
                  <View style={styles.footerLoader}>
                    <ActivityIndicator size="small" color={colors.primary} />
                  </View>
                ) : null
              }
              showsVerticalScrollIndicator={false}
            />
          )}

          <QuoteResponseSheet
            visible={Boolean(responseQuote)}
            quote={responseQuote}
            loading={responseSaving}
            onClose={() => setResponseQuote(null)}
            onSubmit={submitResponse}
          />
        </>
      )}
    </SafeAreaView>
  );
};

const createStyles = (
  colors: ReturnType<typeof useTheme>["colors"],
  spacing: ReturnType<typeof useTheme>["spacing"],
  radius: ReturnType<typeof useTheme>["radius"]
) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      borderBottomWidth: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    headerTextWrap: {
      flex: 1,
      gap: 1,
    },
    title: {
      fontSize: 19,
      fontWeight: "900",
    },
    subtitle: {
      fontSize: 12,
      fontWeight: "700",
    },
    tabRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surface,
    },
    tabBtn: {
      flex: 1,
      minHeight: 44,
      borderBottomWidth: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    tabBtnText: {
      fontSize: 13,
      fontWeight: "800",
    },
    searchWrap: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      gap: spacing.sm,
    },
    searchInputWrap: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      minHeight: 44,
      borderRadius: radius.md,
      paddingHorizontal: 12,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      fontWeight: "600",
      paddingVertical: 0,
    },
    filterRow: {
      gap: 8,
      paddingRight: spacing.md,
      paddingBottom: 2,
    },
    filterChip: {
      minHeight: 36,
      borderWidth: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 12,
    },
    filterChipText: {
      fontSize: 12,
      fontWeight: "700",
    },
    centerState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
      gap: 8,
    },
    centerTitle: {
      fontSize: 15,
      fontWeight: "900",
      textAlign: "center",
    },
    centerSubtitle: {
      fontSize: 12,
      fontWeight: "600",
      textAlign: "center",
      lineHeight: 18,
    },
    loginBtn: {
      marginTop: 4,
      minWidth: 120,
      minHeight: 44,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 16,
    },
    loginBtnText: {
      fontSize: 13,
      fontWeight: "900",
    },
    errorBanner: {
      marginTop: spacing.sm,
      marginHorizontal: spacing.md,
      borderWidth: 1,
      paddingHorizontal: 10,
      paddingVertical: 8,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    errorText: {
      flex: 1,
      fontSize: 12,
      fontWeight: "700",
    },
    retryText: {
      fontSize: 12,
      fontWeight: "800",
    },
    footerLoader: {
      paddingVertical: 12,
      alignItems: "center",
      justifyContent: "center",
    },
  });

export default QuoteCenterScreen;
