import { View, Text, StyleSheet, Pressable } from "react-native";
import { Colors } from "@/constants/Colors";
import Ionicons from "@expo/vector-icons/Ionicons";

type Difficulty = "easy" | "medium" | "hard";

interface ReadingCardProps {
  title: string;
  wordCount: number;
  difficulty: Difficulty;
  category?: string;
  estimatedTime?: number;
  onPress: () => void;
}

const difficultyConfig: Record<
  Difficulty,
  { label: string; color: string; bgColor: string }
> = {
  easy: {
    label: "Fácil",
    color: Colors.status.success,
    bgColor: "rgba(46, 204, 113, 0.15)",
  },
  medium: {
    label: "Intermedio",
    color: Colors.accent.primary,
    bgColor: "rgba(244, 162, 97, 0.15)",
  },
  hard: {
    label: "Difícil",
    color: Colors.status.error,
    bgColor: "rgba(231, 76, 60, 0.15)",
  },
};

export default function ReadingCard({
  title,
  wordCount,
  difficulty,
  category,
  estimatedTime,
  onPress,
}: ReadingCardProps) {
  const diffConfig = difficultyConfig[difficulty];

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.containerPressed,
      ]}
      onPress={onPress}
    >
      {/* Header: Categoría + Badge de dificultad */}
      <View style={styles.header}>
        <View style={styles.categoryContainer}>
          <Ionicons name="book-outline" size={16} color={Colors.accent.primary} />
          {category && <Text style={styles.categoryText}>{category}</Text>}
        </View>
        <View
          style={[styles.difficultyBadge, { backgroundColor: diffConfig.bgColor }]}
        >
          <Text style={[styles.difficultyText, { color: diffConfig.color }]}>
            {diffConfig.label}
          </Text>
        </View>
      </View>

      {/* Título */}
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>

      {/* Metadatos: palabras y tiempo */}
      <View style={styles.metadata}>
        <Text style={styles.metadataText}>
          {wordCount.toLocaleString()} palabras
        </Text>
        {estimatedTime && (
          <>
            <Text style={styles.metadataSeparator}>•</Text>
            <Text style={styles.metadataText}>{estimatedTime} min</Text>
          </>
        )}
      </View>

      {/* Icono de flecha */}
      <View style={styles.arrowContainer}>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={Colors.gray.pepper}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.light,
    position: "relative",
  },
  containerPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  categoryText: {
    fontSize: 13,
    color: Colors.accent.primary,
    fontWeight: "500",
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: "600",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 8,
    paddingRight: 24,
  },
  metadata: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metadataText: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  metadataSeparator: {
    fontSize: 13,
    color: Colors.gray.pepper,
  },
  arrowContainer: {
    position: "absolute",
    right: 16,
    bottom: 16,
  },
});
