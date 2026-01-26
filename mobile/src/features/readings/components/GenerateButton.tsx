/**
 * Componente GenerateButton
 * Botón para generar una nueva lectura
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button } from '@/src/shared/components/ui';

interface GenerateButtonProps {
  /** Si se puede generar más lecturas */
  canGenerate: boolean;
  /** Si está generando */
  isGenerating: boolean;
  /** Callback al presionar */
  onGenerate: () => void;
}

export function GenerateButton({ canGenerate, isGenerating, onGenerate }: GenerateButtonProps) {
  if (!canGenerate) {
    return (
      <View style={styles.limitReachedContainer}>
        <Ionicons
          name="information-circle"
          size={16}
          color={Colors.text.secondary}
        />
        <Text style={styles.limitReachedText}>
          Completa alguna lectura para poder generar más
        </Text>
      </View>
    );
  }

  return (
    <Button
      icon="add-circle"
      loading={isGenerating}
      onPress={onGenerate}
    >
      {isGenerating ? 'Generando...' : 'Generar nueva lectura'}
    </Button>
  );
}

const styles = StyleSheet.create({
  limitReachedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  limitReachedText: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
});
