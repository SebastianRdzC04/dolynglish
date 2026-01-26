/**
 * Componente StreakBadge
 * Muestra información de la racha actual del usuario
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Loading, Card, Divider } from '@/src/shared/components/ui';
import { WeeklyProgress } from './WeeklyProgress';

interface StreakBadgeProps {
  /** Número de días de racha actual */
  currentStreak: number;
  /** Array de 7 booleanos [L, M, X, J, V, S, D] indicando días completados */
  completedDays: boolean[];
  /** Índice del día actual (0 = Lunes, 6 = Domingo) */
  todayIndex: number;
  /** Si está cargando los datos */
  isLoading?: boolean;
}

export function StreakBadge({
  currentStreak,
  completedDays,
  todayIndex,
  isLoading = false,
}: StreakBadgeProps) {
  const isStreakActive = currentStreak > 0;
  const todayCompleted = completedDays[todayIndex] ?? false;

  if (isLoading) {
    return (
      <Card>
        <Loading message="Cargando racha..." size="small" />
      </Card>
    );
  }

  return (
    <Card>
      {/* Header con icono de fuego y contador */}
      <View style={styles.header}>
        <View style={styles.streakInfo}>
          <View
            style={[
              styles.fireContainer,
              isStreakActive && styles.fireContainerActive,
            ]}
          >
            <Ionicons
              name="flame"
              size={28}
              color={isStreakActive ? Colors.accent.strong : Colors.gray.pepper}
            />
          </View>
          <View style={styles.streakTextContainer}>
            <Text style={styles.streakNumber}>{currentStreak}</Text>
            <Text style={styles.streakLabel}>
              {currentStreak === 1 ? 'día de racha' : 'días de racha'}
            </Text>
          </View>
        </View>

        {isStreakActive && (
          <View style={styles.badge}>
            <Ionicons name="trophy" size={16} color={Colors.accent.primary} />
            <Text style={styles.badgeText}>¡Sigue así!</Text>
          </View>
        )}
      </View>

      <Divider />

      {/* Progreso semanal */}
      <View style={styles.weeklySection}>
        <Text style={styles.weeklyTitle}>Esta semana</Text>
        <WeeklyProgress completedDays={completedDays} todayIndex={todayIndex} />
      </View>

      {/* Mensaje motivacional */}
      {!todayCompleted && (
        <View style={styles.reminderContainer}>
          <Ionicons
            name="notifications-outline"
            size={16}
            color={Colors.accent.primary}
          />
          <Text style={styles.reminderText}>
            ¡Practica hoy para mantener tu racha!
          </Text>
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fireContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gray.dark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fireContainerActive: {
    backgroundColor: 'rgba(231, 111, 81, 0.2)',
  },
  streakTextContainer: {
    gap: 2,
  },
  streakNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  streakLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(244, 162, 97, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.accent.primary,
  },
  weeklySection: {
    gap: 8,
  },
  weeklyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
  },
  reminderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    backgroundColor: 'rgba(244, 162, 97, 0.1)',
    padding: 12,
    borderRadius: 10,
  },
  reminderText: {
    fontSize: 13,
    color: Colors.accent.primary,
    flex: 1,
  },
});
