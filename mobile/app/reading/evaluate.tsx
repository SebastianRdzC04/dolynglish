/**
 * Pantalla de evaluación
 * Permite al usuario enviar su comprensión del texto
 */

import { ScrollView, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Colors } from "@/constants/Colors";

// Features
import {
  EvaluationForm,
  EvaluationResultView,
  useEvaluation,
} from "@/src/features/readings";

export default function EvaluateScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { result, isSubmitting, error, submit } = useEvaluation(Number(id));

  // Handlers
  const handleSubmit = (userResponse: string) => {
    submit(userResponse);
  };

  const handleGoHome = () => {
    router.replace("/(tabs)");
  };

  const handleRetry = () => {
    router.back();
  };

  // Mostrar resultado si existe
  if (result) {
    return (
      <>
        <Stack.Screen options={{ title: "Resultado" }} />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.resultContainer}
        >
          <EvaluationResultView
            result={result}
            onGoHome={handleGoHome}
            onRetry={handleRetry}
          />
        </ScrollView>
      </>
    );
  }

  // Mostrar formulario
  return (
    <>
      <Stack.Screen options={{ title: "Evaluar comprensión" }} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.formContainer}
        keyboardShouldPersistTaps="handled"
      >
        <EvaluationForm
          isSubmitting={isSubmitting}
          error={error}
          onSubmit={handleSubmit}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  formContainer: {
    padding: 20,
  },
  resultContainer: {
    padding: 20,
  },
});
