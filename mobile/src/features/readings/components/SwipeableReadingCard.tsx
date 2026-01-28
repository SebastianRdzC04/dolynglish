/**
 * Componente SwipeableReadingCard
 * Card de lectura con swipe-to-delete estilo Spotify
 */

import React, { useCallback } from 'react';
import { View, StyleSheet, Alert, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/constants/Colors';
import { Reading } from '../types';
import { getCategoryLabel, getEstimatedTime } from '../utils';
import { ReadingCard } from './ReadingCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DELETE_THRESHOLD = SCREEN_WIDTH * 0.35; // 35% del ancho para activar delete

interface SwipeableReadingCardProps {
  /** Datos de la lectura */
  reading: Reading;
  /** Callback al presionar la card */
  onPress: () => void;
  /** Callback para eliminar la lectura */
  onDelete: () => Promise<boolean>;
}

export function SwipeableReadingCard({
  reading,
  onPress,
  onDelete,
}: SwipeableReadingCardProps) {
  // Valores animados
  const translateX = useSharedValue(0);
  const cardHeight = useSharedValue<number | null>(null);
  const cardOpacity = useSharedValue(1);
  const isDeleting = useSharedValue(false);

  // Confirmar eliminación
  const confirmDelete = useCallback(() => {
    Alert.alert(
      '¿Eliminar lectura?',
      'Esta acción no se puede deshacer.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
          onPress: () => {
            // Volver a posición original
            translateX.value = withSpring(0, { damping: 20, stiffness: 150 });
          },
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            isDeleting.value = true;
            // Animar salida: colapsar altura y fade out
            cardOpacity.value = withTiming(0, { duration: 200 });
            cardHeight.value = withTiming(0, { duration: 300 });
            
            // Eliminar después de la animación
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
      // Solo permitir deslizar hacia la izquierda
      if (event.translationX < 0 && !isDeleting.value) {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      if (isDeleting.value) return;

      // Si pasó el threshold, confirmar eliminación
      if (event.translationX < -DELETE_THRESHOLD) {
        translateX.value = withSpring(-DELETE_THRESHOLD - 20, { damping: 20 });
        runOnJS(confirmDelete)();
      } else {
        // Volver a posición original
        translateX.value = withSpring(0, { damping: 20, stiffness: 150 });
      }
    });

  // Estilo animado del contenedor
  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      height: cardHeight.value !== null ? cardHeight.value : undefined,
      opacity: cardOpacity.value,
      overflow: 'hidden',
    };
  });

  // Estilo animado de la card
  const cardAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  // Estilo animado del fondo de delete (opacidad basada en el swipe)
  const deleteBackgroundStyle = useAnimatedStyle(() => {
    const progress = Math.min(Math.abs(translateX.value) / DELETE_THRESHOLD, 1);
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
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  deleteBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.status.error,
    borderRadius: 16,
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
    backgroundColor: Colors.background.primary,
  },
});
