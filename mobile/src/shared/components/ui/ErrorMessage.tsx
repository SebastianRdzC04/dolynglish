/**
 * Componente ErrorMessage reutilizable
 * Muestra mensajes de error con icono
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';

interface ErrorMessageProps {
  /** Mensaje de error a mostrar */
  message: string;
  /** Variante visual */
  variant?: 'inline' | 'banner' | 'fullscreen';
  /** Callback para reintentar */
  onRetry?: () => void;
  /** Estilos adicionales */
  style?: ViewStyle;
}

export function ErrorMessage({
  message,
  variant = 'inline',
  style,
}: ErrorMessageProps) {
  if (variant === 'fullscreen') {
    return (
      <View style={[styles.fullscreen, style]}>
        <Ionicons name="alert-circle" size={48} color={Colors.status.error} />
        <Text style={styles.fullscreenTitle}>Error</Text>
        <Text style={styles.fullscreenMessage}>{message}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles[variant], style]}>
      <Ionicons
        name="alert-circle"
        size={variant === 'banner' ? 20 : 18}
        color={Colors.status.error}
      />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inline: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    padding: 12,
    borderRadius: 10,
  },
  banner: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    padding: 12,
    borderRadius: 10,
  },
  message: {
    fontSize: 14,
    color: Colors.status.error,
    flex: 1,
  },
  fullscreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  fullscreenTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: 8,
  },
  fullscreenMessage: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});
