/**
 * Pantalla de lectura individual
 * Muestra el contenido completo de una lectura con funcionalidad de explicación
 * Soporta selección libre de texto para consultar explicaciones
 */

import { useState, useCallback } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { Colors } from "@/src/core/theme";

// Features
import {
  ReadingContent,
  CompletedBanner,
  ExplanationModal,
  SelectionToolbar,
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

  // Estado para selección de texto y explicaciones
  const [selectedText, setSelectedText] = useState<string>("");
  const [hasSelection, setHasSelection] = useState(false);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const {
    explanation,
    isLoading: isLoadingExplanation,
    error: explanationError,
    rateLimitInfo,
    fromCache,
    requestExplanation,
    clear: clearExplanation,
  } = useExplanation(Number(id));

  // Navegar a evaluación
  const handleEvaluate = () => {
    router.push(`/reading/evaluate?id=${id}`);
  };

  // Handler para cuando el usuario selecciona texto
  const handleTextSelect = useCallback((text: string) => {
    setSelectedText(text);
  }, []);

  // Handler para cambio de estado de selección
  const handleSelectionChange = useCallback((selected: boolean) => {
    setHasSelection(selected);
    if (!selected) {
      setSelectedText("");
    }
  }, []);

  // Handler para explicar texto seleccionado
  const handleExplain = useCallback(
    async (text: string) => {
      setShowExplanationModal(true);
      await requestExplanation(text);
    },
    [requestExplanation]
  );

  // Handler para copiar texto seleccionado
  const handleCopy = useCallback(async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert("Copied", "Text copied to clipboard");
    } catch {
      Alert.alert("Error", "Could not copy text");
    }
  }, []);

  // Handler para cerrar modal
  const handleCloseExplanation = () => {
    setShowExplanationModal(false);
    clearExplanation();
  };

  // Handler para reintentar
  const handleRetryExplanation = () => {
    if (selectedText) {
      requestExplanation(selectedText);
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
        {/* Contenido de la lectura con selección de texto */}
        <ReadingContent
          reading={reading}
          onTextSelect={handleTextSelect}
          onSelectionChange={handleSelectionChange}
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

      {/* Toolbar de selección (aparece cuando hay texto seleccionado) */}
      {!showExplanationModal && (
        <SelectionToolbar
          visible={hasSelection}
          selectedText={selectedText}
          isLoading={isLoadingExplanation}
          onExplain={handleExplain}
          onCopy={handleCopy}
        />
      )}

      {/* Botón de evaluación (solo si no está completado y no hay selección activa) */}
      {!isCompleted && !hasSelection && (
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
    paddingBottom: 100, // Espacio para el botón flotante o toolbar
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
