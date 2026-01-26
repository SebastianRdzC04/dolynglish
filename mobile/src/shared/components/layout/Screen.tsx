/**
 * Componente Screen
 * Wrapper base para todas las pantallas
 */

import React, { ReactNode } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Colors } from '@/constants/Colors';

interface ScreenProps {
  /** Contenido de la pantalla */
  children: ReactNode;
  /** Si la pantalla es scrolleable */
  scrollable?: boolean;
  /** Callback para pull-to-refresh */
  onRefresh?: () => Promise<void>;
  /** Si está refrescando */
  refreshing?: boolean;
  /** Padding horizontal */
  paddingHorizontal?: number;
  /** Padding vertical */
  paddingVertical?: number;
  /** Estilos adicionales del contenedor */
  style?: ViewStyle;
  /** Estilos adicionales del contenido (solo para ScrollView) */
  contentStyle?: ViewStyle;
}

export function Screen({
  children,
  scrollable = true,
  onRefresh,
  refreshing = false,
  paddingHorizontal = 20,
  paddingVertical = 20,
  style,
  contentStyle,
}: ScreenProps) {
  const containerStyle = [
    styles.container,
    { paddingHorizontal, paddingVertical },
    style,
  ];

  if (scrollable) {
    return (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, containerStyle, contentStyle]}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.accent.primary}
              colors={[Colors.accent.primary]}
            />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[styles.view, containerStyle]}>{children}</View>;
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
  },
  view: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  container: {
    gap: 24,
  },
});
