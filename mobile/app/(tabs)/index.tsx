import { Text, View, StyleSheet, ScrollView } from "react-native";
import { Colors } from "@/constants/Colors";
import { useSession } from "@/context/AuthContext";
import StreakBadge from "@/Components/StreakBadge";

export default function Index() {
  const { user } = useSession();

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.container}>
        {/* Header con saludo */}
        <View style={styles.header}>
          <Text style={styles.greeting}>
            ¡Hola, {user?.fullName?.split(" ")[0] || "Usuario"}! 👋
          </Text>
          <Text style={styles.subtitle}>Continúa aprendiendo</Text>
        </View>

        {/* Streak Badge */}
        <StreakBadge />

        {/* Espacio para más contenido */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Continuar aprendiendo</Text>
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>
              Próximas lecciones aquí...
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 24,
  },
  header: {
    gap: 4,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  placeholder: {
    backgroundColor: Colors.background.secondary,
    borderRadius: 12,
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border.light,
    borderStyle: "dashed",
  },
  placeholderText: {
    color: Colors.text.secondary,
    fontSize: 14,
  },
});
