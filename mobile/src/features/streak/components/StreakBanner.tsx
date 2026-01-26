/**
 * Componente StreakBanner
 * Banner pequeño para mostrar info de streak después de una evaluación
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';

interface StreakBannerProps {
  /** Racha actual */
  currentStreak: number;
  /** Si la racha fue extendida */
  streakExtended: boolean;
}

export function StreakBanner({ currentStreak, streakExtended }: StreakBannerProps) {
  if (!streakExtended) return null;

  return (
    <View style={styles.container}>
      <Ionicons name="flame" size={24} color={Colors.accent.strong} />
      <View>
        <Text style={styles.title}>¡Racha extendida!</Text>
        <Text style={styles.text}>
          Ahora tienes {currentStreak} días de racha
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    backgroundColor: 'rgba(231, 111, 81, 0.1)',
    padding: 16,
    borderRadius: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.accent.strong,
  },
  text: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
});
