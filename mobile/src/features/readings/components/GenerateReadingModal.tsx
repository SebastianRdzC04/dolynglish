/**
 * Modal para configurar opciones de generacion de lectura
 * Bottom sheet con selectores de categoria, dificultad y tamano
 * Usa Reanimated + Gesture Handler para animaciones GPU-accelerated
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
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
import { Button } from '@/src/shared/components/ui';
import {
  TextCategory,
  DifficultyLevel,
  GenerateReadingOptions,
} from '../types';
import {
  categoryLabels,
  difficultyLabels,
  sizeConfig,
  TextSize,
} from '../utils/reading.utils';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const DISMISS_THRESHOLD = 120;

interface GenerateReadingModalProps {
  /** Si el modal esta visible */
  visible: boolean;
  /** Si esta generando la lectura */
  isGenerating: boolean;
  /** Callback para cerrar el modal */
  onClose: () => void;
  /** Callback para generar con las opciones seleccionadas */
  onGenerate: (options: GenerateReadingOptions) => void;
}

interface ChipOption<T> {
  value: T | null;
  label: string;
  description?: string;
}

/**
 * Componente Chip individual seleccionable
 */
function OptionChip<T>({
  option,
  isSelected,
  onSelect,
}: {
  option: ChipOption<T>;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <Pressable
      style={[styles.chip, isSelected && styles.chipSelected]}
      onPress={onSelect}
    >
      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
        {option.label}
      </Text>
      {option.description ? (
        <Text
          style={[
            styles.chipDescription,
            isSelected && styles.chipDescriptionSelected,
          ]}
        >
          {option.description}
        </Text>
      ) : null}
    </Pressable>
  );
}

/**
 * Selector de chips con scroll horizontal
 */
function ChipSelector<T>({
  label,
  options,
  selectedValue,
  onSelect,
}: {
  label: string;
  options: ChipOption<T>[];
  selectedValue: T | null;
  onSelect: (value: T | null) => void;
}) {
  return (
    <View style={styles.selectorContainer}>
      <Text style={styles.selectorLabel}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
      >
        {options.map((option, index) => (
          <OptionChip
            key={index}
            option={option}
            isSelected={selectedValue === option.value}
            onSelect={() => onSelect(option.value)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

/**
 * Modal principal de configuracion
 */
export function GenerateReadingModal({
  visible,
  isGenerating,
  onClose,
  onGenerate,
}: GenerateReadingModalProps) {
  // Estados para las opciones seleccionadas (null = aleatorio)
  const [selectedCategory, setSelectedCategory] = useState<TextCategory | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | null>(null);
  const [selectedSize, setSelectedSize] = useState<TextSize | null>(null);

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

  // Opciones de categoria
  const categoryOptions: ChipOption<TextCategory>[] = [
    { value: null, label: 'Aleatorio' },
    ...Object.entries(categoryLabels).map(([value, label]) => ({
      value: value as TextCategory,
      label,
    })),
  ];

  // Opciones de dificultad
  const difficultyOptions: ChipOption<DifficultyLevel>[] = [
    { value: null, label: 'Aleatorio' },
    ...Object.entries(difficultyLabels).map(([value, label]) => ({
      value: value as DifficultyLevel,
      label,
    })),
  ];

  // Opciones de tamano
  const sizeOptions: ChipOption<TextSize>[] = [
    { value: null, label: 'Aleatorio' },
    ...Object.entries(sizeConfig).map(([value, config]) => ({
      value: value as TextSize,
      label: config.label,
      description: config.time,
    })),
  ];

  // Manejar generacion
  const handleGenerate = useCallback(() => {
    const options: GenerateReadingOptions = {};

    if (selectedCategory) options.category = selectedCategory;
    if (selectedDifficulty) options.difficulty = selectedDifficulty;
    if (selectedSize) options.size = selectedSize;

    onGenerate(options);
  }, [selectedCategory, selectedDifficulty, selectedSize, onGenerate]);

  // Resetear selecciones y llamar onClose
  const resetAndClose = useCallback(() => {
    setSelectedCategory(null);
    setSelectedDifficulty(null);
    setSelectedSize(null);
    onClose();
  }, [onClose]);

  // Animar cierre y resetear selecciones
  const handleClose = useCallback(() => {
    backdropProgress.set(withTiming(0, { duration: 200 }));
    dragY.set(withTiming(SCREEN_HEIGHT, { duration: 250, easing: Easing.in(Easing.cubic) }, () => {
      runOnJS(resetAndClose)();
    }));
  }, [backdropProgress, dragY, resetAndClose]);

  // Gesto de swipe-down para cerrar
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // Solo permitir arrastrar hacia abajo
      const clampedY = Math.max(0, event.translationY);
      dragY.set(clampedY);
    })
    .onEnd((event) => {
      if (event.translationY > DISMISS_THRESHOLD) {
        // Supero el umbral: continuar en la misma direccion para cerrar
        backdropProgress.set(withTiming(0, { duration: 200 }));
        dragY.set(withTiming(SCREEN_HEIGHT, { duration: 250, easing: Easing.in(Easing.cubic) }, () => {
          runOnJS(resetAndClose)();
        }));
      } else {
        // No supero el umbral: volver a la posicion original
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

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        {/* Backdrop con animacion de fade */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        {/* Bottom Sheet con animacion de slide + swipe-down */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.bottomSheet, sheetStyle]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.handleBar} />
              <View style={styles.headerContent}>
                <Text style={styles.title}>Configurar Lectura</Text>
                <Pressable
                  style={styles.closeButton}
                  onPress={handleClose}
                  hitSlop={8}
                >
                  <Ionicons name="close" size={24} color={Colors.text.secondary} />
                </Pressable>
              </View>
              <Text style={styles.subtitle}>
                Personaliza tu lectura o deja en aleatorio
              </Text>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
            >
              {/* Selector de Categoria */}
              <ChipSelector
                label="Categoria"
                options={categoryOptions}
                selectedValue={selectedCategory}
                onSelect={setSelectedCategory}
              />

              {/* Selector de Dificultad */}
              <ChipSelector
                label="Dificultad"
                options={difficultyOptions}
                selectedValue={selectedDifficulty}
                onSelect={setSelectedDifficulty}
              />

              {/* Selector de Tamano */}
              <ChipSelector
                label="Tamano"
                options={sizeOptions}
                selectedValue={selectedSize}
                onSelect={setSelectedSize}
              />
            </ScrollView>

            {/* Footer con boton de generar */}
            <View style={styles.footer}>
              <Button
                onPress={handleGenerate}
                loading={isGenerating}
                icon="sparkles"
              >
                {isGenerating ? 'Generando...' : 'Generar Lectura'}
              </Button>
            </View>
          </Animated.View>
        </GestureDetector>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
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
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  header: {
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray.dark,
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  selectorContainer: {
    marginBottom: 24,
  },
  selectorLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 24,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.gray.dark,
    alignItems: 'center',
  },
  chipSelected: {
    backgroundColor: Colors.accent.primary,
    borderColor: Colors.accent.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  chipTextSelected: {
    color: Colors.background.primary,
  },
  chipDescription: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  chipDescriptionSelected: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.gray.dark,
  },
});
