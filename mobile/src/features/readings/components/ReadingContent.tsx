/**
 * Componente ReadingContent
 * Muestra el contenido completo de una lectura con texto seleccionable
 * iOS: TextInput nativo (editable=false) para selección
 * Android: WebView con window.getSelection() como fallback
 */

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Platform } from 'react-native';
import { Colors } from '@/src/core/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Badge, Divider } from '@/src/shared/components/ui';
import { Reading } from '../types';
import { getCategoryLabel, difficultyLabels, difficultyConfig, getEstimatedTime } from '../utils';

// WebView solo se importa en Android
const WebView =
  Platform.OS === 'android'
    ? require('react-native-webview').default
    : null;

interface ReadingContentProps {
  /** Datos de la lectura */
  reading: Reading;
  /** Callback cuando el usuario selecciona texto */
  onTextSelect?: (text: string) => void;
  /** Callback cuando cambia el estado de selección */
  onSelectionChange?: (hasSelection: boolean) => void;
}

// ─── Componente interno: selección iOS (TextInput) ───
function IOSTextContent({
  content,
  onTextSelect,
  onSelectionChange,
}: {
  content: string;
  onTextSelect?: (text: string) => void;
  onSelectionChange?: (hasSelection: boolean) => void;
}) {
  const contentRef = useRef<TextInput>(null);

  const handleSelectionChange = useCallback(
    (event: { nativeEvent: { selection: { start: number; end: number } } }) => {
      const { start, end } = event.nativeEvent.selection;

      if (start !== end) {
        const selectedText = content.substring(start, end);
        onTextSelect?.(selectedText);
        onSelectionChange?.(true);
      } else {
        onSelectionChange?.(false);
      }
    },
    [content, onTextSelect, onSelectionChange]
  );

  return (
    <TextInput
      ref={contentRef}
      value={content}
      editable={false}
      multiline
      scrollEnabled={false}
      contextMenuHidden={true}
      selectionColor="rgba(244, 162, 97, 0.35)"
      onSelectionChange={handleSelectionChange}
      style={styles.content}
      textAlignVertical="top"
    />
  );
}

// ─── Componente interno: selección Android (WebView) ───
function AndroidTextContent({
  content,
  onTextSelect,
  onSelectionChange,
}: {
  content: string;
  onTextSelect?: (text: string) => void;
  onSelectionChange?: (hasSelection: boolean) => void;
}) {
  const [webViewHeight, setWebViewHeight] = useState(300);

  // Escapar contenido para HTML seguro
  const escapedContent = useMemo(() => {
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '<br/>');
  }, [content]);

  const html = useMemo(
    () => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, 'Roboto', sans-serif;
      font-size: 17px;
      line-height: 28px;
      color: ${Colors.text.primary};
      background-color: transparent;
      -webkit-user-select: text;
      user-select: text;
      overflow: hidden;
      padding: 0;
    }
    ::selection {
      background-color: rgba(244, 162, 97, 0.45);
    }
    #content {
      padding: 0;
    }
  </style>
</head>
<body>
  <div id="content">${escapedContent}</div>
  <script>
    // Comunicar la altura real del contenido al RN
    function sendHeight() {
      var h = document.getElementById('content').scrollHeight;
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'height', value: h }));
    }

    // Observar cambios en la selección
    document.addEventListener('selectionchange', function() {
      var sel = window.getSelection();
      var text = sel ? sel.toString() : '';
      if (text.length > 0) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'selection', value: text }));
      } else {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'selectionCleared' }));
      }
    });

    // Enviar altura una vez cargado
    window.addEventListener('load', function() {
      sendHeight();
      // Enviar de nuevo tras un pequeño delay por si el layout cambia
      setTimeout(sendHeight, 100);
    });
  </script>
</body>
</html>`,
    [escapedContent]
  );

  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data) as
          | { type: 'height'; value: number }
          | { type: 'selection'; value: string }
          | { type: 'selectionCleared' };

        switch (msg.type) {
          case 'height':
            setWebViewHeight(msg.value);
            break;
          case 'selection':
            onTextSelect?.(msg.value);
            onSelectionChange?.(true);
            break;
          case 'selectionCleared':
            onSelectionChange?.(false);
            break;
        }
      } catch {
        // Ignorar mensajes mal formados
      }
    },
    [onTextSelect, onSelectionChange]
  );

  if (!WebView) return null;

  return (
    <WebView
      source={{ html }}
      style={[styles.webView, { height: webViewHeight }]}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
      showsHorizontalScrollIndicator={false}
      onMessage={handleMessage}
      originWhitelist={['*']}
      javaScriptEnabled={true}
      setBuiltInZoomControls={false}
      setDisplayZoomControls={false}
      textZoom={100}
      // Fondo transparente para que se integre con el tema
      androidLayerType="hardware"
    />
  );
}

// ─── Componente principal ───
export function ReadingContent({ reading, onTextSelect, onSelectionChange }: ReadingContentProps) {
  const diffConfig = difficultyConfig[reading.difficulty];

  return (
    <View style={styles.container}>
      {/* Metadatos */}
      <View style={styles.metadataContainer}>
        <View style={styles.metadataRow}>
          <View style={styles.categoryBadge}>
            <Ionicons
              name="book-outline"
              size={14}
              color={Colors.accent.primary}
            />
            <Text style={styles.categoryText}>
              {getCategoryLabel(reading.category)}
            </Text>
          </View>

          <Badge
            label={difficultyLabels[reading.difficulty]}
            color={diffConfig.color}
            backgroundColor={diffConfig.bgColor}
          />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="document-text-outline" size={16} color={Colors.text.secondary} />
            <Text style={styles.statText}>
              {reading.wordCount.toLocaleString()} palabras
            </Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="time-outline" size={16} color={Colors.text.secondary} />
            <Text style={styles.statText}>
              ~{getEstimatedTime(reading.wordCount)} min
            </Text>
          </View>
        </View>
      </View>

      {/* Título */}
      <Text style={styles.title}>{reading.title}</Text>

      {/* Descripción */}
      <Text style={styles.description}>{reading.description}</Text>

      <Divider spacing={8} />

      {/* Hint de selección */}
      <View style={styles.hintContainer}>
        <Ionicons name="finger-print-outline" size={14} color={Colors.text.muted} />
        <Text style={styles.hintText}>
          {Platform.OS === 'ios'
            ? 'Long press and drag to select text'
            : 'Long press to select text'}
        </Text>
      </View>

      {/* Contenido con selección nativa de texto — plataforma específica */}
      {Platform.OS === 'ios' ? (
        <IOSTextContent
          content={reading.content}
          onTextSelect={onTextSelect}
          onSelectionChange={onSelectionChange}
        />
      ) : (
        <AndroidTextContent
          content={reading.content}
          onTextSelect={onTextSelect}
          onSelectionChange={onSelectionChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  metadataContainer: {
    gap: 12,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryText: {
    fontSize: 13,
    color: Colors.accent.primary,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    lineHeight: 32,
  },
  description: {
    fontSize: 15,
    color: Colors.text.secondary,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    opacity: 0.6,
  },
  hintText: {
    fontSize: 12,
    color: Colors.text.muted,
    fontStyle: 'italic',
  },
  content: {
    fontSize: 17,
    color: Colors.text.primary,
    lineHeight: 28,
    padding: 0,
    margin: 0,
    // Quitar estilos de TextInput para que parezca Text plano
    backgroundColor: 'transparent',
    borderWidth: 0,
    textAlignVertical: 'top',
  },
  webView: {
    backgroundColor: 'transparent',
    opacity: 0.99, // Hack para forzar hardware layer en Android
  },
});
