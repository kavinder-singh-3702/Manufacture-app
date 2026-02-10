import { useMemo, useRef, useState } from "react";
import { View, FlatList, StyleSheet, Dimensions, Text, ActivityIndicator } from "react-native";
import { useTheme } from "../../../hooks/useTheme";
import { PersonalizedOffer } from "../../../services/preference.service";
import { CampaignSlide } from "./CampaignSlide";

const SCREEN_WIDTH = Dimensions.get("window").width;

type CampaignHeroCarouselProps = {
  campaigns: PersonalizedOffer[];
  loading?: boolean;
  onPrimaryPress?: (campaign: PersonalizedOffer) => void;
  onMessagePress?: (campaign: PersonalizedOffer) => void;
  onCallPress?: (campaign: PersonalizedOffer) => void;
  onImpression?: (campaign: PersonalizedOffer, index: number) => void;
  canMessage?: (campaign: PersonalizedOffer) => boolean;
  canCall?: (campaign: PersonalizedOffer) => boolean;
};

export const CampaignHeroCarousel = ({
  campaigns,
  loading,
  onPrimaryPress,
  onMessagePress,
  onCallPress,
  onImpression,
  canMessage,
  canCall,
}: CampaignHeroCarouselProps) => {
  const { spacing, colors } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const seenImpressions = useRef(new Set<string>());

  const cardWidth = useMemo(() => SCREEN_WIDTH - spacing.lg * 2, [spacing.lg]);

  if (loading) {
    return (
      <View style={[styles.loaderContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[styles.loaderText, { color: colors.textMuted }]}>Loading campaigns...</Text>
      </View>
    );
  }

  if (!campaigns || campaigns.length === 0) return null;

  return (
    <View>
      <FlatList
        data={campaigns}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        snapToAlignment="start"
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const nextIndex = Math.round(event.nativeEvent.contentOffset.x / cardWidth);
          setActiveIndex(nextIndex);
        }}
        onViewableItemsChanged={({ viewableItems }) => {
          viewableItems.forEach((entry) => {
            const campaign = entry.item as PersonalizedOffer;
            if (!campaign?.id || seenImpressions.current.has(campaign.id)) return;
            seenImpressions.current.add(campaign.id);
            onImpression?.(campaign, entry.index || 0);
          });
        }}
        viewabilityConfig={{ itemVisiblePercentThreshold: 70 }}
        renderItem={({ item }) => (
          <View style={{ width: cardWidth }}>
            <CampaignSlide
              campaign={item}
              onPrimaryPress={() => onPrimaryPress?.(item)}
              onMessagePress={() => onMessagePress?.(item)}
              onCallPress={() => onCallPress?.(item)}
              messageDisabled={canMessage ? !canMessage(item) : false}
              callDisabled={canCall ? !canCall(item) : false}
            />
          </View>
        )}
      />

      {campaigns.length > 1 ? (
        <View style={[styles.pagination, { marginTop: spacing.sm }]}>
          {campaigns.map((campaign, index) => (
            <View
              key={campaign.id}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === activeIndex ? colors.primary : colors.border,
                },
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    minHeight: 180,
    borderWidth: 1,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loaderText: {
    fontSize: 13,
    fontWeight: "600",
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
