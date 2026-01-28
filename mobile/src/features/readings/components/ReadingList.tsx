/**
 * Componente ReadingList
 * Lista de lecturas con estados de carga y vacío
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Loading, EmptyState } from '@/src/shared/components/ui';
import { Reading } from '../types';
import { getCategoryLabel, getEstimatedTime } from '../utils';
import { ReadingCard } from './ReadingCard';

interface ReadingListProps {
  /** Lista de lecturas */
  readings: Reading[];
  /** Si está cargando */
  isLoading?: boolean;
  /** Mensaje cuando la lista está vacía */
  emptyTitle?: string;
  /** Subtítulo cuando la lista está vacía */
  emptySubtitle?: string;
  /** Icono cuando la lista está vacía */
  emptyIcon?: 'book-outline' | 'albums-outline' | 'checkmark-done-outline';
  /** Callback al presionar una lectura */
  onReadingPress: (id: number) => void;
  /** Estilos adicionales */
  style?: ViewStyle;
}

export function ReadingList({
  readings,
  isLoading = false,
  emptyTitle = 'No hay lecturas',
  emptySubtitle,
  emptyIcon = 'book-outline',
  onReadingPress,
  style,
}: ReadingListProps) {
  if (isLoading) {
    return <Loading message="Cargando lecturas..." />;
  }

  if (readings.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        subtitle={emptySubtitle}
      />
    );
  }

  return (
    <View style={[styles.container, style]}>
      {readings.map((reading) => (
        <ReadingCard
          key={reading.id}
          title={reading.title}
          wordCount={reading.wordCount}
          difficulty={reading.difficulty}
          category={getCategoryLabel(reading.category)}
          estimatedTime={getEstimatedTime(reading.wordCount)}
          onPress={() => onReadingPress(reading.id)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
});
