/**
 * Componente ReadingContent
 * Muestra el contenido completo de una lectura con oraciones seleccionables
 */

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Badge, Divider } from '@/src/shared/components/ui';
import { Reading } from '../types';
import { getCategoryLabel, difficultyLabels, difficultyConfig, getEstimatedTime } from '../utils';

interface ReadingContentProps {
  /** Datos de la lectura */
  reading: Reading;
  /** Callback cuando se selecciona una oración */
  onSentenceSelect?: (sentence: string, index: number) => void;
}

export function ReadingContent({ reading, onSentenceSelect }: ReadingContentProps) {
  const diffConfig = difficultyConfig[reading.difficulty];
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Dividir contenido en oraciones
  const sentences = useMemo(() => {
    // Regex para dividir por . ! ? pero mantener el signo
    return reading.content.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  }, [reading.content]);

  const handleSentencePress = (sentence: string, index: number) => {
    setSelectedIndex(index);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSentenceSelect?.(sentence, index);
  };

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
              {getCategoryLabel(reading.category)}
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

      {/* Contenido con oraciones seleccionables */}
      <View style={styles.contentContainer}>
        {sentences.map((sentence, index) => (
          <Pressable
            key={index}
            style={({ pressed }) => [
              styles.sentence,
              pressed && styles.sentencePressed,
              selectedIndex === index && styles.sentenceSelected,
            ]}
            onPress={() => handleSentencePress(sentence.trim(), index)}
          >
            <Text style={styles.content}>
              {sentence}{' '}
            </Text>
          </Pressable>
        ))}
      </View>
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
  contentContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sentence: {
    borderRadius: 4,
  },
  sentencePressed: {
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
  },
  sentenceSelected: {
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
    borderRadius: 4,
  },
  content: {
    fontSize: 17,
    color: Colors.text.primary,
    lineHeight: 28,
  },
});
