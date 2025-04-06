// "use client";

// import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
// import { MaterialCommunityIcons } from "@expo/vector-icons";
// import { useRouter } from "expo-router";

// type ItemType = {
//   id: string;
//   name: string;
//   brand: string;
//   imageUrl: string;
//   expiryDate?: string | null;
//   daysUntilExpiry?: number | null;
//   description?: string;
//   foods?: any;
// };

// const ThreeList = ({ item }: { item: ItemType }) => {
//   const router = useRouter();

//   // Get expiry status color
//   const getExpiryStatusColor = (days: number | null | undefined) => {
//     if (days === null || days === undefined) return "#888"; // No expiry date
//     if (days < 0) return "#ff4d4f"; // Expired
//     if (days === 0) return "#ff4d4f"; // Expires today
//     if (days <= 3) return "#ff9800"; // Expiring soon (within 3 days)
//     return "#28a745"; // Good (more than 3 days)
//   };

//   // Get expiry status text
//   const getExpiryStatusText = (days: number | null | undefined) => {
//     if (days === null || days === undefined) return "No expiry date";
//     if (days < 0) return "Expired";
//     if (days === 0) return "Expires today";
//     if (days === 1) return "Expires tomorrow";
//     return `Expires in ${days} days`;
//   };

//   const handlePress = () => {
//     if (item.expiryDate) {
//       // Navigate to product details
//       const basicProductData = {
//         foods: item.foods,
//       };

//       router.push({
//         pathname: "/(main)/productDetails",
//         params: { data: JSON.stringify(basicProductData), source: "home" },
//       });
//     } else if (item.description) {
//       // For shopping list items, navigate to the shopping lists page
//       router.push("/(main)/shopping-lists");
//     }
//   };

//   return (
//     <TouchableOpacity style={styles.list} onPress={handlePress}>
//       {item.imageUrl ? (
//         <Image source={{ uri: item.imageUrl }} style={styles.image} />
//       ) : (
//         <View style={styles.imagePlaceholder}>
//           <MaterialCommunityIcons name="food" size={24} color="#888" />
//         </View>
//       )}
//       <View style={styles.infoContainer}>
//         <Text style={styles.listHeading} numberOfLines={1}>
//           {item.name}
//         </Text>
//         <Text style={styles.brandText} numberOfLines={1}>
//           {item.brand}
//         </Text>
//         {item.daysUntilExpiry !== undefined && (
//           <View style={styles.expiryContainer}>
//             <MaterialCommunityIcons
//               name="calendar-clock"
//               size={14}
//               color={getExpiryStatusColor(item.daysUntilExpiry)}
//             />
//             <Text
//               style={[
//                 styles.expiryText,
//                 { color: getExpiryStatusColor(item.daysUntilExpiry) },
//               ]}
//             >
//               {getExpiryStatusText(item.daysUntilExpiry)}
//             </Text>
//           </View>
//         )}
//         {item.description && !item.expiryDate && (
//           <Text style={styles.listDescription}>{item.description}</Text>
//         )}
//       </View>
//     </TouchableOpacity>
//   );
// };

// const styles = StyleSheet.create({
//   list: {
//     flexDirection: "row",
//     alignItems: "center",
//     paddingVertical: 8,
//     borderBottomWidth: 1,
//     borderBottomColor: "#f0f0f0",
//   },
//   image: {
//     width: 60,
//     height: 60,
//     borderRadius: 8,
//   },
//   imagePlaceholder: {
//     width: 60,
//     height: 60,
//     borderRadius: 8,
//     backgroundColor: "#f0f0f0",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   infoContainer: {
//     flex: 1,
//     marginLeft: 15,
//   },
//   listHeading: {
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   brandText: {
//     fontSize: 14,
//     color: "#666",
//     marginTop: 2,
//   },
//   listDescription: {
//     fontSize: 14,
//     color: "gray",
//     marginTop: 4,
//   },
//   expiryContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginTop: 4,
//   },
//   expiryText: {
//     fontSize: 13,
//     marginLeft: 4,
//     fontWeight: "500",
//   },
// });

// export default ThreeList;
"use client";

import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type ItemType = {
  id: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  expiryDate?: string | null;
  daysUntilExpiry?: number | null;
  description?: string;
  foods?: any;
  itemCount?: number;
  createdAt?: number;
};

const ThreeList = ({ item }: { item: ItemType }) => {
  const router = useRouter();

  // Get expiry status color
  const getExpiryStatusColor = (days: number | null | undefined) => {
    if (days === null || days === undefined) return "#888"; // No expiry date
    if (days < 0) return "#ff4d4f"; // Expired
    if (days === 0) return "#ff4d4f"; // Expires today
    if (days <= 3) return "#ff9800"; // Expiring soon (within 3 days)
    return "#28a745"; // Good (more than 3 days)
  };

  // Get expiry status text
  const getExpiryStatusText = (days: number | null | undefined) => {
    if (days === null || days === undefined) return "No expiry date";
    if (days < 0) return "Expired";
    if (days === 0) return "Expires today";
    if (days === 1) return "Expires tomorrow";
    return `Expires in ${days} days`;
  };

  const handlePress = () => {
    if (item.expiryDate) {
      // Navigate to product details
      const basicProductData = {
        foods: item.foods,
      };

      router.push({
        pathname: "/(main)/productDetails",
        params: { data: JSON.stringify(basicProductData), source: "home" },
      });
    } else if (item.itemCount !== undefined) {
      // For shopping lists, navigate to the shopping lists page
      router.push("/(main)/shopping-lists");
    } else if (item.description) {
      // For recipe suggestions
      // This could be expanded to navigate to a recipe details page
      router.push("/(main)/shopping-lists");
    }
  };

  // Determine if this is a shopping list item
  const isShoppingList = item.itemCount !== undefined;

  return (
    <TouchableOpacity style={styles.list} onPress={handlePress}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
      ) : (
        <View style={styles.imagePlaceholder}>
          {isShoppingList ? (
            <MaterialCommunityIcons
              name="clipboard-list"
              size={24}
              color="#888"
            />
          ) : (
            <MaterialCommunityIcons name="food" size={24} color="#888" />
          )}
        </View>
      )}
      <View style={styles.infoContainer}>
        <Text style={styles.listHeading} numberOfLines={1}>
          {item.name}
        </Text>
        {item.brand && (
          <Text style={styles.brandText} numberOfLines={1}>
            {item.brand}
          </Text>
        )}
        {item.daysUntilExpiry !== undefined && (
          <View style={styles.expiryContainer}>
            <MaterialCommunityIcons
              name="calendar-clock"
              size={14}
              color={getExpiryStatusColor(item.daysUntilExpiry)}
            />
            <Text
              style={[
                styles.expiryText,
                { color: getExpiryStatusColor(item.daysUntilExpiry) },
              ]}
            >
              {getExpiryStatusText(item.daysUntilExpiry)}
            </Text>
          </View>
        )}
        {item.description && !item.expiryDate && (
          <Text style={styles.listDescription}>{item.description}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  list: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  infoContainer: {
    flex: 1,
    marginLeft: 15,
  },
  listHeading: {
    fontSize: 16,
    fontWeight: "bold",
  },
  brandText: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  listDescription: {
    fontSize: 14,
    color: "gray",
    marginTop: 4,
  },
  expiryContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  expiryText: {
    fontSize: 13,
    marginLeft: 4,
    fontWeight: "500",
  },
});

export default ThreeList;
