import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet } from "react-native";
import { HomeScreen } from "./src/screens/HomeScreen";
import { initializeDatabaseAsync } from "./src/database/client";
import { useEffect } from "react";
import { APP_COLORS } from "./src/theme/colors";

export default function App() {
  useEffect(() => {
    void initializeDatabaseAsync();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <HomeScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: APP_COLORS.background,
  },
});
