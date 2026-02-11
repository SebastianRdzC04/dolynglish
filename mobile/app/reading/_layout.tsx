import { Stack } from "expo-router";
import { Colors } from "@/src/core/theme";

export default function ReadingLayout() {
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
        name="[id]"
        options={{
          title: "Lectura",
          headerBackTitle: "Volver",
        }}
      />
      <Stack.Screen
        name="evaluate"
        options={{
          title: "Evaluación",
          headerBackTitle: "Lectura",
        }}
      />
    </Stack>
  );
}
