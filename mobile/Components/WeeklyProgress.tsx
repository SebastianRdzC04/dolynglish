import { View, StyleSheet } from "react-native";
import ProgressDay from "./ProgressDay";
import { Colors } from "@/constants/Colors";

interface WeeklyProgressProps {
  completedDays: boolean[]; // Array de 7 días [L, M, X, J, V, S, D]
  todayIndex: number; // 0-6 (Lunes = 0, Domingo = 6)
}

const DAYS = ["L", "M", "X", "J", "V", "S", "D"];

export default function WeeklyProgress({
  completedDays,
  todayIndex,
}: WeeklyProgressProps) {
  return (
    <View style={styles.container}>
      <View style={styles.progressLine} />
      <View style={styles.daysContainer}>
        {DAYS.map((day, index) => (
          <ProgressDay
            key={day}
            day={day}
            isCompleted={completedDays[index] ?? false}
            isToday={index === todayIndex}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    paddingVertical: 8,
  },
  progressLine: {
    position: "absolute",
    top: 24,
    left: 16,
    right: 16,
    height: 2,
    backgroundColor: Colors.gray.dark,
  },
  daysContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
});
