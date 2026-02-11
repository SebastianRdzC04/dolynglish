/**
 * Componente SwipeableReadingCard
 * Card de lectura con swipe-to-delete estilo Spotify
 * Memoizada para evitar re-renders innecesarios en listas
 */

import React, { useCallback, memo } from 'react';
import { View, StyleSheet, Alert, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/src/core/theme';
import { Reading } from '../types';
import { getCategoryLabel, getEstimatedTime } from '../utils';
import { ReadingCard } from './ReadingCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DELETE_THRESHOLD = SCREEN_WIDTH * 0.35;

interface SwipeableReadingCardProps {
  /** Datos de la lectura */
  reading: Reading;
  /** Callback al presionar la card */
  onPress: () => void;
  /** Callback para eliminar la lectura */
  onDelete: () => Promise<boolean>;
}

export const SwipeableReadingCard = memo(function SwipeableReadingCard({
  reading,
  onPress,
  onDelete,
}: SwipeableReadingCardProps) {
  // Valores animados
  const translateX = useSharedValue(0);
  const cardHeight = useSharedValue<number | null>(null);
  const cardOpacity = useSharedValue(1);
  const isDeleting = useSharedValue(false);

  // Confirmar eliminacion
  const confirmDelete = useCallback(() => {
    Alert.alert(
      '¿Eliminar lectura?',
      'Esta acción no se puede deshacer.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => {
            translateX.set(withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) }));
          },
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            isDeleting.set(true);
            cardOpacity.set(withTiming(0, { duration: 200 }));
            cardHeight.set(withTiming(0, { duration: 300 }));

            setTimeout(async () => {
              await onDelete();
            }, 300);
          },
        },
      ],
      { cancelable: true }
    );
  }, [onDelete, translateX, cardOpacity, cardHeight, isDeleting]);

  // Gesto de pan (deslizar)
  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onUpdate((event) => {
      if (event.translationX < 0 && !isDeleting.get()) {
        translateX.set(event.translationX);
      }
    })
    .onEnd((event) => {
      if (isDeleting.get()) return;

      if (event.translationX < -DELETE_THRESHOLD) {
        translateX.set(withTiming(-DELETE_THRESHOLD - 20, { duration: 200, easing: Easing.out(Easing.cubic) }));
        runOnJS(confirmDelete)();
      } else {
        translateX.set(withTiming(0, { duration: 250, easing: Easing.out(Easing.cubic) }));
      }
    });

  // Estilo animado del contenedor
  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: cardHeight.get() !== null ? cardHeight.get()! : undefined,
      opacity: cardOpacity.get(),
      overflow: 'hidden' as const,
    };
  });

  // Estilo animado de la card
  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.get() }],
    };
  });

  // Estilo animado del fondo de delete
  const deleteBackgroundStyle = useAnimatedStyle(() => {
    const progress = Math.min(Math.abs(translateX.get()) / DELETE_THRESHOLD, 1);
    return {
      opacity: progress,
    };
  });

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      {/* Fondo rojo con icono de eliminar */}
      <Animated.View style={[styles.deleteBackground, deleteBackgroundStyle]}>
        <View style={styles.deleteIconContainer}>
          <Ionicons name="trash-outline" size={24} color={Colors.text.primary} />
        </View>
      </Animated.View>

      {/* Card que se desliza */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.cardWrapper, cardAnimatedStyle]}>
          <ReadingCard
            title={reading.title}
            wordCount={reading.wordCount}
            difficulty={reading.difficulty}
            category={getCategoryLabel(reading.category)}
            estimatedTime={getEstimatedTime(reading.wordCount)}
            onPress={onPress}
          />
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 16,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  deleteBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.status.error,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 24,
  },
  deleteIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardWrapper: {
  },
});
