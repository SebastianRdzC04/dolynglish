/**
 * Componente Button reutilizable
 * Soporta multiples variantes y estados
 * Usa Reanimated para animaciones de press GPU-accelerated
 */

import React from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  PressableProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '@/src/core/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  /** Texto del boton */
  children: string;
  /** Variante visual */
  variant?: ButtonVariant;
  /** Tamano del boton */
  size?: ButtonSize;
  /** Mostrar estado de carga */
  loading?: boolean;
  /** Icono a mostrar (nombre de Ionicons) */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Posicion del icono */
  iconPosition?: 'left' | 'right';
  /** Ocupar todo el ancho disponible */
  fullWidth?: boolean;
  /** Estilos adicionales del contenedor */
  style?: ViewStyle;
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: {
    container: {
      backgroundColor: Colors.accent.primary,
    },
    text: {
      color: Colors.text.primary,
    },
  },
  secondary: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: Colors.accent.primary,
    },
    text: {
      color: Colors.accent.primary,
    },
  },
  ghost: {
    container: {
      backgroundColor: 'transparent',
    },
    text: {
      color: Colors.accent.primary,
    },
  },
  danger: {
    container: {
      backgroundColor: Colors.status.error,
    },
    text: {
      color: Colors.text.primary,
    },
  },
};

const sizeStyles: Record<ButtonSize, { container: ViewStyle; text: TextStyle; icon: number }> = {
  sm: {
    container: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
    },
    text: {
      fontSize: 14,
    },
    icon: 16,
  },
  md: {
    container: {
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 12,
    },
    text: {
      fontSize: 16,
    },
    icon: 20,
  },
  lg: {
    container: {
      paddingVertical: 18,
      paddingHorizontal: 24,
      borderRadius: 14,
    },
    text: {
      fontSize: 18,
    },
    icon: 24,
  },
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  style,
  onPressIn,
  onPressOut,
  ...props
}: ButtonProps) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];
  const isDisabled = disabled || loading;

  const iconColor = variantStyle.text.color as string;

  // Estado de press (0 = no presionado, 1 = presionado)
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: interpolate(pressed.get(), [0, 1], [1, 0.96]) },
    ],
    opacity: interpolate(pressed.get(), [0, 1], [1, 0.85]),
  }));

  const handlePressIn = (e: any) => {
    pressed.set(withTiming(1, { duration: 120, easing: Easing.out(Easing.cubic) }));
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    pressed.set(withTiming(0, { duration: 150, easing: Easing.out(Easing.cubic) }));
    onPressOut?.(e);
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      {...props}
    >
      <Animated.View
        style={[
          styles.container,
          variantStyle.container,
          sizeStyle.container,
          fullWidth && styles.fullWidth,
          isDisabled && styles.disabled,
          style,
          animatedStyle,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={iconColor} />
        ) : (
          <>
            {icon && iconPosition === 'left' ? (
              <Ionicons name={icon} size={sizeStyle.icon} color={iconColor} />
            ) : null}
            <Text style={[styles.text, variantStyle.text, sizeStyle.text]}>{children}</Text>
            {icon && iconPosition === 'right' ? (
              <Ionicons name={icon} size={sizeStyle.icon} color={iconColor} />
            ) : null}
          </>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.6,
  },
});
