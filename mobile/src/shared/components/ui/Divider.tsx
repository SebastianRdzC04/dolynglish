/**
 * Componente Divider
 * Línea divisoria horizontal o vertical
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';

interface DividerProps {
  /** Orientación */
  direction?: 'horizontal' | 'vertical';
  /** Margen vertical (horizontal divider) u horizontal (vertical divider) */
  spacing?: number;
  /** Estilos adicionales */
  style?: ViewStyle;
}

export function Divider({
  direction = 'horizontal',
  spacing = 16,
  style,
}: DividerProps) {
  const marginStyle = direction === 'horizontal'
    ? { marginVertical: spacing }
    : { marginHorizontal: spacing };

  return (
    <View
      style={[
        styles.base,
        direction === 'horizontal' ? styles.horizontal : styles.vertical,
        marginStyle,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.border.light,
  },
  horizontal: {
    height: 1,
    width: '100%',
  },
  vertical: {
    width: 1,
    height: '100%',
  },
});
