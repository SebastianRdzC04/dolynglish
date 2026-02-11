/**
 * Componente ReadingCard
 * Tarjeta que muestra informacion resumida de una lectura
 * Memoizada para evitar re-renders innecesarios en listas
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '@/src/core/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { DifficultyLevel } from '../types';
import { difficultyConfig, getEstimatedTime } from '../utils';

interface ReadingCardProps {
  /** Titulo de la lectura */
  title: string;
  /** Numero de palabras */
  wordCount: number;
  /** Nivel de dificultad */
  difficulty: DifficultyLevel;
  /** Categoria (ya traducida) */
  category?: string;
  /** Tiempo estimado en minutos (calculado automaticamente si no se provee) */
  estimatedTime?: number;
  /** Callback al presionar */
  onPress: () => void;
}

export const ReadingCard = memo(function ReadingCard({
  title,
  wordCount,
  difficulty,
  category,
  estimatedTime,
  onPress,
}: ReadingCardProps) {
  const diffConfig = difficultyConfig[difficulty];
  const time = estimatedTime ?? getEstimatedTime(wordCount);

  // Estado de press para animacion GPU-accelerated
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(pressed.get(), [0, 1], [1, 0.98]) },
    ],
  }));

  return (
    <Pressable
      onPressIn={() => pressed.set(withTiming(1, { duration: 120, easing: Easing.out(Easing.cubic) }))}
      onPressOut={() => pressed.set(withTiming(0, { duration: 150, easing: Easing.out(Easing.cubic) }))}
      onPress={onPress}
    >
      <Animated.View style={[styles.container, animatedStyle]}>
        {/* Header: Categoria + Badge de dificultad */}
        <View style={styles.header}>
          <View style={styles.categoryContainer}>
            <Ionicons name="book-outline" size={16} color={Colors.accent.primary} />
            {category ? <Text style={styles.categoryText}>{category}</Text> : null}
          </View>
          <View
            style={[styles.difficultyBadge, { backgroundColor: diffConfig.bgColor }]}
          >
            <Text style={[styles.difficultyText, { color: diffConfig.color }]}>
              {diffConfig.label}
            </Text>
          </View>
        </View>

        {/* Titulo */}
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
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    borderCurve: 'continuous',
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.light,
    position: 'relative',
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
