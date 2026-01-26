/**
 * Componente EvaluationResult
 * Muestra el resultado de una evaluación
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button, Card } from '@/src/shared/components/ui';
import { StreakBanner } from '../../streak/components';
import { EvaluationResult as EvaluationResultType } from '../types';
import { APP_CONFIG } from '@/src/core/config';

interface EvaluationResultProps {
  /** Resultado de la evaluación */
  result: EvaluationResultType;
  /** Callback para ir al inicio */
  onGoHome: () => void;
  /** Callback para volver a leer */
  onRetry: () => void;
}

export function EvaluationResultView({ result, onGoHome, onRetry }: EvaluationResultProps) {
  const isPassed = result.passed;

  return (
    <View style={styles.container}>
      {/* Icono de resultado */}
      <View
        style={[
          styles.resultIconContainer,
          isPassed ? styles.resultIconSuccess : styles.resultIconError,
        ]}
      >
        <Ionicons
          name={isPassed ? 'checkmark-circle' : 'close-circle'}
          size={64}
          color={isPassed ? Colors.status.success : Colors.status.error}
        />
      </View>

      {/* Título */}
      <Text style={styles.resultTitle}>
        {isPassed ? '¡Felicidades!' : 'Sigue practicando'}
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
      <Card style={styles.feedbackCard}>
        <Text style={styles.feedbackLabel}>Retroalimentación</Text>
        <Text style={styles.feedbackText}>{result.feedback}</Text>
      </Card>

      {/* Streak info si pasó */}
      {result.streak && result.streak.streakExtended && (
        <StreakBanner
          currentStreak={result.streak.currentStreak}
          streakExtended={result.streak.streakExtended}
        />
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
            Necesitas {APP_CONFIG.PASSING_SCORE} puntos o más para aprobar. Intenta releer el texto y
            enfocarte en la idea principal.
          </Text>
        </View>
      )}

      {/* Botones */}
      <View style={styles.resultButtons}>
        <Button icon="home" onPress={onGoHome}>
          Ir al inicio
        </Button>

        {!isPassed && (
          <Button variant="secondary" icon="book" onPress={onRetry}>
            Volver a leer
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 20,
    paddingTop: 40,
  },
  resultIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultIconSuccess: {
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
  },
  resultIconError: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  scoreContainer: {
    alignItems: 'center',
    gap: 4,
  },
  scoreLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  feedbackCard: {
    width: '100%',
  },
  feedbackLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 16,
    color: Colors.text.primary,
    lineHeight: 24,
  },
  tipContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    paddingVertical: 8,
    width: '100%',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: Colors.accent.primary,
    lineHeight: 20,
  },
  resultButtons: {
    width: '100%',
    gap: 12,
    marginTop: 16,
  },
});
