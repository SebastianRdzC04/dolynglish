/**
 * Pantalla de historial completo de lecturas
 * Muestra todas las lecturas completadas con scroll infinito
 */

import { useEffect, useCallback, useState } from "react";
import { FlatList, StyleSheet, RefreshControl, View } from "react-native";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";

// Features
import { ReadingCard, useReadings, getCategoryLabel, getEstimatedTime } from "@/src/features/readings";
import type { Reading } from "@/src/features/readings";

// Shared
import { Loading, EmptyState } from "@/src/shared/components/ui";

export default function ReadingsHistoryScreen() {
  const router = useRouter();
  const { completedReadings, isLoadingCompleted, refetchCompleted } = useReadings();
  const [refreshing, setRefreshing] = useState(false);

  // Cargar datos al montar
  useEffect(() => {
    refetchCompleted();
  }, [refetchCompleted]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchCompleted();
    setRefreshing(false);
  }, [refetchCompleted]);

  const handleReadingPress = (id: number) => {
    router.push(`/reading/${id}`);
  };

  const renderItem = useCallback(
    ({ item }: { item: Reading }) => (
      <ReadingCard
        title={item.title}
        wordCount={item.wordCount}
        difficulty={item.difficulty}
        category={getCategoryLabel(item.category)}
        estimatedTime={getEstimatedTime(item.wordCount)}
        onPress={() => handleReadingPress(item.id)}
      />
    ),
    []
  );

  const keyExtractor = useCallback((item: Reading) => item.id.toString(), []);

  if (isLoadingCompleted && !refreshing && completedReadings.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Loading message="Cargando historial..." />
      </View>
    );
  }

  return (
    <FlatList
      data={completedReadings}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.accent.primary}
        />
      }
      ListEmptyComponent={
        <EmptyState
          icon="checkmark-done-outline"
          title="Sin lecturas completadas"
          subtitle="Completa lecturas para verlas aquí"
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background.primary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  separator: {
    height: 12,
  },
});
