/**
 * Componente Card reutilizable
 * Contenedor con estilos base para tarjetas
 * Usa Reanimated para animacion de press suave
 */

import React, { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '@/src/core/theme';

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

  // Estado de press para animacion (0 = no presionado, 1 = presionado)
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(pressed.get(), [0, 1], [1, 0.98]) },
    ],
  }));

  if (onPress) {
    return (
      <Pressable
        onPressIn={() => pressed.set(withTiming(1, { duration: 120, easing: Easing.out(Easing.cubic) }))}
        onPressOut={() => pressed.set(withTiming(0, { duration: 150, easing: Easing.out(Easing.cubic) }))}
        onPress={onPress}
      >
        <Animated.View style={[...containerStyle, animatedStyle]}>
          {children}
        </Animated.View>
      </Pressable>
    );
  }

  return <View style={containerStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    borderCurve: 'continuous',
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
});
