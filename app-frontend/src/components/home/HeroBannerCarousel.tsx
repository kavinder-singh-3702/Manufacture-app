import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useVideoPlayer, VideoView } from "expo-video";
import { AdFeedCard } from "../../services/ad.service";

const AUTO_SCROLL_INTERVAL = 4000;
const BOTTOM_RADIUS = 24;

type DefaultSlide = {
  id: string;
  type: "default";
  gradient: [string, string, ...string[]];
  title: string;
  subtitle: string;
};

type AdSlide = {
  id: string;
  type: "ad";
  card: AdFeedCard;
};

type BannerSlide = DefaultSlide | AdSlide;

type HeroBannerCarouselProps = {
  cards: AdFeedCard[];
  loading?: boolean;
  topInset?: number;
  greeting?: string;
  userName?: string;
  appName?: string;
  onCardPress?: (card: AdFeedCard) => void;
  onCardVisible?: (card: AdFeedCard) => void;
  onSearchPress?: () => void;
  onCallPress?: (card: AdFeedCard) => void;
  onMessagePress?: (card: AdFeedCard) => void;
};

const BannerVideo = ({ uri, shouldPlay }: { uri: string; shouldPlay: boolean }) => {
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
    if (shouldPlay) p.play();
  });

  useEffect(() => {
    if (shouldPlay) {
      player.play();
    } else {
      player.pause();
    }
  }, [shouldPlay, player]);

  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      nativeControls={false}
    />
  );
};

const isVideoMedia = (card: AdFeedCard): boolean => {
  if (card.bannerMediaType === "video") return true;
  const url = card.bannerVideoUrl;
  if (!url) return false;
  return /\.(mp4|mov|webm|avi)(\?|$)/i.test(url);
};

