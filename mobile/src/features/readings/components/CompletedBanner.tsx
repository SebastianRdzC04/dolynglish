/**
 * Componente CompletedBanner
 * Banner que muestra el resultado de una lectura completada
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Card } from '@/src/shared/components/ui';

interface CompletedBannerProps {
  /** Si aprobó la lectura */
  passed: boolean;
  /** Puntuación obtenida */
  score: number;
}

export function CompletedBanner({ passed, score }: CompletedBannerProps) {
  return (
    <Card style={styles.container}>
      <View style={styles.content}>
        <Ionicons
          name={passed ? 'checkmark-circle' : 'close-circle'}
          size={24}
          color={passed ? Colors.status.success : Colors.status.error}
        />
        <View>
          <Text style={styles.title}>
            {passed ? '¡Completado!' : 'No aprobado'}
          </Text>
          <Text style={styles.score}>
            Puntuación: {score}/100
          </Text>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  score: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
});
