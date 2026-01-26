/**
 * Componente Card reutilizable
 * Contenedor con estilos base para tarjetas
 */

import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { Colors } from '@/constants/Colors';

interface CardProps {
  /** Contenido de la tarjeta */
  children: ReactNode;
  /** Padding interno */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Callback al presionar (hace la tarjeta interactiva) */
  onPress?: () => void;
  /** Estilos adicionales */
  style?: ViewStyle;
}

const paddingValues: Record<string, number> = {
  none: 0,
  sm: 12,
  md: 16,
  lg: 20,
};

export function Card({ children, padding = 'md', onPress, style }: CardProps) {
  const containerStyle = [
    styles.container,
    { padding: paddingValues[padding] },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          ...containerStyle,
          pressed && styles.pressed,
        ]}
        onPress={onPress}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={containerStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
});
