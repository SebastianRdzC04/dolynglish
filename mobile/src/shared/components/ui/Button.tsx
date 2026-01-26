/**
 * Componente Button reutilizable
 * Soporta múltiples variantes y estados
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
import { Colors } from '@/constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  /** Texto del botón */
  children: string;
  /** Variante visual */
  variant?: ButtonVariant;
  /** Tamaño del botón */
  size?: ButtonSize;
  /** Mostrar estado de carga */
  loading?: boolean;
  /** Icono a mostrar (nombre de Ionicons) */
  icon?: keyof typeof Ionicons.glyphMap;
  /** Posición del icono */
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
  ...props
}: ButtonProps) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];
  const isDisabled = disabled || loading;

  const iconColor = variantStyle.text.color as string;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        variantStyle.container,
        sizeStyle.container,
        fullWidth && styles.fullWidth,
        pressed && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={sizeStyle.icon} color={iconColor} />
          )}
          <Text style={[styles.text, variantStyle.text, sizeStyle.text]}>{children}</Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={sizeStyle.icon} color={iconColor} />
          )}
        </>
      )}
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
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.6,
  },
});
