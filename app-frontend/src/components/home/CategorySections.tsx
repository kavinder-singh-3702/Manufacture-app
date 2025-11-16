import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Typography } from "../common/Typography";
import { useTheme } from "../../hooks/useTheme";

export type CategoryItem = {
  id: string;
  label: string;
  detail: string;
};

export type CategorySectionData = {
  id: string;
  title: string;
  highlight: string;
  theme: string;
  items: readonly CategoryItem[];
};

type CategorySectionsProps = {
  sections: readonly CategorySectionData[];
  onViewAll?: (sectionId: string) => void;
  onItemPress?: (sectionId: string, itemId: string) => void;
};

export const CategorySections = ({ sections, onViewAll, onItemPress }: CategorySectionsProps) => {
  const { spacing } = useTheme();

  return (
    <View style={{ gap: spacing.md, marginTop: spacing.md }}>
      {sections.map((section) => (
        <CategoryCard
          key={section.id}
          section={section}
          onViewAll={onViewAll}
          onItemPress={onItemPress}
        />
      ))}
    </View>
  );
};

const CategoryCard = ({
  section,
  onViewAll,
  onItemPress,
}: {
  section: CategorySectionData;
  onViewAll?: (sectionId: string) => void;
  onItemPress?: (sectionId: string, itemId: string) => void;
}) => {
  const { spacing } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: section.theme }]}>
      <View style={styles.header}>
        <View>
          <Typography variant="body" style={styles.title}>
            {section.title}
          </Typography>
          <Text style={styles.highlight}>{section.highlight}</Text>
        </View>
        <TouchableOpacity style={styles.viewAll} onPress={() => onViewAll?.(section.id)}>
          <Text style={styles.viewAllText}>View</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.body, { marginTop: spacing.md }]}>
        <View style={styles.imagePlaceholder}>
          <View style={styles.circleLarge} />
          <View style={styles.circleSmall} />
          <Text style={styles.imageLabel}>{section.highlight.split(" ")[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          {section.items.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.itemRow}
              onPress={() => onItemPress?.(section.id, item.id)}
            >
              <View>
                <Text style={styles.itemLabel}>{item.label}</Text>
                <Text style={styles.itemDetail}>{item.detail}</Text>
              </View>
              <Text style={styles.itemIcon}>&gt;</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
  },
  highlight: {
    marginTop: 4,
    color: "#475467",
  },
  viewAll: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.2)",
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "600",
  },
  body: {
    flexDirection: "row",
  },
  imagePlaceholder: {
    width: 90,
    height: 110,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.7)",
    marginRight: 16,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  circleLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#CDEAE5",
  },
  circleSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#7DC8BA",
    position: "absolute",
    bottom: 16,
    right: 12,
  },
  imageLabel: {
    position: "absolute",
    bottom: 12,
    left: 12,
    fontWeight: "600",
    color: "#0F172A",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(15, 23, 42, 0.1)",
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },
  itemDetail: {
    fontSize: 13,
    color: "#475467",
    marginTop: 2,
  },
  itemIcon: {
    fontSize: 18,
    color: "#0F172A",
    marginLeft: 12,
  },
});
