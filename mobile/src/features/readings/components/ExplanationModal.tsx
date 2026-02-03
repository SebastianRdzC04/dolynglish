/**
 * Modal para mostrar explicación de texto seleccionado
 * Bottom sheet con la explicación generada por IA
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors } from '@/constants/Colors';
import { Button, Loading, ErrorMessage, Divider } from '@/src/shared/components/ui';
import { ExplanationResponse } from '../types';
import { difficultyConfig } from '../utils';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const slideY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideY, {
          toValue: 0,
          damping: 20,
          stiffness: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      backdropOpacity.setValue(0);
      slideY.setValue(SCREEN_HEIGHT);
    }
  }, [visible, backdropOpacity, slideY]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

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
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        {/* Bottom Sheet */}
        <Animated.View
          style={[
            styles.bottomSheet,
            { transform: [{ translateY: slideY }] }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handleBar} />
            <View style={styles.headerContent}>
              <Ionicons
                name="language-outline"
                size={24}
                color={Colors.accent.primary}
              />
              <Text style={styles.title}>Explanation</Text>
              {fromCache && explanation && (
                <View style={styles.cacheBadge}>
                  <Ionicons name="flash" size={12} color={Colors.accent.primary} />
                  <Text style={styles.cacheBadgeText}>Instant</Text>
                </View>
              )}
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
            {isLoading && (
              <View style={styles.stateContainer}>
                <Loading message="Getting explanation..." />
              </View>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <View style={styles.stateContainer}>
                <ErrorMessage message={error} />
                {rateLimitInfo && (
                  <View style={styles.rateLimitInfo}>
                    <Text style={styles.rateLimitText}>
                      Used today: {rateLimitInfo.usedToday}/{rateLimitInfo.limit}
                    </Text>
                  </View>
                )}
                {onRetry && !rateLimitInfo && (
                  <Button variant="secondary" onPress={onRetry}>
                    Try Again
                  </Button>
                )}
              </View>
            )}

            {/* Explanation Content */}
            {explanation && !isLoading && !error && (
              <View style={styles.explanationContent}>
                {/* Selected Text */}
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Selected Text:</Text>
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
                    <Text style={styles.sectionLabel}>Simple Explanation:</Text>
                  </View>
                  <Text style={styles.explanationText}>
                    {explanation.explanation}
                  </Text>
                </View>

                {/* Simplified Terms */}
                {explanation.simplifiedTerms.length > 0 && (
                  <>
                    <Divider spacing={12} />
                    <View style={styles.section}>
                      <View style={styles.sectionHeader}>
                        <Ionicons
                          name="list-outline"
                          size={20}
                          color={Colors.accent.primary}
                        />
                        <Text style={styles.sectionLabel}>Key Terms:</Text>
                      </View>
                      {explanation.simplifiedTerms.map((term, index) => (
                        <View key={index} style={styles.termItem}>
                          <Text style={styles.termWord}>• {term.term}</Text>
                          <Text style={styles.termSimple}>   = {term.simple}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                {/* Example in Context */}
                {explanation.exampleInContext && (
                  <>
                    <Divider spacing={12} />
                    <View style={styles.section}>
                      <View style={styles.sectionHeader}>
                        <Ionicons
                          name="chatbox-ellipses-outline"
                          size={20}
                          color={Colors.accent.primary}
                        />
                        <Text style={styles.sectionLabel}>Example:</Text>
                      </View>
                      <View style={styles.exampleBox}>
                        <Text style={styles.exampleText}>
                          {explanation.exampleInContext}
                        </Text>
                      </View>
                    </View>
                  </>
                )}

                {/* Difficulty Badge */}
                <View style={styles.footer}>
                  <View style={styles.difficultyBadge}>
                    <Text style={styles.difficultyLabel}>
                      Level: {difficultyConfig[explanation.difficultyLevel].label}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Action Button */}
          {explanation && !isLoading && (
            <View style={styles.actionFooter}>
              <Button onPress={handleClose}>
                Got it!
              </Button>
            </View>
          )}
        </Animated.View>
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
  footer: {
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
