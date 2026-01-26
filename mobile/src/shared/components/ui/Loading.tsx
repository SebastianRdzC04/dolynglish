/**
 * Componente Loading reutilizable
 * Indicador de carga con mensaje opcional
 */

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';

interface LoadingProps {
  /** Mensaje a mostrar debajo del spinner */
  message?: string;
  /** Tamaño del spinner */
  size?: 'small' | 'large';
  /** Color del spinner */
  color?: string;
  /** Si debe ocupar todo el espacio disponible */
  fullScreen?: boolean;
  /** Estilos adicionales */
  style?: ViewStyle;
}

export function Loading({
  message,
  size = 'large',
  color = Colors.accent.primary,
  fullScreen = false,
  style,
}: LoadingProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen, style]}>
      <ActivityIndicator size={size} color={color} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  fullScreen: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
});
