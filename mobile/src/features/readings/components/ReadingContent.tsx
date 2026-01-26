/**
 * Componente ReadingContent
 * Muestra el contenido completo de una lectura
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Badge, Divider } from '@/src/shared/components/ui';
import { Reading } from '../types';
import { categoryLabels, difficultyLabels, difficultyConfig, getEstimatedTime } from '../utils';

interface ReadingContentProps {
  /** Datos de la lectura */
  reading: Reading;
}

export function ReadingContent({ reading }: ReadingContentProps) {
  const diffConfig = difficultyConfig[reading.difficulty];

  return (
    <View style={styles.container}>
      {/* Metadatos */}
      <View style={styles.metadataContainer}>
        <View style={styles.metadataRow}>
          <View style={styles.categoryBadge}>
            <Ionicons
              name="book-outline"
              size={14}
              color={Colors.accent.primary}
            />
            <Text style={styles.categoryText}>
              {categoryLabels[reading.category] || reading.category}
            </Text>
          </View>

          <Badge
            label={difficultyLabels[reading.difficulty]}
            color={diffConfig.color}
            backgroundColor={diffConfig.bgColor}
          />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="document-text-outline" size={16} color={Colors.text.secondary} />
            <Text style={styles.statText}>
              {reading.wordCount.toLocaleString()} palabras
            </Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="time-outline" size={16} color={Colors.text.secondary} />
            <Text style={styles.statText}>
              ~{getEstimatedTime(reading.wordCount)} min
            </Text>
          </View>
        </View>
      </View>

      {/* Título */}
      <Text style={styles.title}>{reading.title}</Text>

      {/* Descripción */}
      <Text style={styles.description}>{reading.description}</Text>

      <Divider spacing={8} />

      {/* Contenido */}
      <Text style={styles.content}>{reading.content}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  metadataContainer: {
    gap: 12,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryText: {
    fontSize: 13,
    color: Colors.accent.primary,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    lineHeight: 32,
  },
  description: {
    fontSize: 15,
    color: Colors.text.secondary,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  content: {
    fontSize: 17,
    color: Colors.text.primary,
    lineHeight: 28,
  },
});
