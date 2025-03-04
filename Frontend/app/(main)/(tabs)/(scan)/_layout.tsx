import { Stack } from "expo-router";

export default function ScanLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName="Scan">
      <Stack.Screen name="scan" />
      <Stack.Screen name="productDetails" options={{ presentation: "modal" }} />
      <Stack.Screen name="cart" options={{ headerShown: false }} />
      <Stack.Screen
        name="confirmPurchase"
        options={{ headerShown: false, presentation: "modal" }}
      />
    </Stack>
  );
}
