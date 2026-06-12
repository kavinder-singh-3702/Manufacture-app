import { useCallback, useRef, useState } from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import PagerView from "react-native-pager-view";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNotifications } from "../../providers/NotificationsProvider";
import { useUnreadMessages } from "../../providers/UnreadMessagesProvider";
import { useThemeMode } from "../../hooks/useThemeMode";
import { CommandCenterHeader, CommandCenterSubTabs } from "../../components/admin";
import { RootStackParamList } from "../../navigation/types";
import { neuCardBg } from "../../theme/neumorphic";
import { OverviewTab } from "./components/OverviewTab";
import { TradesTab } from "./components/TradesTab";
import { AlertsTab } from "./components/AlertsTab";
import { LogsTab } from "./components/LogsTab";
import { RequestsTab } from "./components/RequestsTab";
import { MessagesTab } from "./components/MessagesTab";

const SUB_TABS = [
  { key: "overview", label: "OVERVIEW" },
  { key: "requests", label: "REQUESTS" },
  { key: "messages", label: "MESSAGES" },
  { key: "trades", label: "TRADES" },
  { key: "alerts", label: "ALERTS" },
  { key: "logs", label: "LOGS" },
];
const TAB_KEYS = SUB_TABS.map((t) => t.key);
// Default lands on REQUESTS — index 1 — admin's first stop is the queue.
const DEFAULT_TAB_INDEX = 1;

export const CommandCenterScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { unreadCount } = useNotifications();
  const { refresh: refreshUnread } = useUnreadMessages();
  // Default to 'requests' — this screen is now the admin Ops tab destination, so
  // landing on the request queue is what the admin expects.
  const [activeTab, setActiveTab] = useState<string>(TAB_KEYS[DEFAULT_TAB_INDEX]);
  const pagerRef = useRef<PagerView>(null);
  const { resolvedMode } = useThemeMode();
  const isDark = resolvedMode === "dark";

  // Tapping a tab header → tell the pager to scroll. Swiping the pager
  // updates `activeTab` via onPageSelected. Both paths converge on the
  // same state so the header underline tracks the visible page.
  const handleTabChange = useCallback((key: string) => {
    const idx = TAB_KEYS.indexOf(key);
    if (idx < 0) return;
    setActiveTab(key);
    pagerRef.current?.setPage(idx);
  }, []);

  // Belt-and-suspenders refetch on screen focus so the inner Messages tab
  // badge settles even if the markRead pub/sub hasn't fired yet (e.g. the
  // admin entered via deep link from a notification).
  useFocusEffect(
    useCallback(() => {
      refreshUnread();
    }, [refreshUnread])
  );

  const handleSearchPress = () => {
    navigation.navigate("ProductSearch", {});
  };

  const handleNotificationPress = () => {
    navigation.navigate("Notifications");
  };

  return (
    <View style={[styles.container, { backgroundColor: neuCardBg(isDark) }]}>
      <CommandCenterHeader
        onSearchPress={handleSearchPress}
        onNotificationPress={handleNotificationPress}
        notificationCount={unreadCount}
      />
      <CommandCenterSubTabs
        tabs={SUB_TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {/* Swipe left/right to switch sub-tabs — saves a lot of taps when the
          admin is cycling through Requests / Messages / Alerts. Tap on the
          header still works (handleTabChange tells the pager to seek). */}
      <PagerView
        ref={pagerRef}
        style={styles.content}
        initialPage={DEFAULT_TAB_INDEX}
        onPageSelected={(event) => {
          const next = TAB_KEYS[event.nativeEvent.position];
          if (next) setActiveTab(next);
        }}
      >
        <View key="overview" style={styles.page}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <OverviewTab />
          </ScrollView>
        </View>
        <View key="requests" style={styles.page}><RequestsTab /></View>
        <View key="messages" style={styles.page}><MessagesTab /></View>
        <View key="trades" style={styles.page}><TradesTab /></View>
        <View key="alerts" style={styles.page}><AlertsTab /></View>
        <View key="logs" style={styles.page}><LogsTab /></View>
      </PagerView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
});
