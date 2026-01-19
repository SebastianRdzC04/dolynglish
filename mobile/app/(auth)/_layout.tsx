import { Stack } from "expo-router";
import { Colors } from "@/constants/Colors";

export default function AuthLayout() {
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
        contentStyle: {
          backgroundColor: Colors.background.primary,
        },
        navigationBarColor: Colors.background.primary,
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: "Iniciar Sesión",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          title: "Crear Cuenta",
          headerBackTitle: "Login",
        }}
      />
    </Stack>
  );
}
