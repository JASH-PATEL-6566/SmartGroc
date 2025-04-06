import { Tabs } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, size, color }) => {
          let iconName: keyof typeof MaterialCommunityIcons.glyphMap;

          if (route.name === "home") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "(scan)") {
            iconName = "barcode-scan";
          } else if (route.name === "list") {
            iconName = "format-list-bulleted";
          } else if (route.name === "profile") {
            iconName = focused ? "account" : "account-outline";
          } else if (route.name === "map") {
            iconName = focused ? "map" : "map-outline";
          } else {
            iconName = "help-circle";
          }
          color = focused ? "#28a745" : "gray";

          return (
            <MaterialCommunityIcons name={iconName} size={size} color={color} />
          );
        },
        tabBarActiveTintColor: "#28a745",
        tabBarInactiveTintColor: "gray",
      })}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="map" options={{ title: "Map" }} />
      <Tabs.Screen name="(scan)" options={{ title: "scan" }} />
      <Tabs.Screen name="list" />
      <Tabs.Screen
        name="profile"
        options={{ headerTitle: "Profile & Preferences", headerShown: true }}
      />
    </Tabs>
  );
}
