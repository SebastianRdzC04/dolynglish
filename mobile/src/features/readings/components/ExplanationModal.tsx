/**
 * Modal para mostrar explicacion de texto seleccionado
 * Bottom sheet con la explicacion generada por IA
 * Usa Reanimated + Gesture Handler para animaciones GPU-accelerated
 */

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/src/core/theme';
import { Button, Loading, ErrorMessage, Divider } from '@/src/shared/components/ui';
import { ExplanationResponse } from '../types';
import { difficultyConfig } from '../utils';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_THRESHOLD = 120;

interface ExplanationModalProps {
  visible: boolean;
  explanation: ExplanationResponse | null;
  isLoading: boolean;
  error: string | null;
  rateLimitInfo?: { usedToday: number; limit: number } | null;
  fromCache?: boolean;
  onClose: () => void;
  onRetry?: () => void;
}

export function ExplanationModal({
  visible,
  explanation,
  isLoading,
  error,
  rateLimitInfo,
  fromCache = false,
  onClose,
  onRetry,
}: ExplanationModalProps) {
  // Shared values para animaciones GPU-accelerated
  const backdropProgress = useSharedValue(0);
  const sheetProgress = useSharedValue(0);
  const dragY = useSharedValue(0);

  // Animar entrada cuando cambia visible
  useEffect(() => {
    if (visible) {
      // Resetear posiciones antes de animar entrada
      dragY.set(0);
      sheetProgress.set(0);
      backdropProgress.set(withTiming(1, { duration: 250 }));
      sheetProgress.set(withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) }));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [visible, backdropProgress, sheetProgress, dragY]);

  // Animar cierre
  const handleClose = useCallback(() => {
    backdropProgress.set(withTiming(0, { duration: 200 }));
    dragY.set(withTiming(SCREEN_HEIGHT, { duration: 250, easing: Easing.in(Easing.cubic) }, () => {
      runOnJS(onClose)();
    }));
  }, [backdropProgress, dragY, onClose]);

  // Gesto de swipe-down para cerrar
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      const clampedY = Math.max(0, event.translationY);
      dragY.set(clampedY);
    })
    .onEnd((event) => {
      if (event.translationY > DISMISS_THRESHOLD) {
        // Supero el umbral: continuar en la misma direccion para cerrar
        backdropProgress.set(withTiming(0, { duration: 200 }));
        dragY.set(withTiming(SCREEN_HEIGHT, { duration: 250, easing: Easing.in(Easing.cubic) }, () => {
          runOnJS(onClose)();
        }));
      } else {
        dragY.set(withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) }));
      }
    });

  // Estilos animados - solo transform y opacity (GPU-accelerated)
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropProgress.get(),
  }));

  const sheetStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      sheetProgress.get(),
      [0, 1],
      [SCREEN_HEIGHT, 0],
      Extrapolation.CLAMP,
    );

    return {
      transform: [{ translateY: translateY + dragY.get() }],
    };
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        {/* Bottom Sheet con swipe-down */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.bottomSheet, sheetStyle]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.handleBar} />
              <View style={styles.headerContent}>
                <Ionicons
                  name="language-outline"
                  size={24}
                  color={Colors.accent.primary}
                />
                <Text style={styles.title}>Explicación</Text>
                {fromCache && explanation ? (
                  <View style={styles.cacheBadge}>
                    <Ionicons name="flash" size={12} color={Colors.accent.primary} />
                    <Text style={styles.cacheBadgeText}>Instantáneo</Text>
                  </View>
                ) : null}
                <Pressable
                  style={styles.closeButton}
                  onPress={handleClose}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={24} color={Colors.text.secondary} />
                </Pressable>
              </View>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
            >
              {/* Loading State */}
              {isLoading ? (
                <View style={styles.stateContainer}>
                  <Loading message="Obteniendo explicación..." />
                </View>
              ) : null}

              {/* Error State */}
              {error && !isLoading ? (
                <View style={styles.stateContainer}>
                  <ErrorMessage message={error} />
                  {rateLimitInfo ? (
                    <View style={styles.rateLimitInfo}>
                      <Text style={styles.rateLimitText}>
                        Usadas hoy: {rateLimitInfo.usedToday}/{rateLimitInfo.limit}
                      </Text>
                    </View>
                  ) : null}
                  {onRetry && !rateLimitInfo ? (
                    <Button variant="secondary" onPress={onRetry}>
                      Reintentar
                    </Button>
                  ) : null}
                </View>
              ) : null}

              {/* Explanation Content */}
              {explanation && !isLoading && !error ? (
                <View style={styles.explanationContent}>
                  {/* Selected Text */}
                  <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Texto seleccionado:</Text>
                    <View style={styles.selectionBox}>
                      <Text style={styles.selectionText}>
                        "{explanation.selection}"
                      </Text>
                    </View>
                  </View>

                  <Divider spacing={12} />

                  {/* Main Explanation */}
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Ionicons
                        name="bulb-outline"
                        size={20}
                        color={Colors.accent.primary}
                      />
                      <Text style={styles.sectionLabel}>Explicación simple:</Text>
                    </View>
                    <Text style={styles.explanationText}>
                      {explanation.explanation}
                    </Text>
                  </View>

                  {/* Simplified Terms */}
                  {explanation.simplifiedTerms.length > 0 ? (
                    <>
                      <Divider spacing={12} />
                      <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                          <Ionicons
                            name="list-outline"
                            size={20}
                            color={Colors.accent.primary}
                          />
                          <Text style={styles.sectionLabel}>Términos clave:</Text>
                        </View>
                        {explanation.simplifiedTerms.map((term, index) => (
                          <View key={index} style={styles.termItem}>
                            <Text style={styles.termWord}>• {term.term}</Text>
                            <Text style={styles.termSimple}>   = {term.simple}</Text>
                          </View>
                        ))}
                      </View>
                    </>
                  ) : null}

                  {/* Example in Context */}
                  {explanation.exampleInContext ? (
                    <>
                      <Divider spacing={12} />
                      <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                          <Ionicons
                            name="chatbox-ellipses-outline"
                            size={20}
                            color={Colors.accent.primary}
                          />
                          <Text style={styles.sectionLabel}>Ejemplo:</Text>
                        </View>
                        <View style={styles.exampleBox}>
                          <Text style={styles.exampleText}>
                            {explanation.exampleInContext}
                          </Text>
                        </View>
                      </View>
                    </>
                  ) : null}

                  {/* Difficulty Badge */}
                  <View style={styles.difficultyFooter}>
                    <View style={styles.difficultyBadge}>
                      <Text style={styles.difficultyLabel}>
                        Nivel: {difficultyConfig[explanation.difficultyLevel].label}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : null}
            </ScrollView>

            {/* Action Button */}
            {explanation && !isLoading ? (
              <View style={styles.actionFooter}>
                <Button onPress={handleClose}>
                  ¡Entendido!
                </Button>
              </View>
            ) : null}
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheet: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderCurve: 'continuous',
    maxHeight: '85%',
    paddingBottom: 34,
  },
  header: {
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: Colors.gray.pepper,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  cacheBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.gray.dark,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accent.primary,
  },
  cacheBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.accent.primary,
    textTransform: 'uppercase',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  stateContainer: {
    paddingVertical: 40,
    gap: 16,
  },
  rateLimitInfo: {
    backgroundColor: Colors.background.secondary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rateLimitText: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  explanationContent: {
    paddingBottom: 20,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  selectionBox: {
    backgroundColor: Colors.background.secondary,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent.primary,
    padding: 12,
    borderRadius: 8,
  },
  selectionText: {
    fontSize: 16,
    color: Colors.text.primary,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  explanationText: {
    fontSize: 16,
    color: Colors.text.primary,
    lineHeight: 24,
  },
  termItem: {
    marginBottom: 8,
  },
  termWord: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  termSimple: {
    fontSize: 15,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  exampleBox: {
    backgroundColor: Colors.background.secondary,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  exampleText: {
    fontSize: 15,
    color: Colors.text.primary,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  difficultyFooter: {
    marginTop: 16,
    alignItems: 'flex-end',
  },
  difficultyBadge: {
    backgroundColor: Colors.background.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  difficultyLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    fontWeight: '500',
  },
  actionFooter: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
});
