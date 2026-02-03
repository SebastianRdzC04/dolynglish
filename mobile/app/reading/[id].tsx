/**
 * Pantalla de lectura individual
 * Muestra el contenido completo de una lectura con funcionalidad de explicación
 */

import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Colors } from "@/constants/Colors";

// Features
import {
  ReadingContent,
  CompletedBanner,
  ExplanationModal,
  useReading,
  useExplanation,
} from "@/src/features/readings";

// Shared
import { Screen } from "@/src/shared/components/layout";
import { Loading, ErrorMessage, Button } from "@/src/shared/components/ui";

export default function ReadingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { reading, isLoading, error } = useReading(Number(id));
  
  // Estado para explicaciones
  const [selectedSentence, setSelectedSentence] = useState<string | null>(null);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const { 
    explanation, 
    isLoading: isLoadingExplanation, 
    error: explanationError,
    rateLimitInfo,
    fromCache,
    requestExplanation,
    clear: clearExplanation
  } = useExplanation(Number(id));

  // Navegar a evaluación
  const handleEvaluate = () => {
    router.push(`/reading/evaluate?id=${id}`);
  };

  // Handler para selección de oración
  const handleSentenceSelect = async (sentence: string) => {
    setSelectedSentence(sentence);
    setShowExplanationModal(true);
    await requestExplanation(sentence);
  };

  // Handler para cerrar modal
  const handleCloseExplanation = () => {
    setShowExplanationModal(false);
    clearExplanation();
    setSelectedSentence(null);
  };

  // Handler para reintentar
  const handleRetryExplanation = () => {
    if (selectedSentence) {
      requestExplanation(selectedSentence);
    }
  };

  if (isLoading) {
    return <Loading fullScreen message="Cargando lectura..." />;
  }

  if (error || !reading) {
    return (
      <View style={styles.errorContainer}>
        <ErrorMessage
          message={error || "Lectura no encontrada"}
          variant="fullscreen"
        />
        <Button variant="secondary" onPress={() => router.back()}>
          Volver
        </Button>
      </View>
    );
  }

  const isCompleted = reading.status === "completed";

  return (
    <>
      <Stack.Screen
        options={{
          title:
            reading.title.length > 25
              ? reading.title.substring(0, 25) + "..."
              : reading.title,
        }}
      />

      <Screen
        contentStyle={styles.scrollContent}
        paddingVertical={20}
      >
        {/* Contenido de la lectura con callback de selección */}
        <ReadingContent 
          reading={reading} 
          onSentenceSelect={handleSentenceSelect}
        />

        {/* Estado de completado */}
        {isCompleted && reading.score !== null && (
          <CompletedBanner
            passed={reading.passed ?? false}
            score={reading.score}
          />
        )}
      </Screen>

      {/* Modal de explicación */}
      <ExplanationModal
        visible={showExplanationModal}
        explanation={explanation}
        isLoading={isLoadingExplanation}
        error={explanationError}
        rateLimitInfo={rateLimitInfo}
        fromCache={fromCache}
        onClose={handleCloseExplanation}
        onRetry={handleRetryExplanation}
      />

      {/* Botón de evaluación (solo si no está completado) */}
      {!isCompleted && (
        <View style={styles.footer}>
          <Button icon="arrow-forward" iconPosition="right" onPress={handleEvaluate}>
            Terminé de leer - Evaluar comprensión
          </Button>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 100, // Espacio para el botón flotante
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 20,
    backgroundColor: Colors.background.primary,
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
});
