/**
 * Toolbar flotante para acciones sobre texto seleccionado
 * Aparece cuando el usuario selecciona texto en el contenido de lectura
 */

import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/constants/Colors';

interface SelectionToolbarProps {
  /** Si la toolbar es visible */
  visible: boolean;
  /** Texto seleccionado actualmente */
  selectedText: string;
  /** Si está cargando una explicación */
  isLoading?: boolean;
  /** Callback al presionar Explain */
  onExplain: (text: string) => void;
  /** Callback al presionar Copy */
  onCopy: (text: string) => void;
}

export function SelectionToolbar({
  visible,
  selectedText,
  isLoading = false,
  onExplain,
  onCopy,
}: SelectionToolbarProps) {
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (visible && selectedText.length > 0) {
      translateY.value = withTiming(0, {
        duration: 250,
        easing: Easing.out(Easing.cubic),
      });
      opacity.value = withTiming(1, { duration: 200 });
    } else {
      translateY.value = withTiming(100, { duration: 150 });
      opacity.value = withTiming(0, { duration: 150 });
    }
  }, [visible, selectedText, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handleExplain = () => {
    if (isLoading || !selectedText.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onExplain(selectedText);
  };

  const handleCopy = () => {
    if (!selectedText.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onCopy(selectedText);
  };

  // Truncar texto para preview
  const previewText =
    selectedText.length > 50
      ? selectedText.substring(0, 50) + '...'
      : selectedText;

  const isTooLong = selectedText.trim().length > 200;

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      pointerEvents={visible && selectedText.length > 0 ? 'auto' : 'none'}
    >
      {/* Preview del texto seleccionado */}
      <View style={styles.previewRow}>
        <Ionicons name="text-outline" size={14} color={Colors.text.secondary} />
        <Text style={styles.previewText} numberOfLines={1}>
          &quot;{previewText}&quot;
        </Text>
        {isTooLong && (
          <Text style={styles.warningText}>Too long</Text>
        )}
      </View>

      {/* Botones de acción */}
      <View style={styles.actionsRow}>
        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.copyButton,
            pressed && styles.actionPressed,
          ]}
          onPress={handleCopy}
        >
          <Ionicons name="copy-outline" size={18} color={Colors.text.primary} />
          <Text style={styles.actionText}>Copy</Text>
        </Pressable>

        <View style={styles.divider} />

        <Pressable
          style={({ pressed }) => [
            styles.actionButton,
            styles.explainButton,
            pressed && styles.actionPressed,
            (isLoading || isTooLong) && styles.actionDisabled,
          ]}
          onPress={handleExplain}
          disabled={isLoading || isTooLong}
        >
          {isLoading ? (
            <>
              <Ionicons
                name="hourglass-outline"
                size={18}
                color={Colors.accent.primary}
              />
              <Text style={styles.explainText}>Loading...</Text>
            </>
          ) : (
            <>
              <Ionicons
                name="bulb-outline"
                size={18}
                color={isTooLong ? Colors.text.secondary : Colors.accent.primary}
              />
              <Text
                style={[
                  styles.explainText,
                  isTooLong && styles.textDisabled,
                ]}
              >
                Explain
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background.secondary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 34,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  previewText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
  warningText: {
    fontSize: 11,
    color: Colors.status.warning,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  copyButton: {
    backgroundColor: Colors.gray.dark,
  },
  explainButton: {
    backgroundColor: 'rgba(244, 162, 97, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 162, 97, 0.3)',
  },
  actionPressed: {
    opacity: 0.7,
  },
  actionDisabled: {
    opacity: 0.5,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  explainText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.accent.primary,
  },
  textDisabled: {
    color: Colors.text.secondary,
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border.light,
  },
});
