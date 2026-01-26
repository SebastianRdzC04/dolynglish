import {
  Text,
  View,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from "react-native";
import { Colors } from "@/constants/Colors";
import { useSession } from "@/context/AuthContext";
import StreakBadge from "@/Components/StreakBadge";
import ReadingCard from "@/Components/ReadingCard";
import { useStreak } from "@/hooks/useStreak";
import { useReadings } from "@/hooks/useReadings";
import { categoryLabels, getEstimatedTime } from "@/types/readings";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function Index() {
  const { user } = useSession();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // Hooks para datos reales
  const {
    streak,
    weekCompletedDays,
    todayIndex,
    isLoading: isLoadingStreak,
    refetch: refetchStreak,
  } = useStreak();

  const {
    pendingReadings,
    pendingInfo,
    isLoadingPending,
    isGenerating,
    error,
    refetchPending,
    generateReading,
  } = useReadings();

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStreak(), refetchPending()]);
    setRefreshing(false);
  }, [refetchStreak, refetchPending]);

  // Navegar a lectura
  const handleReadingPress = (id: number) => {
    router.push(`/reading/${id}`);
  };

  // Generar nueva lectura
  const handleGenerateReading = async () => {
    const result = await generateReading();
    if (result) {
      // Navegar a la nueva lectura
      router.push(`/reading/${result.id}`);
    }
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.accent.primary}
          colors={[Colors.accent.primary]}
        />
      }
    >
      <View style={styles.container}>
        {/* Header con saludo */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            ¡Hola, {user?.fullName?.split(" ")[0] || "Usuario"}!
          </Text>
          <Text style={styles.subtitle}>Continúa aprendiendo</Text>
        </View>

        {/* Streak Badge */}
        <StreakBadge
          currentStreak={streak?.currentStreak ?? 0}
          completedDays={weekCompletedDays}
          todayIndex={todayIndex}
          isLoading={isLoadingStreak}
        />

        {/* Lecturas disponibles */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Continuar aprendiendo</Text>
            {pendingInfo.canGenerateMore && (
              <Text style={styles.pendingCount}>
                {pendingInfo.count}/{pendingInfo.maxPending}
              </Text>
            )}
          </View>

          {/* Estado de error */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color={Colors.status.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Loading */}
          {isLoadingPending && !refreshing ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.accent.primary} />
              <Text style={styles.loadingText}>Cargando lecturas...</Text>
            </View>
          ) : (
            <View style={styles.readingsContainer}>
              {/* Lista de lecturas pendientes */}
              {pendingReadings.length > 0 ? (
                pendingReadings.map((reading) => (
                  <ReadingCard
                    key={reading.id}
                    title={reading.title}
                    wordCount={reading.wordCount}
                    difficulty={reading.difficulty}
                    category={categoryLabels[reading.category] || reading.category}
                    estimatedTime={getEstimatedTime(reading.wordCount)}
                    onPress={() => handleReadingPress(reading.id)}
                  />
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name="book-outline"
                    size={48}
                    color={Colors.gray.pepper}
                  />
                  <Text style={styles.emptyTitle}>No hay lecturas pendientes</Text>
                  <Text style={styles.emptySubtitle}>
                    Genera una nueva lectura para comenzar
                  </Text>
                </View>
              )}

              {/* Botón para generar nueva lectura */}
              {pendingInfo.canGenerateMore && (
                <Pressable
                  style={({ pressed }) => [
                    styles.generateButton,
                    pressed && styles.generateButtonPressed,
                    isGenerating && styles.generateButtonDisabled,
                  ]}
                  onPress={handleGenerateReading}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <ActivityIndicator size="small" color={Colors.text.primary} />
                      <Text style={styles.generateButtonText}>Generando...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="add-circle" size={24} color={Colors.text.primary} />
                      <Text style={styles.generateButtonText}>
                        Generar nueva lectura
                      </Text>
                    </>
                  )}
                </Pressable>
              )}

              {/* Mensaje cuando no puede generar más */}
              {!pendingInfo.canGenerateMore && pendingReadings.length > 0 && (
                <View style={styles.limitReachedContainer}>
                  <Ionicons
                    name="information-circle"
                    size={16}
                    color={Colors.text.secondary}
                  />
                  <Text style={styles.limitReachedText}>
                    Completa alguna lectura para poder generar más
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 24,
  },
  header: {
    gap: 4,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  pendingCount: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: "500",
  },
  readingsContainer: {
    gap: 12,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(231, 76, 60, 0.1)",
    padding: 12,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 14,
    color: Colors.status.error,
    flex: 1,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.accent.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 4,
  },
  generateButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  limitReachedContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    justifyContent: "center",
  },
  limitReachedText: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
});
