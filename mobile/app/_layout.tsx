import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import * as SystemUI from "expo-system-ui";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Colors } from "@/constants/Colors";
import { SessionProvider, useSession } from "@/src/features/auth";
import { Loading } from "@/src/shared/components/ui";

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
    return <Loading fullScreen />;
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
      <Stack.Screen name="readings" options={{ headerShown: false }} />
      <Stack.Screen name="more" options={{ title: "More" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SessionProvider>
        <RootLayoutNav />
      </SessionProvider>
    </GestureHandlerRootView>
  );
}
