// "use client";

// import { StatusBar, StyleSheet, ScrollView } from "react-native";
// import { useSelector } from "react-redux";
// import { useEffect, useState, useCallback } from "react";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { collection, getDocs } from "firebase/firestore";
// import { db } from "@/config/firebaseConfig";
// import type { RootState } from "@/redux/store";
// import TopHeader from "@/components/home/topHeader";
// import WhiteBackView from "@/components/home/WhiteBackView";
// import SafeAreaViewBackground from "@/components/SafeAreaViewBackground";

// type Product = {
//   id: string;
//   name: string;
//   brand: string;
//   imageUrl: string;
//   expiryDate?: string | null;
//   daysUntilExpiry?: number | null;
//   foods: any;
// };

// const Home = () => {
//   const user = useSelector((state: RootState) => state.auth.user);
//   const [expiringProducts, setExpiringProducts] = useState<Product[]>([]);
//   const [loading, setLoading] = useState(true);
//   const { uid } = useSelector((state: RootState) => state.auth.user);

//   // Calculate days until expiry
//   const getDaysUntilExpiry = (dateString: string | null | undefined) => {
//     if (!dateString) return null;
//     try {
//       const expiryDate = new Date(dateString);
//       const today = new Date();

//       // Reset time part for accurate day calculation
//       today.setHours(0, 0, 0, 0);
//       expiryDate.setHours(0, 0, 0, 0);

//       const diffTime = expiryDate.getTime() - today.getTime();
//       const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

//       return diffDays;
//     } catch (error) {
//       return null;
//     }
//   };

//   // Load expiring products
//   const loadExpiringProducts = useCallback(async () => {
//     try {
//       setLoading(true);
//       const expiringItems: Product[] = [];

//       // 1. Load scanned products from AsyncStorage
//       const savedProducts = await AsyncStorage.getItem("@scanned_products");
//       if (savedProducts) {
//         const parsedProducts = JSON.parse(savedProducts);
//         parsedProducts.forEach((product: any) => {
//           if (product.expiryDate) {
//             const daysUntilExpiry = getDaysUntilExpiry(product.expiryDate);
//             if (
//               daysUntilExpiry !== null &&
//               daysUntilExpiry <= 10 &&
//               daysUntilExpiry >= -1
//             ) {
//               expiringItems.push({
//                 ...product,
//                 daysUntilExpiry,
//               });
//             }
//           }
//         });
//       }

//       // 2. Load purchased products from Firestore
//       if (uid) {
//         // Get all purchases
//         const purchasesRef = collection(db, "users", uid, "purchase");
//         const purchasesSnapshot = await getDocs(purchasesRef);

//         // For each purchase, get its products
//         for (const purchaseDoc of purchasesSnapshot.docs) {
//           const purchaseId = purchaseDoc.id;
//           const productsRef = collection(
//             db,
//             "users",
//             uid,
//             "purchase",
//             purchaseId,
//             "products"
//           );
//           const productsSnapshot = await getDocs(productsRef);

//           productsSnapshot.docs.forEach((productDoc) => {
//             const productData = productDoc.data();
//             if (productData.expiryDate) {
//               const daysUntilExpiry = getDaysUntilExpiry(
//                 productData.expiryDate
//               );
//               if (
//                 daysUntilExpiry !== null &&
//                 daysUntilExpiry <= 10 &&
//                 daysUntilExpiry >= -1
//               ) {
//                 expiringItems.push({
//                   id: productDoc.id,
//                   name: productData.name || "Unknown Product",
//                   brand: productData.brand || "",
//                   imageUrl: productData.imageUrl || "",
//                   expiryDate: productData.expiryDate,
//                   daysUntilExpiry,
//                   foods: JSON.parse(productData.data).foods,
//                 });
//               }
//             }
//           });
//         }
//       }

//       // Sort by days until expiry (ascending)
//       expiringItems.sort((a, b) => {
//         if (a.daysUntilExpiry === null) return 1;
//         if (b.daysUntilExpiry === null) return -1;
//         return a.daysUntilExpiry - b.daysUntilExpiry;
//       });

//       // Take only the first 3 items
//       setExpiringProducts(expiringItems.slice(0, 3));
//     } catch (error) {
//       console.error("Error loading expiring products:", error);
//     } finally {
//       setLoading(false);
//     }
//   }, [uid]);

