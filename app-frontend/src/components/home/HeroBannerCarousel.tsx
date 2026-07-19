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
};

const BannerVideo = ({
  uri,
  poster,
  shouldPlay,
  onError,
}: {
  uri: string;
  poster?: string;
  shouldPlay: boolean;
  onError?: (uri: string) => void;
}) => {
  // Track ready state so we don't call play() before the video has
  // buffered enough to actually start. Previously we called play() in
  // the useVideoPlayer callback AND in a useEffect on mount — both
  // fired before the source was loaded on iOS, so the play command
  // was silently dropped and the poster stayed frozen ("mute").
  const [isReady, setIsReady] = useState(false);
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
  });

  useEffect(() => {
    const subscription = player.addListener("statusChange", ({ status }) => {
      if (status === "readyToPlay") {
        setIsReady(true);
      } else if (status === "error") {
        onError?.(uri);
      }
    });
    return () => subscription.remove();
  }, [player, uri, onError]);

  useEffect(() => {
    if (!isReady) return;
    if (shouldPlay) {
      player.play();
    } else {
      player.pause();
    }
  }, [isReady, shouldPlay, player]);

  return (
    <>
      {/* Poster sits behind the video so viewers see an image instantly while it loads. */}
      {poster ? (
        <Image source={{ uri: poster }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : null}
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
      />
    </>
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
}: HeroBannerCarouselProps) => {
  const { width } = useWindowDimensions();
  const baseBannerHeight = Math.min(Math.round(width * 0.6), 330);
  const searchAreaHeight = onSearchPress ? 56 : 0;
  const bannerHeight = baseBannerHeight + searchAreaHeight + topInset;
  const [activeIndex, setActiveIndex] = useState(0);
  // URLs that failed to load. When a banner image errors out we drop
  // that ad back to product-card mode so the slide isn't blank white.
  const [failedBannerUrls, setFailedBannerUrls] = useState<Set<string>>(() => new Set());
  // Same pattern for videos — if the player reports 'error' status
  // (mp4 URL 404, wrong Content-Type, DRM issue, etc.) we mark it and
  // the slide falls through to product-card mode instead of freezing
  // on the poster forever.
  const [failedVideoUrls, setFailedVideoUrls] = useState<Set<string>>(() => new Set());
  const markVideoFailed = useCallback((url: string) => {
    setFailedVideoUrls((prev) => {
      if (prev.has(url)) return prev;
      const next = new Set(prev);
      next.add(url);
      return next;
    });
  }, []);
  const scrollRef = useRef<ScrollView>(null);
  const autoScrollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const isUserDragging = useRef(false);
  const dotScaleAnims = useRef<Animated.Value[]>([]);

  const slides: BannerSlide[] = useMemo(() => {
    if (cards.length > 0) {
      // Dedupe by card.id. The dashboard merges two ad feeds
      // (hero_banner + dashboard_home) and the backend can return the
      // same campaign in both, producing duplicate React keys → React
      // renders one instance correctly and blanks the other (visible as
      // a white slide in the carousel).
      const seen = new Set<string>();
      const uniqueCards = cards.filter((card) => {
        if (!card?.id || seen.has(card.id)) return false;
        seen.add(card.id);
        return true;
      });
      return uniqueCards.map((card) => ({ id: card.id, type: "ad" as const, card }));
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

  // Re-align contentOffset when the viewport width changes (iPad rotation,
  // split view). Each slide is rendered with `width={width}` so slide
  // widths reflow, but the ScrollView's native contentOffset stays at the
  // old pixel value — so activeIndex ends up on a partial slide.
  useEffect(() => {
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ x: activeIndex * width, animated: false });
    }, 0);
    return () => clearTimeout(t);
  }, [width, activeIndex]);

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
    const hasBanner = Boolean(bannerImage) && !failedBannerUrls.has(bannerImage!);
    const videoUrl = card.bannerVideoUrl;
    const hasPlayableVideo =
      isVideoMedia(card) && Boolean(videoUrl) && !failedVideoUrls.has(videoUrl!);
    // Full-bleed media: the admin banner if uploaded, otherwise the product image.
    const heroImage = hasBanner ? bannerImage : productImage;
    const productName = card.title || card.product?.name || "";

    // Clean image banner — banner or product image filling the whole space,
    // tappable straight through to the product. No view / call / chat buttons.
    if (hasPlayableVideo || heroImage) {
      const poster = card.bannerPosterUrl || bannerImage || productImage;
      const isActive = index === activeIndex;
      return (
        <TouchableOpacity
          key={slide.id}
          activeOpacity={0.95}
          onPress={() => onCardPress?.(card)}
          style={{ width, height: bannerHeight }}
        >
          <View style={[StyleSheet.absoluteFill, styles.bannerBackdrop]} />
          {/* Reserve the top notch/status-bar area so the ad's real content
              (video or image) starts BELOW it — otherwise the top 10-20%
              of the ad hides under the notch and users can only reveal it
              by pull-to-refresh bouncing. */}
          <View style={{ position: "absolute", top: topInset, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
            {hasPlayableVideo ? (
              // Data-saver: only the visible slide loads the video; others show the poster.
              isActive ? (
                <BannerVideo uri={videoUrl!} poster={poster} shouldPlay onError={markVideoFailed} />
              ) : poster ? (
                <Image source={{ uri: poster }} style={StyleSheet.absoluteFill} resizeMode="cover" />
              ) : (
                <BannerVideo uri={videoUrl!} poster={poster} shouldPlay={false} onError={markVideoFailed} />
              )
            ) : (
              <Image
                source={{ uri: heroImage! }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
                onError={() => {
                  if (hasBanner) {
                    setFailedBannerUrls((prev) => {
                      if (prev.has(bannerImage!)) return prev;
                      const next = new Set(prev);
                      next.add(bannerImage!);
                      return next;
                    });
                  }
                }}
              />
            )}
          </View>
          {/* Sponsored disclosure — not a CTA */}
          <View style={[styles.adTag, { top: topInset + 12 }]}>
            <Text style={styles.adTagText}>AD</Text>
          </View>
        </TouchableOpacity>
      );
    }

    // No banner and no product image — minimal branded card with just the name.
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
        <View style={[styles.decoCircle1, { backgroundColor: "rgba(255,255,255,0.06)" }]} />
        <View style={[styles.decoCircle2, { backgroundColor: "rgba(255,255,255,0.04)" }]} />
        <View style={[styles.adFallbackContent, { top: 36 + topInset }, onSearchPress ? { bottom: 36 + searchAreaHeight } : null]}>
          <View style={styles.adBadgeSmall}>
            <Text style={styles.adBadgeSmallText}>AD</Text>
          </View>
          <Text style={styles.adCardTitle} numberOfLines={2}>{productName}</Text>
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
        scrollEnabled={slides.length > 1}
        bounces={slides.length > 1}
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
  // Full-bleed image banner
  bannerBackdrop: { backgroundColor: "#0E1230" },
  adTag: {
    position: "absolute",
    left: 16,
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  adTagText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1,
  },
  adFallbackContent: {
    position: "absolute",
    left: 24,
    right: 24,
    gap: 8,
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
