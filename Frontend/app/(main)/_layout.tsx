import { Stack } from "expo-router";

export default function MainStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="/(main)/home" />
    </Stack>
  );
}
