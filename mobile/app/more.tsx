import { Text, View, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";

export default function MoreScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Esta es la pantalla More</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background.primary,
  },
  text: {
    color: Colors.text.primary,
    fontSize: 16,
  },
});
