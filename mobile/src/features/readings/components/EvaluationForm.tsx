/**
 * Componente EvaluationForm
 * Formulario para enviar la respuesta de evaluación
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors } from '@/constants/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button, Input, ErrorMessage, Card } from '@/src/shared/components/ui';

interface EvaluationFormProps {
  /** Si está enviando */
  isSubmitting: boolean;
  /** Error actual */
  error: string | null;
  /** Callback al enviar */
  onSubmit: (response: string) => void;
}

export function EvaluationForm({ isSubmitting, error, onSubmit }: EvaluationFormProps) {
  const [userResponse, setUserResponse] = useState('');

  const handleSubmit = () => {
    onSubmit(userResponse);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Instrucciones */}
      <Card style={styles.instructionsCard}>
        <View style={styles.instructionsContent}>
          <Ionicons
            name="information-circle"
            size={24}
            color={Colors.accent.primary}
          />
          <Text style={styles.instructionsText}>
            Escribe en español o inglés lo que entendiste del texto. Explica la
            idea principal con tus propias palabras.
          </Text>
        </View>
      </Card>

      {/* Input de respuesta */}
      <Input
        label="Tu respuesta"
        placeholder="Escribe aquí lo que entendiste del texto..."
        multiline
        numberOfLines={8}
        value={userResponse}
        onChangeText={setUserResponse}
        editable={!isSubmitting}
        helperText={`${userResponse.length} caracteres`}
      />

      {/* Error */}
      {error && <ErrorMessage message={error} />}

      {/* Botón de enviar */}
      <Button
        icon="send"
        loading={isSubmitting}
        onPress={handleSubmit}
      >
        {isSubmitting ? 'Evaluando...' : 'Enviar respuesta'}
      </Button>

      {/* Tip */}
      <View style={styles.tipContainer}>
        <Ionicons name="bulb-outline" size={18} color={Colors.text.secondary} />
        <Text style={styles.tipText}>
          Tip: No necesitas repetir el texto palabra por palabra. Explica la
          idea principal con tus propias palabras.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 20,
  },
  instructionsCard: {
    backgroundColor: 'rgba(244, 162, 97, 0.1)',
    borderColor: 'transparent',
  },
  instructionsContent: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  instructionsText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  tipContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
});
