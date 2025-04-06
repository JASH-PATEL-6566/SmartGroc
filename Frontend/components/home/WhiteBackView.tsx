// import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
// import React from "react";
// import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
// import { useRouter } from "expo-router";
// import ThreeList from "@/components/home/ThreeList";

// const data = [
//   { title: "Apple", description: "Expires in 2 days" },
//   { title: "Bread", description: "Expires in 3 days" },
//   { title: "Can", description: "Expires in 7 days" },
// ];

// type WhiteBackViewProps = {
//   heading: string;
//   next: string;
//   marginBottom?: number;
// };

// const WhiteBackView = ({
//   heading,
//   next,
//   marginBottom = 0,
// }: WhiteBackViewProps) => {
//   const router = useRouter();
//   return (
//     <View style={{ ...styles.container, marginBottom: marginBottom }}>
//       <View style={styles.header}>
//         <Text style={styles.heading}>{heading}</Text>
//         <TouchableOpacity
//           onPress={() => router.navigate("/(main)/(tabs)/home")}
//         >
//           <MaterialCommunityIcons
//             name="dots-horizontal"
//             size={24}
//             color="black"
//           />
//         </TouchableOpacity>
//       </View>
//       <View style={styles.listContainer}>
//         {data.map((item, index) => {
//           return <ThreeList key={index} item={item} />;
//         })}
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     marginTop: 20,
//     backgroundColor: "white",
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     borderRadius: 10,
//     boxShadow: "rgba(168, 168, 168, 0.05) 0px 0px 0px 1px",
//   },
//   header: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   heading: {
//     fontSize: 20,
//     fontWeight: "bold",
//     color: "black",
//   },
//   listContainer: {
//     paddingTop: 15,
//     gap: 10,
//   },
// });

// export default WhiteBackView;
"use client";

import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import ThreeList from "@/components/home/ThreeList";

type WhiteBackViewProps = {
  heading: string;
  next: string;
  marginBottom?: number;
  items?: any[];
};

const WhiteBackView = ({
  heading,
  next = "/",
  marginBottom = 0,
  items = [],
}: WhiteBackViewProps) => {
  const router = useRouter();

  const handleViewAll = () => {
    if (heading === "Expiring Soon") {
      router.push("/(main)/expiringProducts");
    } else if (next) {
      router.navigate(next as any);
    }
  };

  return (
    <View style={{ ...styles.container, marginBottom: marginBottom }}>
      <View style={styles.header}>
        <Text style={styles.heading}>{heading}</Text>
        <TouchableOpacity onPress={handleViewAll}>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.listContainer}>
        {items && items.length > 0 ? (
          items.map((item, index) => {
            return <ThreeList key={index} item={item} />;
          })
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="information-outline"
              size={24}
              color="#888"
            />
            <Text style={styles.emptyText}>No items to display</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    color: "black",
  },
  viewAll: {
    fontSize: 14,
    color: "#28a745",
    fontWeight: "500",
  },
  listContainer: {
    paddingTop: 15,
    gap: 10,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: "#888",
    marginTop: 8,
  },
});

export default WhiteBackView;
