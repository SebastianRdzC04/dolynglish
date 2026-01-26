/**
 * Componente Header
 * Sección de cabecera para pantallas
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';

interface HeaderProps {
  /** Título principal */
  title: string;
  /** Subtítulo opcional */
  subtitle?: string;
  /** Estilos adicionales */
  style?: ViewStyle;
}

export function Header({ title, subtitle, style }: HeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
});
