import { Text, View, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { Colors } from "@/constants/Colors";
import { useSession } from "@/context/AuthContext";

export default function Index() {
  const { user } = useSession();

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>
        ¡Hola, {user?.fullName?.split(" ")[0] || "Usuario"}! 👋
      </Text>
      <Text style={styles.text}>Bienvenido a Dolynglish</Text>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
        onPress={() => router.push("/more")}
      >
        <Text style={styles.buttonText}>Ir a More</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  greeting: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.accent.primary,
    marginBottom: 8,
  },
  text: {
    color: Colors.text.primary,
    fontSize: 16,
    marginBottom: 24,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.background.secondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.accent.primary,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    color: Colors.accent.primary,
  },
});
