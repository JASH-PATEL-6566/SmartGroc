import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import React from "react";

type ItemType = {
  title: string;
  description: string;
};

const ThreeList = ({ item }: { item: ItemType}) => {
  return (
    <TouchableOpacity style={styles.list}>
      <Image
        source={require("../../assets/images/apple.avif")}
        width={75}
        height={75}
        style={styles.image}
      />
      <View>
        <Text style={styles.listHeading}>{item.title}</Text>
        <Text style={styles.listDescription}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  list: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  image: {
    borderRadius: 10,
  },
  listHeading: {
    fontSize: 22,
    fontWeight: "bold",
  },
  listDescription: {
    fontSize: 16,
    color: "gray",
  },
});

export default ThreeList;
