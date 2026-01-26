/**
 * Pantalla de perfil
 * Muestra información del usuario y historial de lecturas
 */

import { Text, View, StyleSheet, Pressable } from "react-native";
import { useEffect, useCallback, useState } from "react";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import Ionicons from "@expo/vector-icons/Ionicons";

// Features
import { useSession } from "@/src/features/auth";
import { ReadingList, useReadings } from "@/src/features/readings";

// Shared
import { Screen, SectionHeader } from "@/src/shared/components/layout";
import { Card } from "@/src/shared/components/ui";

export default function ProfileScreen() {
  const { user, signOut } = useSession();
  const router = useRouter();
  const { completedReadings, isLoadingCompleted, refetchCompleted } = useReadings();
  const [refreshing, setRefreshing] = useState(false);

  // Cargar historial al montar
  useEffect(() => {
    refetchCompleted();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchCompleted();
    setRefreshing(false);
  }, [refetchCompleted]);

  const handleReadingPress = (readingId: number) => {
    router.push(`/reading/${readingId}`);
  };

  return (
    <Screen
      onRefresh={onRefresh}
      refreshing={refreshing}
      paddingHorizontal={24}
      paddingVertical={40}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={50} color={Colors.accent.primary} />
        </View>
        <Text style={styles.userName}>{user?.fullName || "Usuario"}</Text>
        <Text style={styles.userEmail}>{user?.email || ""}</Text>
      </View>

      {/* Stats Section */}
      <View style={styles.statsSection}>
        {/* Streak Card */}
        <Card style={styles.statCard}>
          <Ionicons name="flame" size={28} color={Colors.accent.strong} />
          <Text style={styles.statValue}>{user?.currentStreak || 0}</Text>
          <Text style={styles.statLabel}>Racha actual</Text>
        </Card>

        {/* Completed Card */}
        <Card style={styles.statCard}>
          <Ionicons name="checkmark-circle" size={28} color={Colors.status.success} />
          <Text style={styles.statValue}>{completedReadings.length}</Text>
          <Text style={styles.statLabel}>Completadas</Text>
        </Card>
      </View>

      {/* Info */}
      <Card>
        <View style={styles.infoItem}>
          <Ionicons name="calendar-outline" size={20} color={Colors.gray.pepper} />
          <Text style={styles.infoLabel}>Miembro desde</Text>
          <Text style={styles.infoValue}>
            {user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString("es-MX")
              : "-"}
          </Text>
        </View>
      </Card>

      {/* Historial de lecturas completadas */}
      <View style={styles.historySection}>
        <SectionHeader title="Historial de Lecturas" />

        <ReadingList
          readings={completedReadings}
          isLoading={isLoadingCompleted && !refreshing}
          emptyTitle="Aún no has completado ninguna lectura"
          emptySubtitle="Completa lecturas para ver tu historial aquí"
          emptyIcon="checkmark-done-outline"
          onReadingPress={handleReadingPress}
        />
      </View>

      {/* Logout Button */}
      <Pressable
        style={({ pressed }) => [
          styles.logoutButton,
          pressed && styles.logoutButtonPressed,
        ]}
        onPress={signOut}
      >
        <Ionicons name="log-out-outline" size={20} color={Colors.status.error} />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatarContainer: {
    alignItems: "center",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.background.secondary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.accent.primary,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  statsSection: {
    flexDirection: "row",
    gap: 16,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.text.secondary,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text.primary,
  },
  historySection: {
    gap: 16,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.status.error,
  },
  logoutButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  logoutText: {
    fontSize: 16,
    color: Colors.status.error,
    fontWeight: "600",
  },
});
