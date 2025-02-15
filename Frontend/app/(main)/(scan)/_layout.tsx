import { Stack } from "expo-router";

export default function ScanLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="scan" />
    </Stack>
  );
}