export const HeroBannerCarousel = ({
  cards,
  loading = false,
  topInset = 0,
  greeting = "Welcome",
  userName = "User",
  appName = "Manufacture",
  onCardPress,
  onCardVisible,
  onSearchPress,
  onCallPress,
  onMessagePress,
}: HeroBannerCarouselProps) => {
  const { width } = useWindowDimensions();
  const baseBannerHeight = Math.min(Math.round(width * 0.6), 330);
  const searchAreaHeight = onSearchPress ? 56 : 0;
  const bannerHeight = baseBannerHeight + searchAreaHeight + topInset;
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const autoScrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const isUserDragging = useRef(false);
  const dotScaleAnims = useRef<Animated.Value[]>([]);

  const slides: BannerSlide[] = useMemo(() => {
    if (cards.length > 0) {
      return cards.map((card) => ({ id: card.id, type: "ad" as const, card }));
    }
    // While loading, don't show default slides to avoid the flash
    if (loading) return [];
    return [
      {
        id: "default-1",
        type: "default" as const,
        gradient: ["#1B1464", "#2E3192", "#0071BC"] as [string, string, ...string[]],
        title: `${greeting}, ${userName}`,
        subtitle: `Welcome to ${appName} — your manufacturing hub`,
      },
      {
        id: "default-2",
        type: "default" as const,
        gradient: ["#134E5E", "#1A6B52", "#71B280"] as [string, string, ...string[]],
        title: "Your Industrial Marketplace",
        subtitle: "Source products, connect with sellers, grow your business",
      },
      {
        id: "default-3",
        type: "default" as const,
        gradient: ["#2C3E50", "#3498DB", "#2980B9"] as [string, string, ...string[]],
        title: "Source, Connect, Grow",
        subtitle: "Everything you need for manufacturing operations",
      },
    ];
  }, [cards, loading, greeting, userName, appName]);

  // Keep dot animations in sync with slide count
  if (dotScaleAnims.current.length !== slides.length) {
    dotScaleAnims.current = slides.map((_, i) => new Animated.Value(i === 0 ? 1 : 0));
  }

  const animateDots = useCallback(
    (toIndex: number) => {
      dotScaleAnims.current.forEach((anim, i) => {
        Animated.spring(anim, {
          toValue: i === toIndex ? 1 : 0,
          useNativeDriver: true,
          tension: 60,
          friction: 8,
        }).start();
      });
    },
    []
  );

  const startAutoScroll = useCallback(() => {
    if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
    if (slides.length <= 1) return;

    autoScrollTimer.current = setInterval(() => {
      if (isUserDragging.current) return;
      setActiveIndex((prev) => {
        const next = (prev + 1) % slides.length;
        scrollRef.current?.scrollTo({ x: next * width, animated: true });
        const slide = slides[next];
        if (slide?.type === "ad") onCardVisible?.(slide.card);
        animateDots(next);
        return next;
      });
    }, AUTO_SCROLL_INTERVAL);
  }, [slides, width, onCardVisible, animateDots]);

  useEffect(() => {
    startAutoScroll();
    return () => {
      if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
    };
  }, [startAutoScroll]);

  useEffect(() => {
    if (slides.length && slides[0]?.type === "ad") {
      onCardVisible?.(slides[0].card);
    }
  }, [slides, onCardVisible]);

  const handleScrollBeginDrag = () => {
    isUserDragging.current = true;
    if (autoScrollTimer.current) clearInterval(autoScrollTimer.current);
  };

  const handleMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    isUserDragging.current = false;
    const page = Math.round(e.nativeEvent.contentOffset.x / width);
    const index = Math.max(0, Math.min(slides.length - 1, page));
    setActiveIndex(index);
    animateDots(index);
    const slide = slides[index];
    if (slide?.type === "ad") onCardVisible?.(slide.card);
    startAutoScroll();
  };

  const renderDefaultSlide = (slide: DefaultSlide) => (
    <View key={slide.id} style={{ width, height: bannerHeight }}>
      <LinearGradient
        colors={slide.gradient}
        locations={slide.gradient.map((_, i) => i / (slide.gradient.length - 1)) as [number, number, ...number[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Decorative circles */}
      <View style={[styles.decoCircle1, { backgroundColor: "rgba(255,255,255,0.08)" }]} />
      <View style={[styles.decoCircle2, { backgroundColor: "rgba(255,255,255,0.06)" }]} />
      <View style={[styles.decoCircle3, { backgroundColor: "rgba(255,255,255,0.04)" }]} />
      {/* Content */}
      <View style={[styles.defaultSlideContent, { top: 36 + topInset }, onSearchPress && { bottom: 36 + searchAreaHeight }]}>
        <Text style={styles.defaultSlideTitle}>{slide.title}</Text>
        <Text style={styles.defaultSlideSubtitle}>{slide.subtitle}</Text>
      </View>
    </View>
  );

  const renderAdSlide = (slide: AdSlide, index: number) => {
    const card = slide.card;
    const bannerImage = card.bannerImageUrl;
    const productImage = card.product?.images?.[0]?.url;
    const hasFullBanner = Boolean(bannerImage);
    const productName = card.title || card.product?.name || "";
    const companyName = card.subtitle || card.product?.company?.displayName || "";
    const currencySymbol = (p?: { currency?: string }) =>
      p?.currency === "INR" || !p?.currency ? "₹" : p.currency;
    const formatPrice = (p?: { amount?: number | string; currency?: string }) =>
      p?.amount ? `${currencySymbol(p)}${Number(p.amount).toLocaleString("en-IN")}` : "";

    const listedPrice = card.pricing?.listed || card.product?.price;
    const advertised = card.pricing?.advertised || card.priceOverride;
    const isDiscounted =
      card.pricing?.isDiscounted ||
      (advertised?.amount && listedPrice?.amount && Number(advertised.amount) < Number(listedPrice.amount));
    const displayPrice = advertised || listedPrice;
    const priceText = formatPrice(displayPrice);
    const originalPriceText = isDiscounted ? formatPrice(listedPrice) : "";

    // Full banner image mode (admin uploaded a banner)
    if (hasFullBanner || (isVideoMedia(card) && card.bannerVideoUrl)) {
      return (
        <TouchableOpacity
          key={slide.id}
          activeOpacity={0.95}
          onPress={() => onCardPress?.(card)}
          style={{ width, height: bannerHeight }}
        >
          {isVideoMedia(card) && card.bannerVideoUrl ? (
            <BannerVideo
              uri={card.bannerVideoUrl}
              shouldPlay={index === activeIndex}
            />
          ) : (
            <Image
              source={{ uri: bannerImage! }}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          )}
        </TouchableOpacity>
      );
    }

    // Product card mode — styled promotional banner with product info
    return (
      <TouchableOpacity
        key={slide.id}
        activeOpacity={0.95}
        onPress={() => onCardPress?.(card)}
        style={{ width, height: bannerHeight }}
      >
        <LinearGradient
          colors={["#1B1464", "#2E3192", "#0071BC"]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Decorative shapes */}
        <View style={[styles.decoCircle1, { backgroundColor: "rgba(255,255,255,0.06)" }]} />
        <View style={[styles.decoCircle2, { backgroundColor: "rgba(255,255,255,0.04)" }]} />

        <View style={[styles.adCardContent, { paddingTop: 16 + topInset }, onSearchPress && { paddingBottom: 20 + searchAreaHeight }]}>
          {/* Top row: text + image */}
          <View style={styles.adCardTopRow}>
            <View style={styles.adCardTextSection}>
              <View style={styles.adBadgeSmall}>
                <Text style={styles.adBadgeSmallText}>AD</Text>
              </View>
              <Text style={styles.adCardTitle} numberOfLines={2}>
                {productName}
              </Text>
              {companyName ? (
                <Text style={styles.adCardCompany} numberOfLines={1}>
                  by {companyName}
                </Text>
              ) : null}
              {priceText ? (
                <View style={styles.adPricePill}>
                  {originalPriceText ? (
                    <Text style={styles.adPriceOriginal}>{originalPriceText}</Text>
                  ) : null}
                  <Text style={styles.adPriceText}>{priceText}</Text>
                  {displayPrice?.unit ? <Text style={styles.adPriceUnit}>/{displayPrice.unit}</Text> : null}
                </View>
              ) : null}
            </View>

            {/* Product image */}
            {productImage ? (
              <View style={styles.adCardImageWrap}>
                <Image
                  source={{ uri: productImage }}
                  style={styles.adCardImage}
                  resizeMode="cover"
                />
              </View>
            ) : (
              <View style={[styles.adCardImageWrap, styles.adCardImagePlaceholder]}>
                <Text style={{ fontSize: 40 }}>📦</Text>
              </View>
            )}
          </View>

          {/* Bottom row: action buttons — full width */}
          <View style={styles.adActionsRow}>
            <TouchableOpacity
              style={styles.adCtaButton}
              activeOpacity={0.8}
              onPress={() => onCardPress?.(card)}
            >
              <Ionicons name="eye-outline" size={14} color="#1B1464" />
              <Text style={styles.adCtaText}>{card.ctaLabel || "View"}</Text>
            </TouchableOpacity>
            {card.product?.contactPreferences?.allowCall !== false &&
              card.product?.company?.contact?.phone && onCallPress ? (
              <TouchableOpacity
                style={styles.adCtaButtonOutline}
                activeOpacity={0.8}
                onPress={() => onCallPress(card)}
              >
                <Ionicons name="call-outline" size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.adCtaTextOutline}>Call</Text>
              </TouchableOpacity>
            ) : null}
            {card.product?.contactPreferences?.allowChat !== false &&
              card.product?.createdBy && onMessagePress ? (
              <TouchableOpacity
                style={styles.adCtaButtonOutline}
                activeOpacity={0.8}
                onPress={() => onMessagePress(card)}
              >
                <Ionicons name="chatbubble-outline" size={12} color="rgba(255,255,255,0.8)" />
                <Text style={styles.adCtaTextOutline}>Chat</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSearchOverlay = () => {
    if (!onSearchPress) return null;
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onSearchPress}
        style={styles.searchOverlay}
      >
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.6)" />
          <Text style={styles.searchPlaceholder}>Search products or SKUs</Text>
          <Ionicons name="arrow-forward-circle-outline" size={18} color="rgba(255,255,255,0.5)" />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && slides.length === 0) {
    return (
      <View
        style={[
          styles.container,
          {
            height: bannerHeight,
            borderBottomLeftRadius: BOTTOM_RADIUS,
            borderBottomRightRadius: BOTTOM_RADIUS,
          },
        ]}
      >
        <LinearGradient
          colors={["#1B1464", "#2E3192", "#0071BC"]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {renderSearchOverlay()}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          height: bannerHeight,
          borderBottomLeftRadius: BOTTOM_RADIUS,
          borderBottomRightRadius: BOTTOM_RADIUS,
        },
      ]}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={handleScrollBeginDrag}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        style={StyleSheet.absoluteFill}
      >
        {slides.map((slide, i) =>
          slide.type === "default"
            ? renderDefaultSlide(slide)
            : renderAdSlide(slide, i)
        )}
      </ScrollView>

      {/* Dot pagination */}
      {slides.length > 1 && (
        <View style={[styles.dotsRow, onSearchPress && { bottom: searchAreaHeight + 8 }]}>
          <View style={styles.dotsContainer}>
            {slides.map((slide, i) => {
              const scale = dotScaleAnims.current[i]?.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.3],
              }) ?? 1;

              return (
                <Animated.View
                  key={slide.id}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        i === activeIndex ? "#fff" : "rgba(255,255,255,0.45)",
                      width: i === activeIndex ? 20 : 7,
                      transform: [{ scale }],
                    },
                  ]}
                />
              );
            })}
          </View>
        </View>
      )}

      {renderSearchOverlay()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
  },
  // Decorative circles for default slides
  decoCircle1: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -40,
    right: -30,
  },
  decoCircle2: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    bottom: -20,
    left: -20,
  },
  decoCircle3: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    top: 30,
    left: "40%",
  },
  defaultSlideContent: {
    position: "absolute",
    bottom: 36,
    left: 24,
    right: 24,
  },
  defaultSlideTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.3,
    textShadowColor: "rgba(0,0,0,0.25)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  defaultSlideSubtitle: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 6,
    lineHeight: 20,
    textShadowColor: "rgba(0,0,0,0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  // Ad card layout (product card mode — no banner image)
  adCardContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 10,
    justifyContent: "center",
  },
  adCardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  adCardTextSection: {
    flex: 1,
    gap: 6,
  },
  adBadgeSmall: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 2,
  },
  adBadgeSmallText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  adCardTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.3,
    lineHeight: 28,
  },
  adCardCompany: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "600",
  },
  adPricePill: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 2,
  },
  adPriceOriginal: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 13,
    fontWeight: "700",
    textDecorationLine: "line-through" as const,
    marginRight: 6,
  },
  adPriceText: {
    color: "#4ADE80",
    fontSize: 20,
    fontWeight: "900",
  },
  adPriceUnit: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 2,
  },
  adActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  adCtaButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  adCtaText: {
    color: "#1B1464",
    fontSize: 11,
    fontWeight: "800",
  },
  adCtaButtonOutline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 16,
  },
  adCtaTextOutline: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 10,
    fontWeight: "700",
  },
  adCardImageWrap: {
    width: 124,
    height: 124,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
  },
  adCardImage: {
    width: 120,
    height: 120,
  },
  adCardImagePlaceholder: {
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  // Search overlay
  searchOverlay: {
    position: "absolute",
    bottom: 10,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 42,
    gap: 10,
  },
  searchPlaceholder: {
    flex: 1,
    color: "rgba(255,255,255,0.65)",
    fontSize: 14,
    fontWeight: "600",
  },
  // Dots
  dotsRow: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  dotsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  dot: {
    height: 7,
    borderRadius: 4,
  },
});
