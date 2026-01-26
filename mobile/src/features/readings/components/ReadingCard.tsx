/**
 * Componente ReadingCard
 * Tarjeta que muestra información resumida de una lectura
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Colors } from '@/constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DifficultyLevel } from '../types';
import { difficultyConfig, getEstimatedTime } from '../utils';

interface ReadingCardProps {
  /** Título de la lectura */
  title: string;
  /** Número de palabras */
  wordCount: number;
  /** Nivel de dificultad */
  difficulty: DifficultyLevel;
  /** Categoría (ya traducida) */
  category?: string;
  /** Tiempo estimado en minutos (calculado automáticamente si no se provee) */
  estimatedTime?: number;
  /** Callback al presionar */
  onPress: () => void;
}

export function ReadingCard({
  title,
  wordCount,
  difficulty,
  category,
  estimatedTime,
  onPress,
}: ReadingCardProps) {
  const diffConfig = difficultyConfig[difficulty];
  const time = estimatedTime ?? getEstimatedTime(wordCount);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.containerPressed,
      ]}
      onPress={onPress}
    >
      {/* Header: Categoría + Badge de dificultad */}
      <View style={styles.header}>
        <View style={styles.categoryContainer}>
          <Ionicons name="book-outline" size={16} color={Colors.accent.primary} />
          {category && <Text style={styles.categoryText}>{category}</Text>}
        </View>
        <View
          style={[styles.difficultyBadge, { backgroundColor: diffConfig.bgColor }]}
        >
          <Text style={[styles.difficultyText, { color: diffConfig.color }]}>
            {diffConfig.label}
          </Text>
        </View>
      </View>

      {/* Título */}
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>

      {/* Metadatos: palabras y tiempo */}
      <View style={styles.metadata}>
        <Text style={styles.metadataText}>
          {wordCount.toLocaleString()} palabras
        </Text>
        <Text style={styles.metadataSeparator}>•</Text>
        <Text style={styles.metadataText}>{time} min</Text>
      </View>

      {/* Icono de flecha */}
      <View style={styles.arrowContainer}>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={Colors.gray.pepper}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.light,
    position: 'relative',
  },
  containerPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryText: {
    fontSize: 13,
    color: Colors.accent.primary,
    fontWeight: '500',
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 8,
    paddingRight: 24,
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metadataText: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  metadataSeparator: {
    fontSize: 13,
    color: Colors.gray.pepper,
  },
  arrowContainer: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
