import {
  Text,
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useEffect, useCallback, useState } from "react";
import { useRouter } from "expo-router";
import { Colors } from "@/constants/Colors";
import { useSession } from "@/context/AuthContext";
import { useReadings } from "@/hooks/useReadings";
import ReadingCard from "@/Components/ReadingCard";
import { categoryLabels, getEstimatedTime } from "@/types/readings";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function ProfileScreen() {
  const { user, signOut } = useSession();
  const router = useRouter();
  const {
    completedReadings,
    isLoadingCompleted,
    refetchCompleted,
  } = useReadings();

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
    // Navegar a la lectura completada (modo solo lectura)
    router.push(`/reading/${readingId}`);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.accent.primary}
          colors={[Colors.accent.primary]}
        />
      }
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
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="flame" size={28} color={Colors.accent.strong} />
          </View>
          <Text style={styles.statValue}>{user?.currentStreak || 0}</Text>
          <Text style={styles.statLabel}>Racha actual</Text>
        </View>

        {/* Completed Card */}
        <View style={styles.statCard}>
          <View style={styles.statIconContainer}>
            <Ionicons name="checkmark-circle" size={28} color={Colors.status.success} />
          </View>
          <Text style={styles.statValue}>{completedReadings.length}</Text>
          <Text style={styles.statLabel}>Completadas</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.infoSection}>
        <View style={styles.infoItem}>
          <Ionicons
            name="calendar-outline"
            size={20}
            color={Colors.gray.pepper}
          />
          <Text style={styles.infoLabel}>Miembro desde</Text>
          <Text style={styles.infoValue}>
            {user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString("es-MX")
              : "-"}
          </Text>
        </View>
      </View>

      {/* Historial de lecturas completadas */}
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Historial de Lecturas</Text>

        {isLoadingCompleted && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={Colors.accent.primary} />
          </View>
        ) : completedReadings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="book-outline"
              size={48}
              color={Colors.gray.pepper}
            />
            <Text style={styles.emptyText}>
              Aún no has completado ninguna lectura
            </Text>
            <Text style={styles.emptySubtext}>
              Completa lecturas para ver tu historial aquí
            </Text>
          </View>
        ) : (
          <View style={styles.readingsList}>
            {completedReadings.map((reading) => (
              <View key={reading.id} style={styles.readingCardWrapper}>
                <ReadingCard
                  title={reading.title}
                  wordCount={reading.wordCount}
                  difficulty={reading.difficulty}
                  category={categoryLabels[reading.category]}
                  estimatedTime={getEstimatedTime(reading.wordCount)}
                  onPress={() => handleReadingPress(reading.id)}
                />
                {/* Score badge */}
                {reading.score !== null && (
                  <View
                    style={[
                      styles.scoreBadge,
                      reading.passed
                        ? styles.scoreBadgePassed
                        : styles.scoreBadgeFailed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.scoreText,
                        reading.passed
                          ? styles.scoreTextPassed
                          : styles.scoreTextFailed,
                      ]}
                    >
                      {reading.score}%
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Logout Button */}
      <Pressable
        style={({ pressed }) => [
          styles.logoutButton,
          pressed && styles.logoutButtonPressed,
        ]}
        onPress={signOut}
      >
        <Ionicons
          name="log-out-outline"
          size={20}
          color={Colors.status.error}
        />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </Pressable>

      {/* Bottom spacing */}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  avatarContainer: {
    alignItems: "center",
    marginBottom: 24,
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
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.text.primary,
  },
  statLabel: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 4,
  },
  infoSection: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
    marginBottom: 16,
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.gray.pepper,
    marginTop: 4,
  },
  readingsList: {
    gap: 12,
  },
  readingCardWrapper: {
    position: "relative",
  },
  scoreBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreBadgePassed: {
    backgroundColor: "rgba(46, 204, 113, 0.15)",
  },
  scoreBadgeFailed: {
    backgroundColor: "rgba(231, 76, 60, 0.15)",
  },
  scoreText: {
    fontSize: 12,
    fontWeight: "700",
  },
  scoreTextPassed: {
    color: Colors.status.success,
  },
  scoreTextFailed: {
    color: Colors.status.error,
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
  bottomSpacer: {
    height: 40,
  },
});
