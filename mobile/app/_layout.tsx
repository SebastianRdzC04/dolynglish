import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import * as SystemUI from "expo-system-ui";
import { Colors } from "@/constants/Colors";
import { SessionProvider, useSession } from "@/context/AuthContext";

// Establecer el color de fondo del root view para las transiciones
SystemUI.setBackgroundColorAsync(Colors.background.primary);

function RootLayoutNav() {
  const { session, isLoading } = useSession();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      // No hay sesión y no está en auth, redirigir a login
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      // Hay sesión pero está en auth, redirigir a tabs
      router.replace("/(tabs)");
    }
  }, [session, segments, isLoading]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.background.primary,
        },
        headerTintColor: Colors.text.primary,
        contentStyle: {
          backgroundColor: Colors.background.primary,
        },
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false, title: "Inicio" }}
      />
      <Stack.Screen name="reading" options={{ headerShown: false }} />
      <Stack.Screen name="more" options={{ title: "More" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <RootLayoutNav />
    </SessionProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background.primary,
  },
});
