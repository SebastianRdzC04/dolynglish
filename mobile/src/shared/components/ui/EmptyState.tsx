/**
 * Componente EmptyState
 * Mensaje cuando no hay datos para mostrar
 */

import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';

interface EmptyStateProps {
  /** Icono a mostrar */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Título del mensaje */
  title: string;
  /** Subtítulo o descripción */
  subtitle?: string;
  /** Acción opcional (botón, etc.) */
  action?: ReactNode;
  /** Estilos adicionales */
  style?: ViewStyle;
}

export function EmptyState({
  icon = 'albums-outline',
  title,
  subtitle,
  action,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <Ionicons name={icon} size={48} color={Colors.gray.pepper} />
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {action && <View style={styles.actionContainer}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  actionContainer: {
    marginTop: 16,
  },
});
