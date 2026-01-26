/**
 * Layout para las pantallas de readings
 */

import { Stack } from "expo-router";
import { Colors } from "@/constants/Colors";

export default function ReadingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.background.primary,
        },
        headerTintColor: Colors.text.primary,
        headerTitleStyle: {
          fontWeight: "600",
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: Colors.background.primary,
        },
      }}
    >
      <Stack.Screen
        name="history"
        options={{
          title: "Historial de Lecturas",
          headerBackTitle: "Perfil",
        }}
      />
    </Stack>
  );
}
