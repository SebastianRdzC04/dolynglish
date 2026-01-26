import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Colors } from "@/constants/Colors";
import { useReading } from "@/hooks/useReadings";
import {
  categoryLabels,
  difficultyLabels,
  getEstimatedTime,
} from "@/types/readings";
import Ionicons from "@expo/vector-icons/Ionicons";

const difficultyColors = {
  easy: Colors.status.success,
  medium: Colors.accent.primary,
  hard: Colors.status.error,
};

export default function ReadingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { reading, isLoading, error } = useReading(Number(id));

  // Navegar a evaluación
  const handleEvaluate = () => {
    router.push(`/reading/evaluate?id=${id}`);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.accent.primary} />
        <Text style={styles.loadingText}>Cargando lectura...</Text>
      </View>
    );
  }

  if (error || !reading) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={48} color={Colors.status.error} />
        <Text style={styles.errorTitle}>Error al cargar</Text>
        <Text style={styles.errorText}>{error || "Lectura no encontrada"}</Text>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const isCompleted = reading.status === "completed";
  const difficultyColor = difficultyColors[reading.difficulty];

  return (
    <>
      <Stack.Screen
        options={{
          title: reading.title.length > 25 
            ? reading.title.substring(0, 25) + "..." 
            : reading.title,
        }}
      />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.container}>
          {/* Metadatos */}
          <View style={styles.metadataContainer}>
            <View style={styles.metadataRow}>
              <View style={styles.categoryBadge}>
                <Ionicons
                  name="book-outline"
                  size={14}
                  color={Colors.accent.primary}
                />
                <Text style={styles.categoryText}>
                  {categoryLabels[reading.category] || reading.category}
                </Text>
              </View>

              <View
                style={[
                  styles.difficultyBadge,
                  { backgroundColor: `${difficultyColor}20` },
                ]}
              >
                <Text style={[styles.difficultyText, { color: difficultyColor }]}>
                  {difficultyLabels[reading.difficulty]}
                </Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Ionicons name="document-text-outline" size={16} color={Colors.text.secondary} />
                <Text style={styles.statText}>
                  {reading.wordCount.toLocaleString()} palabras
                </Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="time-outline" size={16} color={Colors.text.secondary} />
                <Text style={styles.statText}>
                  ~{getEstimatedTime(reading.wordCount)} min
                </Text>
              </View>
            </View>
          </View>

          {/* Título */}
          <Text style={styles.title}>{reading.title}</Text>

          {/* Descripción */}
          <Text style={styles.description}>{reading.description}</Text>

          {/* Separador */}
          <View style={styles.divider} />

          {/* Contenido */}
          <Text style={styles.content}>{reading.content}</Text>

          {/* Estado de completado */}
          {isCompleted && (
            <View style={styles.completedBanner}>
              <View style={styles.completedInfo}>
                <Ionicons
                  name={reading.passed ? "checkmark-circle" : "close-circle"}
                  size={24}
                  color={reading.passed ? Colors.status.success : Colors.status.error}
                />
                <View>
                  <Text style={styles.completedTitle}>
                    {reading.passed ? "¡Completado!" : "No aprobado"}
                  </Text>
                  <Text style={styles.completedScore}>
                    Puntuación: {reading.score}/100
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Botón de evaluación (solo si no está completado) */}
      {!isCompleted && (
        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.evaluateButton,
              pressed && styles.evaluateButtonPressed,
            ]}
            onPress={handleEvaluate}
          >
            <Text style={styles.evaluateButtonText}>
              Terminé de leer - Evaluar comprensión
            </Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.text.primary} />
          </Pressable>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100, // Espacio para el botón flotante
  },
  container: {
    padding: 20,
    gap: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
  },
  backButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Colors.accent.primary,
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  metadataContainer: {
    gap: 12,
  },
  metadataRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
  statsRow: {
    flexDirection: "row",
    gap: 20,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text.primary,
    lineHeight: 32,
  },
  description: {
    fontSize: 15,
    color: Colors.text.secondary,
    lineHeight: 22,
    fontStyle: "italic",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: 8,
  },
  content: {
    fontSize: 17,
    color: Colors.text.primary,
    lineHeight: 28,
  },
  completedBanner: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  completedInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  completedTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  completedScore: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  evaluateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.accent.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  evaluateButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  evaluateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
  },
});
