/**
 * Componente Badge reutilizable
 * Para mostrar etiquetas de categoría, dificultad, etc.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Colors } from '@/constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  /** Texto del badge */
  label: string;
  /** Variante de color */
  variant?: BadgeVariant;
  /** Color personalizado (override variant) */
  color?: string;
  /** Color de fondo personalizado */
  backgroundColor?: string;
  /** Icono opcional */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Tamaño */
  size?: 'sm' | 'md';
  /** Estilos adicionales */
  style?: ViewStyle;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string }> = {
  default: {
    bg: 'rgba(244, 162, 97, 0.15)',
    text: Colors.accent.primary,
  },
  success: {
    bg: 'rgba(46, 204, 113, 0.15)',
    text: Colors.status.success,
  },
  warning: {
    bg: 'rgba(244, 162, 97, 0.15)',
    text: Colors.accent.primary,
  },
  error: {
    bg: 'rgba(231, 76, 60, 0.15)',
    text: Colors.status.error,
  },
  info: {
    bg: 'rgba(52, 152, 219, 0.15)',
    text: '#3498db',
  },
};

const sizeStyles: Record<string, { container: ViewStyle; text: TextStyle; icon: number }> = {
  sm: {
    container: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    text: {
      fontSize: 11,
    },
    icon: 12,
  },
  md: {
    container: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    text: {
      fontSize: 12,
    },
    icon: 14,
  },
};

export function Badge({
  label,
  variant = 'default',
  color,
  backgroundColor,
  icon,
  size = 'md',
  style,
}: BadgeProps) {
  const variantColor = variantColors[variant];
  const sizeStyle = sizeStyles[size];

  const textColor = color || variantColor.text;
  const bgColor = backgroundColor || variantColor.bg;

  return (
    <View
      style={[
        styles.container,
        sizeStyle.container,
        { backgroundColor: bgColor },
        style,
      ]}
    >
      {icon && (
        <Ionicons name={icon} size={sizeStyle.icon} color={textColor} />
      )}
      <Text style={[styles.text, sizeStyle.text, { color: textColor }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    fontWeight: '600',
  },
});
