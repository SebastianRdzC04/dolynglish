/**
 * Componente SectionHeader
 * Cabecera de sección con título y acciones opcionales
 */

import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';

interface SectionHeaderProps {
  /** Título de la sección */
  title: string;
  /** Contenido del lado derecho (contador, botón, etc.) */
  rightContent?: ReactNode;
  /** Estilos adicionales */
  style?: ViewStyle;
}

export function SectionHeader({ title, rightContent, style }: SectionHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      {rightContent}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
  },
});
