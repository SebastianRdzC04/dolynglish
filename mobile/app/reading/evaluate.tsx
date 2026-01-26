import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Colors } from "@/constants/Colors";
import { readingsService } from "@/services/readings.service";
import { EvaluationResult } from "@/types/readings";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function EvaluateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [userResponse, setUserResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<EvaluationResult | null>(null);

  const handleSubmit = async () => {
    if (!userResponse.trim()) {
      setError("Por favor, escribe tu respuesta antes de enviar");
      return;
    }

    if (userResponse.trim().length < 20) {
      setError("Tu respuesta es muy corta. Intenta explicar más lo que entendiste");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const evaluation = await readingsService.evaluate(Number(id), {
        userResponse: userResponse.trim(),
      });

      setResult(evaluation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al evaluar la respuesta");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoHome = () => {
    // Navegar al home y limpiar el stack
    router.replace("/(tabs)");
  };

  const handleViewReading = () => {
    router.back();
  };

  // Mostrar resultado
  if (result) {
    const isPassed = result.passed;

    return (
      <>
        <Stack.Screen options={{ title: "Resultado" }} />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.resultContainer}
        >
          {/* Icono de resultado */}
          <View
            style={[
              styles.resultIconContainer,
              isPassed ? styles.resultIconSuccess : styles.resultIconError,
            ]}
          >
            <Ionicons
              name={isPassed ? "checkmark-circle" : "close-circle"}
              size={64}
              color={isPassed ? Colors.status.success : Colors.status.error}
            />
          </View>

          {/* Título */}
          <Text style={styles.resultTitle}>
            {isPassed ? "¡Felicidades!" : "Sigue practicando"}
          </Text>

          {/* Puntuación */}
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>Tu puntuación</Text>
            <Text
              style={[
                styles.scoreValue,
                { color: isPassed ? Colors.status.success : Colors.status.error },
              ]}
            >
              {result.score}/100
            </Text>
          </View>

          {/* Feedback */}
          <View style={styles.feedbackContainer}>
            <Text style={styles.feedbackLabel}>Retroalimentación</Text>
            <Text style={styles.feedbackText}>{result.feedback}</Text>
          </View>

          {/* Streak info si pasó */}
          {result.streak && result.streak.streakExtended && (
            <View style={styles.streakBanner}>
              <Ionicons name="flame" size={24} color={Colors.accent.strong} />
              <View>
                <Text style={styles.streakTitle}>¡Racha extendida!</Text>
                <Text style={styles.streakText}>
                  Ahora tienes {result.streak.currentStreak} días de racha
                </Text>
              </View>
            </View>
          )}

          {/* Mensaje de no aprobado */}
          {!isPassed && (
            <View style={styles.tipContainer}>
              <Ionicons
                name="bulb-outline"
                size={20}
                color={Colors.accent.primary}
              />
              <Text style={styles.tipText}>
                Necesitas 80 puntos o más para aprobar. Intenta releer el texto y
                enfocarte en la idea principal.
              </Text>
            </View>
          )}

          {/* Botones */}
          <View style={styles.resultButtons}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleGoHome}
            >
              <Ionicons name="home" size={20} color={Colors.text.primary} />
              <Text style={styles.primaryButtonText}>Ir al inicio</Text>
            </Pressable>

            {!isPassed && (
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleViewReading}
              >
                <Ionicons name="book" size={20} color={Colors.accent.primary} />
                <Text style={styles.secondaryButtonText}>Volver a leer</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Evaluar comprensión" }} />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.formContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Instrucciones */}
          <View style={styles.instructionsContainer}>
            <Ionicons
              name="information-circle"
              size={24}
              color={Colors.accent.primary}
            />
            <Text style={styles.instructionsText}>
              Escribe en español o inglés lo que entendiste del texto. Explica la
              idea principal con tus propias palabras.
            </Text>
          </View>

          {/* Input de respuesta */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Tu respuesta</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Escribe aquí lo que entendiste del texto..."
              placeholderTextColor={Colors.gray.pepper}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              value={userResponse}
              onChangeText={setUserResponse}
              editable={!isSubmitting}
            />
            <Text style={styles.charCount}>
              {userResponse.length} caracteres
            </Text>
          </View>

          {/* Error */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={18} color={Colors.status.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Botón de enviar */}
          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              pressed && styles.buttonPressed,
              isSubmitting && styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <ActivityIndicator size="small" color={Colors.text.primary} />
                <Text style={styles.submitButtonText}>Evaluando...</Text>
              </>
            ) : (
              <>
                <Ionicons name="send" size={20} color={Colors.text.primary} />
                <Text style={styles.submitButtonText}>Enviar respuesta</Text>
              </>
            )}
          </Pressable>

          {/* Tip */}
          <View style={styles.tipContainer}>
            <Ionicons name="bulb-outline" size={18} color={Colors.text.secondary} />
            <Text style={styles.tipTextSmall}>
              Tip: No necesitas repetir el texto palabra por palabra. Explica la
              idea principal con tus propias palabras.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  formContainer: {
    padding: 20,
    gap: 20,
  },
  resultContainer: {
    padding: 20,
    alignItems: "center",
    gap: 20,
    paddingTop: 40,
  },
  instructionsContainer: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "rgba(244, 162, 97, 0.1)",
    padding: 16,
    borderRadius: 12,
    alignItems: "flex-start",
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  textInput: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text.primary,
    minHeight: 200,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  charCount: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: "right",
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
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.accent.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  tipContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "flex-start",
    paddingVertical: 8,
  },
  tipTextSmall: {
    flex: 1,
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  // Resultado
  resultIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  resultIconSuccess: {
    backgroundColor: "rgba(46, 204, 113, 0.1)",
  },
  resultIconError: {
    backgroundColor: "rgba(231, 76, 60, 0.1)",
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.text.primary,
    textAlign: "center",
  },
  scoreContainer: {
    alignItems: "center",
    gap: 4,
  },
  scoreLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: "bold",
  },
  feedbackContainer: {
    width: "100%",
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  feedbackLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.secondary,
  },
  feedbackText: {
    fontSize: 16,
    color: Colors.text.primary,
    lineHeight: 24,
  },
  streakBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    width: "100%",
    backgroundColor: "rgba(231, 111, 81, 0.1)",
    padding: 16,
    borderRadius: 12,
  },
  streakTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.accent.strong,
  },
  streakText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: Colors.accent.primary,
    lineHeight: 20,
  },
  resultButtons: {
    width: "100%",
    gap: 12,
    marginTop: 16,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.accent.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "transparent",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accent.primary,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.accent.primary,
  },
});
