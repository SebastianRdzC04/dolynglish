import { Text, View, StyleSheet, ScrollView } from "react-native";
import { Colors } from "@/constants/Colors";
import { useSession } from "@/context/AuthContext";
import StreakBadge from "@/Components/StreakBadge";
import ReadingCard from "@/Components/ReadingCard";

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

        {/* Lecturas disponibles */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Continuar aprendiendo</Text>
          <View style={styles.readingsContainer}>
            <ReadingCard
              title="The Lost City of Machu Picchu"
              wordCount={350}
              difficulty="easy"
              category="Viajes"
              estimatedTime={5}
              onPress={() => console.log("Abrir lectura 1")}
            />
            <ReadingCard
              title="The Future of Artificial Intelligence in Healthcare"
              wordCount={720}
              difficulty="medium"
              category="Tecnología"
              estimatedTime={10}
              onPress={() => console.log("Abrir lectura 2")}
            />
            <ReadingCard
              title="Quantum Physics: Understanding the Uncertainty Principle"
              wordCount={1200}
              difficulty="hard"
              category="Ciencia"
              estimatedTime={15}
              onPress={() => console.log("Abrir lectura 3")}
            />
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
  readingsContainer: {
    gap: 12,
  },
});
