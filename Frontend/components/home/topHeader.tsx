"use client";

import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { User } from "../../redux/authSlice";

const TopHeader = ({ user }: { user: User }) => {
  const router = useRouter();

  const handleNotificationPress = () => {
    router.push("/(main)/notificationHistory");
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.textContainer}>
          <Text style={styles.heading}>Hello, {user.displayName}</Text>
          <Text style={styles.description}>What's in your kitchen?</Text>
        </View>
        <TouchableOpacity
          style={styles.iconContainer}
          onPress={handleNotificationPress}
        >
          <MaterialCommunityIcons name="bell-outline" size={27} color="black" />
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
  },
  textContainer: {},
  heading: {
    fontSize: 30,
    fontWeight: "bold",
    color: "black",
  },
  description: {
    fontSize: 17,
    color: "gray",
  },
  iconContainer: {
    backgroundColor: "#e3e3e3",
    padding: 8,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default TopHeader;
