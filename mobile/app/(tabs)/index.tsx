/**
 * Pantalla principal - Home
 * Muestra el streak y las lecturas pendientes
 */

import { Text, View, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";

// Core
import { Colors } from "@/constants/Colors";

// Features
import { useSession } from "@/src/features/auth";
import { StreakBadge, useStreak } from "@/src/features/streak";
import {
  ReadingList,
  GenerateButton,
  useReadings,
} from "@/src/features/readings";

// Shared
import { Screen, Header, SectionHeader } from "@/src/shared/components/layout";
import { ErrorMessage } from "@/src/shared/components/ui";

export default function HomeScreen() {
  const { user } = useSession();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // Hooks para datos
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
      router.push(`/reading/${result.id}`);
    }
  };

  return (
    <Screen onRefresh={onRefresh} refreshing={refreshing}>
      {/* Header con saludo */}
      <Header
        title={`¡Hola, ${user?.fullName?.split(" ")[0] || "Usuario"}!`}
        subtitle="Continúa aprendiendo"
      />

      {/* Streak Badge */}
      <StreakBadge
        currentStreak={streak?.currentStreak ?? 0}
        completedDays={weekCompletedDays}
        todayIndex={todayIndex}
        isLoading={isLoadingStreak}
      />

      {/* Lecturas disponibles */}
      <View style={styles.section}>
        <SectionHeader
          title="Continuar aprendiendo"
          rightContent={
            pendingInfo.canGenerateMore ? (
              <Text style={styles.pendingCount}>
                {pendingInfo.count}/{pendingInfo.maxPending}
              </Text>
            ) : null
          }
        />

        {/* Estado de error */}
        {error && <ErrorMessage message={error} />}

        {/* Lista de lecturas */}
        <ReadingList
          readings={pendingReadings}
          isLoading={isLoadingPending && !refreshing}
          emptyTitle="No hay lecturas pendientes"
          emptySubtitle="Genera una nueva lectura para comenzar"
          emptyIcon="book-outline"
          onReadingPress={handleReadingPress}
        />

        {/* Botón para generar / mensaje de límite */}
        {pendingReadings.length > 0 || pendingInfo.canGenerateMore ? (
          <GenerateButton
            canGenerate={pendingInfo.canGenerateMore}
            isGenerating={isGenerating}
            onGenerate={handleGenerateReading}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  pendingCount: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: "500",
  },
});