//   // Update the shoppingListItems to be dynamic instead of static
//   const [shoppingListItems, setShoppingListItems] = useState<any[]>([]);

//   // Add this function to load shopping list items
//   const loadShoppingListItems = useCallback(async () => {
//     try {
//       // First try to load from Firestore if user is logged in
//       if (uid) {
//         const listsRef = collection(db, "users", uid, "shopping_lists");
//         const listsSnapshot = await getDocs(listsRef);

//         if (!listsSnapshot.empty) {
//           const allItems: any[] = [];

//           // Get all lists and their items
//           listsSnapshot.forEach((doc) => {
//             const listData = doc.data();
//             // Only include non-purchased items
//             const nonPurchasedItems = (listData.items || [])
//               .filter((item: any) => !item.purchased)
//               .map((item: any) => ({
//                 id: item.id,
//                 name: item.name,
//                 brand: listData.name, // Use list name as the brand
//                 description: item.note || `Quantity: ${item.quantity}`,
//               }));

//             allItems.push(...nonPurchasedItems);
//           });

//           // Sort by most recent lists first (assuming items from newer lists should appear first)
//           // and limit to 3 items
//           setShoppingListItems(allItems.slice(0, 3));
//           return;
//         }
//       }

//       // Fall back to AsyncStorage if Firestore has no data or user is not logged in
//       const savedLists = await AsyncStorage.getItem("@shopping_lists");
//       if (savedLists) {
//         const parsedLists = JSON.parse(savedLists);
//         const allItems: any[] = [];

//         // Get all non-purchased items from all lists
//         parsedLists.forEach((list: any) => {
//           const nonPurchasedItems = (list.items || [])
//             .filter((item: any) => !item.purchased)
//             .map((item: any) => ({
//               id: item.id,
//               name: item.name,
//               brand: list.name, // Use list name as the brand
//               description: item.note || `Quantity: ${item.quantity}`,
//             }));

//           allItems.push(...nonPurchasedItems);
//         });

//         // Limit to 3 items
//         setShoppingListItems(allItems.slice(0, 3));
//       }
//     } catch (error) {
//       console.error("Error loading shopping list items:", error);
//       // Set default items if there's an error
//       setShoppingListItems([
//         {
//           id: "1",
//           name: "Milk",
//           brand: "Grocery",
//           description: "1 gallon, whole milk",
//         },
//         {
//           id: "2",
//           name: "Eggs",
//           brand: "Grocery",
//           description: "1 dozen, large",
//         },
//         {
//           id: "3",
//           name: "Bread",
//           brand: "Bakery",
//           description: "Whole wheat loaf",
//         },
//       ]);
//     }
//   }, [uid]);

//   // Add this to the existing useEffect that loads expiring products
//   useEffect(() => {
//     loadExpiringProducts();
//     loadShoppingListItems(); // Add this line to load shopping list items
//   }, [loadExpiringProducts, loadShoppingListItems]);

//   // Sample recipe suggestions data
//   const recipeSuggestions = [
//     {
//       id: "1",
//       name: "Pasta Primavera",
//       brand: "Home Recipe",
//       imageUrl:
//         "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?q=80&w=2070&auto=format&fit=crop",
//       description: "Use your expiring vegetables",
//     },
//     {
//       id: "2",
//       name: "Fruit Smoothie",
//       brand: "Quick Recipe",
//       imageUrl:
//         "https://images.unsplash.com/photo-1553530666-ba11a7da3888?q=80&w=2071&auto=format&fit=crop",
//       description: "Perfect for expiring fruits",
//     },
//     {
//       id: "3",
//       name: "Chicken Stir Fry",
//       brand: "Easy Dinner",
//       imageUrl:
//         "https://images.unsplash.com/photo-1603133872878-684f208fb84b?q=80&w=2025&auto=format&fit=crop",
//       description: "Quick meal with your ingredients",
//     },
//   ];

//   return (
//     <SafeAreaViewBackground>
//       <StatusBar hidden={false} />
//       <ScrollView style={styles.container}>
//         <TopHeader user={user} />
//         <WhiteBackView
//           heading="Expiring Soon"
//           next="/(main)/expiringProducts"
//           items={expiringProducts}
//         />
//         <WhiteBackView
//           heading="Recipe Suggestions"
//           next="next/page"
//           items={recipeSuggestions}
//         />
//         <WhiteBackView
//           heading="Shopping List"
//           next="/(main)/shopping-lists"
//           items={shoppingListItems}
//           marginBottom={20}
//         />
//       </ScrollView>
//     </SafeAreaViewBackground>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     paddingTop: 20,
//     paddingHorizontal: 20,
//   },
// });

