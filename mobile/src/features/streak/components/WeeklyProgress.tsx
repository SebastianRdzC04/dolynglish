/**
 * Componente WeeklyProgress
 * Muestra el progreso semanal de lunes a domingo
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { WEEK_DAYS } from '@/src/core/config';
import { ProgressDay } from './ProgressDay';

interface WeeklyProgressProps {
  /** Array de 7 días [L, M, X, J, V, S, D] indicando completados */
  completedDays: boolean[];
  /** Índice del día actual (0 = Lunes, 6 = Domingo) */
  todayIndex: number;
}

export function WeeklyProgress({ completedDays, todayIndex }: WeeklyProgressProps) {
  return (
    <View style={styles.container}>
      <View style={styles.progressLine} />
      <View style={styles.daysContainer}>
        {WEEK_DAYS.map((day, index) => (
          <ProgressDay
            key={day}
            day={day}
            isCompleted={completedDays[index] ?? false}
            isToday={index === todayIndex}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    paddingVertical: 8,
  },
  progressLine: {
    position: 'absolute',
    top: 24,
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: Colors.gray.dark,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
});
