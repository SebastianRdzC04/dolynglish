/**
 * Componente GenerateButton
 * Botón para generar una nueva lectura con animaciones suaves
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
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
      <Animated.View 
        entering={FadeIn.duration(300)} 
        exiting={FadeOut.duration(200)}
        style={styles.limitReachedContainer}
      >
        <Ionicons
          name="information-circle"
          size={16}
          color={Colors.text.secondary}
        />
        <Text style={styles.limitReachedText}>
          Completa alguna lectura para poder generar más
        </Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
    >
      <Button
        icon="add-circle"
        loading={isGenerating}
        onPress={onGenerate}
      >
        {isGenerating ? 'Generando...' : 'Generar nueva lectura'}
      </Button>
    </Animated.View>
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