// export default Home;
"use client";

import { StatusBar, StyleSheet, ScrollView } from "react-native";
import { useSelector } from "react-redux";
import { useEffect, useState, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/config/firebaseConfig";
import type { RootState } from "@/redux/store";
import TopHeader from "@/components/home/topHeader";
import WhiteBackView from "@/components/home/WhiteBackView";
import SafeAreaViewBackground from "@/components/SafeAreaViewBackground";

type Product = {
  id: string;
  name: string;
  brand: string;
  imageUrl: string;
  expiryDate?: string | null;
  daysUntilExpiry?: number | null;
  foods: any;
};

type ShoppingList = {
  id: string;
  name: string;
  createdAt: number;
  itemCount: number;
  description: string;
};

const Home = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [expiringProducts, setExpiringProducts] = useState<Product[]>([]);
  const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([]);
  const [loading, setLoading] = useState(true);
  const { uid } = useSelector((state: RootState) => state.auth.user);

  // Calculate days until expiry
  const getDaysUntilExpiry = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    try {
      const expiryDate = new Date(dateString);
      const today = new Date();

      // Reset time part for accurate day calculation
      today.setHours(0, 0, 0, 0);
      expiryDate.setHours(0, 0, 0, 0);

      const diffTime = expiryDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays;
    } catch (error) {
      return null;
    }
  };

  // Load expiring products
  const loadExpiringProducts = useCallback(async () => {
    try {
      setLoading(true);
      const expiringItems: Product[] = [];

      // 1. Load scanned products from AsyncStorage
      const savedProducts = await AsyncStorage.getItem("@scanned_products");
      if (savedProducts) {
        const parsedProducts = JSON.parse(savedProducts);
        parsedProducts.forEach((product: any) => {
          if (product.expiryDate) {
            const daysUntilExpiry = getDaysUntilExpiry(product.expiryDate);
            if (
              daysUntilExpiry !== null &&
              daysUntilExpiry <= 10 &&
              daysUntilExpiry >= -1
            ) {
              expiringItems.push({
                ...product,
                daysUntilExpiry,
              });
            }
          }
        });
      }

      // 2. Load purchased products from Firestore
      if (uid) {
        // Get all purchases
        const purchasesRef = collection(db, "users", uid, "purchase");
        const purchasesSnapshot = await getDocs(purchasesRef);

        // For each purchase, get its products
        for (const purchaseDoc of purchasesSnapshot.docs) {
          const purchaseId = purchaseDoc.id;
          const productsRef = collection(
            db,
            "users",
            uid,
            "purchase",
            purchaseId,
            "products"
          );
          const productsSnapshot = await getDocs(productsRef);

          productsSnapshot.docs.forEach((productDoc) => {
            const productData = productDoc.data();
            if (productData.expiryDate) {
              const daysUntilExpiry = getDaysUntilExpiry(
                productData.expiryDate
              );
              if (
                daysUntilExpiry !== null &&
                daysUntilExpiry <= 10 &&
                daysUntilExpiry >= -1
              ) {
                expiringItems.push({
                  id: productDoc.id,
                  name: productData.name || "Unknown Product",
                  brand: productData.brand || "",
                  imageUrl: productData.imageUrl || "",
                  expiryDate: productData.expiryDate,
                  daysUntilExpiry,
                  foods: JSON.parse(productData.data).foods,
                });
              }
            }
          });
        }
      }

      // Sort by days until expiry (ascending)
      expiringItems.sort((a, b) => {
        if (a.daysUntilExpiry === null) return 1;
        if (b.daysUntilExpiry === null) return -1;
        // @ts-ignore
        return a.daysUntilExpiry - b.daysUntilExpiry;
      });

      // Take only the first 3 items
      setExpiringProducts(expiringItems.slice(0, 3));
    } catch (error) {
      console.error("Error loading expiring products:", error);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  // Add this function to load shopping lists
  const loadShoppingLists = useCallback(async () => {
    try {
      const lists: ShoppingList[] = [];

      // First try to load from Firestore if user is logged in
      if (uid) {
        const listsRef = collection(db, "users", uid, "shopping_lists");
        const listsSnapshot = await getDocs(listsRef);

        if (!listsSnapshot.empty) {
          listsSnapshot.forEach((doc) => {
            const listData = doc.data();
            const nonPurchasedItems = (listData.items || []).filter(
              (item: any) => !item.purchased
            );

            lists.push({
              id: doc.id,
              name: listData.name || "Untitled List",
              createdAt: listData.createdAt || Date.now(),
              itemCount: nonPurchasedItems.length,
              description: `${nonPurchasedItems.length} ${
                nonPurchasedItems.length === 1 ? "item" : "items"
              } remaining`,
            });
          });

          // Sort by most recent lists first
          lists.sort((a, b) => b.createdAt - a.createdAt);

          // Take only the first 3 lists
          setShoppingLists(lists.slice(0, 3));
          return;
        }
      }

      // Fall back to AsyncStorage if Firestore has no data or user is not logged in
      const savedLists = await AsyncStorage.getItem("@shopping_lists");
      if (savedLists) {
        const parsedLists = JSON.parse(savedLists);

        parsedLists.forEach((list: any) => {
          const nonPurchasedItems = (list.items || []).filter(
            (item: any) => !item.purchased
          );

          lists.push({
            id: list.id,
            name: list.name || "Untitled List",
            createdAt: list.createdAt || Date.now(),
            itemCount: nonPurchasedItems.length,
            description: `${nonPurchasedItems.length} ${
              nonPurchasedItems.length === 1 ? "item" : "items"
            } remaining`,
          });
        });

        // Sort by most recent lists first
        lists.sort((a, b) => b.createdAt - a.createdAt);

        // Take only the first 3 lists
        setShoppingLists(lists.slice(0, 3));
        return;
      }

      // If no lists found, set default list
      if (lists.length === 0) {
        setShoppingLists([
          {
            id: "default",
            name: "Grocery List",
            createdAt: Date.now(),
            itemCount: 3,
            description: "3 items remaining",
          },
        ]);
      }
    } catch (error) {
      console.error("Error loading shopping lists:", error);
      // Set default list if there's an error
      setShoppingLists([
        {
          id: "default",
          name: "Grocery List",
          createdAt: Date.now(),
          itemCount: 3,
          description: "3 items remaining",
        },
      ]);
    }
  }, [uid]);

  useEffect(() => {
    loadExpiringProducts();
    loadShoppingLists(); // Load shopping lists
  }, [loadExpiringProducts, loadShoppingLists]);

  // Sample recipe suggestions data
  const recipeSuggestions = [
    {
      id: "1",
      name: "Pasta Primavera",
      brand: "Home Recipe",
      imageUrl:
        "https://images.unsplash.com/photo-1563379926898-05f4575a45d8?q=80&w=2070&auto=format&fit=crop",
      description: "Use your expiring vegetables",
    },
    {
      id: "2",
      name: "Fruit Smoothie",
      brand: "Quick Recipe",
      imageUrl:
        "https://images.unsplash.com/photo-1553530666-ba11a7da3888?q=80&w=2071&auto=format&fit=crop",
      description: "Perfect for expiring fruits",
    },
    {
      id: "3",
      name: "Chicken Stir Fry",
      brand: "Easy Dinner",
      imageUrl:
        "https://images.unsplash.com/photo-1603133872878-684f208fb84b?q=80&w=2025&auto=format&fit=crop",
      description: "Quick meal with your ingredients",
    },
  ];

  return (
    <SafeAreaViewBackground>
      <StatusBar hidden={false} />
      <ScrollView style={styles.container}>
        <TopHeader user={user} />
        <WhiteBackView
          heading="Expiring Soon"
          next="/(main)/expiringProducts"
          items={expiringProducts}
        />
        <WhiteBackView
          heading="Recipe Suggestions"
          next="next/page"
          items={recipeSuggestions}
        />
        <WhiteBackView
          heading="Shopping List"
          next="/(main)/shopping-lists"
          items={shoppingLists}
          marginBottom={20}
        />
      </ScrollView>
    </SafeAreaViewBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
    paddingHorizontal: 20,
  },
});

export default Home;
