/**
 * Pantalla principal - Home
 * Muestra el streak y las lecturas pendientes
 */

import { useRouter } from "expo-router";
import { useCallback, useState, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

// Core
import { Colors } from "@/constants/Colors";

// Features
import { useSession } from "@/src/features/auth";
import type { GenerateReadingOptions } from "@/src/features/readings";
import {
  GenerateButton,
  GenerateReadingModal,
  SwipeableReadingCard,
  useReadings,
} from "@/src/features/readings";
import { StreakBadge, useStreak } from "@/src/features/streak";

// Shared
import { Header, Screen, SectionHeader } from "@/src/shared/components/layout";
import { EmptyState, ErrorMessage, Loading } from "@/src/shared/components/ui";

export default function HomeScreen() {
  const { user } = useSession();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

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
    deleteReading,
  } = useReadings();

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchStreak(), refetchPending()]);
    setRefreshing(false);
  }, [refetchStreak, refetchPending]);

  // Navegar a lectura
  const handleReadingPress = useCallback((id: number) => {
    router.push(`/reading/${id}`);
  }, [router]);

  // Abrir modal de configuración
  const handleOpenModal = useCallback(() => {
    setIsModalVisible(true);
  }, []);

  // Cerrar modal
  const handleCloseModal = useCallback(() => {
    setIsModalVisible(false);
  }, []);

  // Generar nueva lectura con opciones
  const handleGenerateReading = useCallback(async (options: GenerateReadingOptions) => {
    const result = await generateReading(options);
    if (result) {
      setIsModalVisible(false);
      router.push(`/reading/${result.id}`);
    }
  }, [generateReading, router]);

  // Memoizar el renderizado de las reading cards para evitar re-renders innecesarios
  const readingCardsList = useMemo(() => {
    if (isLoadingPending && !refreshing) {
      return <Loading message="Cargando lecturas..." />;
    }
    
    if (pendingReadings.length === 0) {
      return (
        <EmptyState
          icon="book-outline"
          title="No hay lecturas pendientes"
          subtitle="Genera una nueva lectura para comenzar"
        />
      );
    }
    
    return (
      <View style={styles.readingsList}>
        {pendingReadings.map((reading) => (
          <SwipeableReadingCard
            key={reading.id}
            reading={reading}
            onPress={() => handleReadingPress(reading.id)}
            onDelete={() => deleteReading(reading.id)}
          />
        ))}
      </View>
    );
  }, [pendingReadings, isLoadingPending, refreshing, handleReadingPress, deleteReading]);

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
        {/* Botón para generar / mensaje de límite */}
        {pendingReadings.length > 0 || pendingInfo.canGenerateMore ? (
          <GenerateButton
            canGenerate={pendingInfo.canGenerateMore}
            isGenerating={isGenerating}
            onGenerate={handleOpenModal}
          />
        ) : null}

        {/* Lista de lecturas con swipe para eliminar */}
        {readingCardsList}
      </View>

      {/* Modal de configuración de lectura */}
      <GenerateReadingModal
        visible={isModalVisible}
        isGenerating={isGenerating}
        onClose={handleCloseModal}
        onGenerate={handleGenerateReading}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  readingsList: {
    gap: 12,
  },
  pendingCount: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: "500",
  },
});
