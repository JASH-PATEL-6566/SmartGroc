import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/config/firebaseConfig";

type Recipe = {
  name: string;
  brand: string;
  description: string;
  ingredients_required: string[];
  instructions: string[];
  time_to_make: string;
  estimated_calories: number;
  imageUrl: string;
  user_has: string[];
  user_missing: string[];
  match_percent: number;
};

type RecipeResponse = {
  count: number;
  recipes: Recipe[];
};

// Update the fetchRecipes function to remove all mock data code
export const fetchRecipes = async (uid: string) => {
  try {
    // Get all products with available_quantity > 0
    const products = await getAvailableProducts(uid);
    console.log({ products });

    // Make API request to your OpenAI-powered recipe API
    const response = await fetch(
      "https://5j7dayiyb9.execute-api.us-east-1.amazonaws.com/dev/recipes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ products }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch recipes");
    }

    const data: RecipeResponse = await response.json();
    console.log(data);

    return data;
  } catch (error) {
    console.error("Error fetching recipes:", error);

    // Return empty recipes array when there's an error
    return {
      count: 0,
      recipes: [],
    };
  }
};

// Get all available products from AsyncStorage and Firestore
export const getAvailableProducts = async (uid: string) => {
  try {
    const products: any = [];

    // 2. Get products from Firestore
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

          // Only include products with available_quantity > 0
          if (productData.available_quantity > 0) {
            products.push({
              name: productData.name,
              nf_ingredient_statement: productData.nf_ingredient_statement,
            });
          }
        });
      }
    }

    return products;
  } catch (error) {
    console.error("Error getting available products:", error);
    return [];
  }
};
