/**
 * Componente Input reutilizable
 * Input de texto con estilos consistentes
 */

import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Colors } from '@/constants/Colors';

interface InputProps extends TextInputProps {
  /** Label del campo */
  label?: string;
  /** Mensaje de error */
  error?: string;
  /** Mensaje de ayuda */
  helperText?: string;
  /** Si es un área de texto multilínea */
  multiline?: boolean;
  /** Número de líneas para multilínea */
  numberOfLines?: number;
  /** Estilos adicionales del contenedor */
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  helperText,
  multiline = false,
  numberOfLines = 1,
  containerStyle,
  style,
  ...props
}: InputProps) {
  const hasError = !!error;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          multiline && styles.multiline,
          multiline && { minHeight: numberOfLines * 24 + 32 },
          hasError && styles.inputError,
          style,
        ]}
        placeholderTextColor={Colors.gray.pepper}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? 'top' : 'center'}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
      {helperText && !error && <Text style={styles.helperText}>{helperText}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  input: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  multiline: {
    paddingTop: 16,
  },
  inputError: {
    borderColor: Colors.status.error,
  },
  error: {
    fontSize: 12,
    color: Colors.status.error,
  },
  helperText: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
});
