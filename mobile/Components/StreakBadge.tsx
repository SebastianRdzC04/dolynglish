import { View, Text, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";
import WeeklyProgress from "./WeeklyProgress";
import Ionicons from "@expo/vector-icons/Ionicons";

// Calcula el índice del día actual (Lunes = 0, Domingo = 6)
function getTodayIndex(): number {
  const day = new Date().getDay(); // 0 = Domingo, 1 = Lunes, ...
  return day === 0 ? 6 : day - 1; // Convertir: Lunes = 0, Domingo = 6
}

export default function StreakBadge() {
  // TODO: Estos datos vendrán de StreakContext/API/LocalStorage
  // Por ahora son datos mock
  const currentStreak = 1;
  const completedDays = [true, true, false, false, false, false, false]; // [L, M, X, J, V, S, D]

  const isStreakActive = currentStreak > 0;
  const todayIndex = getTodayIndex();

  return (
    <View style={styles.container}>
      {/* Header con icono de fuego y contador */}
      <View style={styles.header}>
        <View style={styles.streakInfo}>
          <View
            style={[
              styles.fireContainer,
              isStreakActive && styles.fireContainerActive,
            ]}
          >
            <Ionicons
              name="flame"
              size={28}
              color={isStreakActive ? Colors.accent.strong : Colors.gray.pepper}
            />
          </View>
          <View style={styles.streakTextContainer}>
            <Text style={styles.streakNumber}>{currentStreak}</Text>
            <Text style={styles.streakLabel}>
              {currentStreak === 1 ? "día de racha" : "días de racha"}
            </Text>
          </View>
        </View>

        {isStreakActive && (
          <View style={styles.badge}>
            <Ionicons name="trophy" size={16} color={Colors.accent.primary} />
            <Text style={styles.badgeText}>¡Sigue así!</Text>
          </View>
        )}
      </View>

      {/* Línea divisoria */}
      <View style={styles.divider} />

      {/* Progreso semanal */}
      <View style={styles.weeklySection}>
        <Text style={styles.weeklyTitle}>Esta semana</Text>
        <WeeklyProgress completedDays={completedDays} todayIndex={todayIndex} />
      </View>

      {/* Mensaje motivacional */}
      {!completedDays[todayIndex] && (
        <View style={styles.reminderContainer}>
          <Ionicons
            name="notifications-outline"
            size={16}
            color={Colors.accent.primary}
          />
          <Text style={styles.reminderText}>
            ¡Practica hoy para mantener tu racha!
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  streakInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fireContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.gray.dark,
    justifyContent: "center",
    alignItems: "center",
  },
  fireContainerActive: {
    backgroundColor: "rgba(231, 111, 81, 0.2)", // accent.strong con opacidad
  },
  streakTextContainer: {
    gap: 2,
  },
  streakNumber: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.text.primary,
  },
  streakLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(244, 162, 97, 0.15)", // accent.primary con opacidad
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.accent.primary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border.light,
    marginVertical: 16,
  },
  weeklySection: {
    gap: 8,
  },
  weeklyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.secondary,
  },
  reminderContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    backgroundColor: "rgba(244, 162, 97, 0.1)",
    padding: 12,
    borderRadius: 10,
  },
  reminderText: {
    fontSize: 13,
    color: Colors.accent.primary,
    flex: 1,
  },
});
