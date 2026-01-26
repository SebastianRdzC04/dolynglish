/**
 * Modal para configurar opciones de generación de lectura
 * Bottom sheet con selectores de categoría, dificultad y tamaño
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/constants/Colors';
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

interface GenerateReadingModalProps {
  /** Si el modal está visible */
  visible: boolean;
  /** Si está generando la lectura */
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
      {option.description && (
        <Text
          style={[
            styles.chipDescription,
            isSelected && styles.chipDescriptionSelected,
          ]}
        >
          {option.description}
        </Text>
      )}
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
 * Modal principal de configuración
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

  // Animaciones separadas para backdrop y bottom sheet
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const bottomSheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  // Animar entrada/salida cuando cambia visible
  useEffect(() => {
    if (visible) {
      // Animar entrada: backdrop fade in + sheet slide up
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(bottomSheetTranslateY, {
          toValue: 0,
          damping: 20,
          stiffness: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Resetear valores cuando se cierra
      backdropOpacity.setValue(0);
      bottomSheetTranslateY.setValue(SCREEN_HEIGHT);
    }
  }, [visible, backdropOpacity, bottomSheetTranslateY]);

  // Opciones de categoría
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

  // Opciones de tamaño
  const sizeOptions: ChipOption<TextSize>[] = [
    { value: null, label: 'Aleatorio' },
    ...Object.entries(sizeConfig).map(([value, config]) => ({
      value: value as TextSize,
      label: config.label,
      description: config.time,
    })),
  ];

  // Manejar generación
  const handleGenerate = useCallback(() => {
    const options: GenerateReadingOptions = {};

    if (selectedCategory) options.category = selectedCategory;
    if (selectedDifficulty) options.difficulty = selectedDifficulty;
    if (selectedSize) options.size = selectedSize;

    onGenerate(options);
  }, [selectedCategory, selectedDifficulty, selectedSize, onGenerate]);

  // Animar cierre y resetear selecciones
  const handleClose = useCallback(() => {
    // Animar salida: backdrop fade out + sheet slide down
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(bottomSheetTranslateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Después de la animación, cerrar el modal y resetear
      setSelectedCategory(null);
      setSelectedDifficulty(null);
      setSelectedSize(null);
      onClose();
    });
  }, [onClose, backdropOpacity, bottomSheetTranslateY]);

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
        {/* Backdrop con animación de fade */}
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        {/* Bottom Sheet con animación de slide */}
        <Animated.View 
          style={[
            styles.bottomSheet,
            { transform: [{ translateY: bottomSheetTranslateY }] }
          ]}
        >
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
            {/* Selector de Categoría */}
            <ChipSelector
              label="Categoría"
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

            {/* Selector de Tamaño */}
            <ChipSelector
              label="Tamaño"
              options={sizeOptions}
              selectedValue={selectedSize}
              onSelect={setSelectedSize}
            />
          </ScrollView>

          {/* Footer con botón de generar */}
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
