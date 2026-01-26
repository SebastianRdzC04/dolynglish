/**
 * Componente ProgressDay
 * Indica el estado de un día individual en el progreso semanal
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';

interface ProgressDayProps {
  /** Etiqueta del día (L, M, X, etc.) */
  day: string;
  /** Si el día está completado */
  isCompleted: boolean;
  /** Si es el día actual */
  isToday: boolean;
}

export function ProgressDay({ day, isCompleted, isToday }: ProgressDayProps) {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.circle,
          isCompleted && styles.circleCompleted,
          isToday && !isCompleted && styles.circleToday,
        ]}
      >
        {isCompleted ? (
          <Ionicons name="checkmark" size={16} color={Colors.text.primary} />
        ) : (
          <View style={[styles.innerDot, isToday && styles.innerDotToday]} />
        )}
      </View>
      <Text
        style={[
          styles.dayText,
          isCompleted && styles.dayTextCompleted,
          isToday && styles.dayTextToday,
        ]}
      >
        {day}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 6,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background.secondary,
    borderWidth: 2,
    borderColor: Colors.gray.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleCompleted: {
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.accent.primary,
  },
  circleToday: {
    borderColor: Colors.accent.strong,
    borderWidth: 2,
  },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.gray.dark,
  },
  innerDotToday: {
    backgroundColor: Colors.accent.strong,
  },
  dayText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text.secondary,
  },
  dayTextCompleted: {
    color: Colors.accent.primary,
  },
  dayTextToday: {
    color: Colors.accent.strong,
    fontWeight: '700',
  },
});
