import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../hooks/useTheme";
import { Quote, QuoteMode } from "../../../services/quote.service";
import { QuoteStatusBadge } from "./QuoteStatusBadge";

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const formatCurrency = (amount?: number, currency?: string) => {
  if (amount === undefined || amount === null || Number.isNaN(Number(amount))) return "-";
  const symbol = !currency || currency === "INR" ? "₹" : `${currency} `;
  return `${symbol}${Number(amount).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })}`;
};

const toTimelineLabel = (action: string) =>
  action
    .replace(/^status_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

type QuoteCardProps = {
  quote: Quote;
  tab: QuoteMode;
  onMessagePress: (quote: Quote) => void;
  onCallPress: (quote: Quote) => void;
  onRespondPress?: (quote: Quote) => void;
  onAcceptPress?: (quote: Quote) => void;
  onRejectPress?: (quote: Quote) => void;
  onCancelPress?: (quote: Quote) => void;
};

export const QuoteCard = ({
  quote,
  tab,
  onMessagePress,
  onCallPress,
  onRespondPress,
  onAcceptPress,
  onRejectPress,
  onCancelPress,
}: QuoteCardProps) => {
  const { colors, radius } = useTheme();

  const timeline = useMemo(() => {
    const entries = Array.isArray(quote.history) ? [...quote.history] : [];
    return entries
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 3);
  }, [quote.history]);

  return (
    <View style={[styles.card, { borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surface }]}> 
      <View style={styles.headerRow}>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
            {quote.product?.name || "Product"}
          </Text>
          <Text style={[styles.metaText, { color: colors.textMuted }]}>Requested on {formatDate(quote.createdAt)}</Text>
        </View>
        <QuoteStatusBadge status={quote.status} />
      </View>

      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Quantity</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>{quote.request?.quantity || "-"}</Text>
        </View>
        <View style={styles.detailItem}>
          <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Target Price</Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {formatCurrency(quote.request?.targetPrice, quote.request?.currency)}
          </Text>
        </View>
      </View>

      <Text style={[styles.requirementLabel, { color: colors.textMuted }]}>Requirements</Text>
      <Text style={[styles.requirementText, { color: colors.textSecondary }]} numberOfLines={3}>
        {quote.request?.requirements}
      </Text>

      {quote.response?.unitPrice !== undefined ? (
        <View style={[styles.responseCard, { borderColor: colors.border, backgroundColor: colors.surfaceElevated, borderRadius: radius.md }]}> 
          <Text style={[styles.responseTitle, { color: colors.text }]}>Seller Response</Text>
          <Text style={[styles.responsePrice, { color: colors.primary }]}>
            {formatCurrency(quote.response.unitPrice, quote.response.currency)}
          </Text>
          <View style={styles.responseMetaRow}>
            {quote.response.minOrderQty ? (
              <Text style={[styles.responseMeta, { color: colors.textMuted }]}>Min qty: {quote.response.minOrderQty}</Text>
            ) : null}
            {quote.response.leadTimeDays !== undefined ? (
              <Text style={[styles.responseMeta, { color: colors.textMuted }]}>Lead: {quote.response.leadTimeDays} days</Text>
            ) : null}
            {quote.response.validUntil ? (
              <Text style={[styles.responseMeta, { color: colors.textMuted }]}>Valid till: {formatDate(quote.response.validUntil)}</Text>
            ) : null}
          </View>
          {quote.response.notes ? (
            <Text style={[styles.responseNote, { color: colors.textSecondary }]} numberOfLines={2}>
              {quote.response.notes}
            </Text>
          ) : null}
        </View>
      ) : null}

      {timeline.length ? (
        <View style={styles.timelineWrap}>
          <Text style={[styles.timelineTitle, { color: colors.text }]}>Timeline</Text>
          {timeline.map((item, index) => (
            <View key={`${item.timestamp}-${index}`} style={styles.timelineRow}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.timelineText, { color: colors.textMuted }]} numberOfLines={1}>
                {toTimelineLabel(item.action)} • {formatDate(item.timestamp)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.actionWrap}>
        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surfaceElevated }]}
          onPress={() => onMessagePress(quote)}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={16} color={colors.primary} />
          <Text style={[styles.actionBtnText, { color: colors.primary }]}>Message</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, { borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surfaceElevated }]}
          onPress={() => onCallPress(quote)}
        >
          <Ionicons name="call-outline" size={16} color={colors.primary} />
          <Text style={[styles.actionBtnText, { color: colors.primary }]}>Call</Text>
        </TouchableOpacity>
      </View>

      {tab === "incoming" ? (
        <View style={styles.actionWrap}>
          <TouchableOpacity
            style={[styles.primaryBtn, { borderRadius: radius.md, backgroundColor: colors.primary }]}
            onPress={() => onRespondPress?.(quote)}
          >
            <Text style={[styles.primaryBtnText, { color: colors.textOnPrimary }]}>Respond / Edit Quote</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {tab === "received" && quote.status === "quoted" ? (
        <View style={styles.actionWrap}>
          <TouchableOpacity
            style={[styles.primaryBtn, { borderRadius: radius.md, backgroundColor: colors.success }]}
            onPress={() => onAcceptPress?.(quote)}
          >
            <Text style={[styles.primaryBtnText, { color: colors.textOnPrimary }]}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtn, { borderRadius: radius.md, backgroundColor: colors.error }]}
            onPress={() => onRejectPress?.(quote)}
          >
            <Text style={[styles.primaryBtnText, { color: colors.textOnPrimary }]}>Reject</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {tab === "asked" && ["pending", "quoted"].includes(quote.status) ? (
        <View style={styles.actionWrap}>
          <TouchableOpacity
            style={[styles.secondaryWideBtn, { borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.surfaceElevated }]}
            onPress={() => onCancelPress?.(quote)}
          >
            <Text style={[styles.secondaryWideBtnText, { color: colors.text }]}>Cancel Quote</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 8,
  },
  headerTextWrap: {
    flex: 1,
    gap: 2,
  },
  productName: {
    fontSize: 15,
    fontWeight: "900",
    lineHeight: 20,
  },
  metaText: {
    fontSize: 11,
    fontWeight: "700",
  },
  detailsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  detailItem: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "800",
  },
  requirementLabel: {
    fontSize: 11,
    fontWeight: "800",
  },
  requirementText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
  responseCard: {
    borderWidth: 1,
    padding: 10,
    gap: 4,
  },
  responseTitle: {
    fontSize: 12,
    fontWeight: "900",
  },
  responsePrice: {
    fontSize: 16,
    fontWeight: "900",
  },
  responseMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  responseMeta: {
    fontSize: 11,
    fontWeight: "700",
  },
  responseNote: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
  timelineWrap: {
    gap: 4,
  },
  timelineTitle: {
    fontSize: 12,
    fontWeight: "900",
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  timelineText: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
  },
  actionWrap: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "800",
  },
  primaryBtn: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  primaryBtnText: {
    fontSize: 12,
    fontWeight: "900",
  },
  secondaryWideBtn: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  secondaryWideBtnText: {
    fontSize: 12,
    fontWeight: "800",
  },
});
