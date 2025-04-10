import { Stack } from "expo-router";

export default function MainStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="purchaseHistory" />
      <Stack.Screen name="purchaseDetail" />
      <Stack.Screen name="receiptViewer" />
      <Stack.Screen name="expiringProducts" />
      <Stack.Screen name="productDetails" options={{ presentation: "modal" }} />
      <Stack.Screen name="shopping-lists" options={{ headerShown: false }} />
      <Stack.Screen name="recipes" options={{ headerShown: false }} />
      <Stack.Screen name="recipeDetail" options={{ headerShown: false }} />
    </Stack>
  );
}
