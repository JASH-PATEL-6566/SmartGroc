import { Stack } from "expo-router";

export default function AuthStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="/(auth)/login" />
      <Stack.Screen name="/(auth)/signup" />
    </Stack>
  );
}
