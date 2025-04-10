"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  RefreshControl,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLOR_CONST } from "@/constants/color";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import SafeAreaViewBackground from "@/components/SafeAreaViewBackground";

// Replace the dynamic import with a regular import at the top of the file
import { fetchRecipes as fetchRecipesFromService } from "@/utils/recipeService";
import type { RootState } from "@/redux/store";
import { useSelector } from "react-redux";

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

const RECIPES_STORAGE_KEY = "@cached_recipes";

export default function RecipesScreen() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recipeSuggestionsEnabled, setRecipeSuggestionsEnabled] =
    useState(false);
  const { uid } = useSelector((state: RootState) => state.auth.user);

  // Check if recipe suggestions are enabled
  useEffect(() => {
    const checkRecipeSuggestions = async () => {
      try {
        const userPrefs = await AsyncStorage.getItem("@user_preferences");
        if (userPrefs) {
          const prefs = JSON.parse(userPrefs);
          const enabled = prefs.recipeSuggestions || false;
          setRecipeSuggestionsEnabled(enabled);

          if (!enabled) {
            Alert.alert(
              "Recipe Suggestions Disabled",
              "Recipe suggestions are currently disabled. You can enable them in your profile settings.",
              [
                {
                  text: "Go to Settings",
                  onPress: () => router.push("/(main)/(tabs)/profile"),
                },
              ],
              { cancelable: false }
            );
          } else {
            // Only load cached recipes initially, not from API
            loadCachedRecipes();
          }
        }
      } catch (error) {
        console.error("Failed to load user preferences", error);
        loadCachedRecipes();
      }
    };

    checkRecipeSuggestions();
  }, [router]);

  // Load recipes from AsyncStorage
  const loadCachedRecipes = async () => {
    try {
      setLoading(true);
      const cachedRecipes = await AsyncStorage.getItem(RECIPES_STORAGE_KEY);

      if (cachedRecipes) {
        const parsedRecipes = JSON.parse(cachedRecipes);
        setRecipes(parsedRecipes);
        console.log("Loaded recipes from cache:", parsedRecipes.length);
      } else {
        // If no cached recipes, set empty array
        setRecipes([]);
        console.log("No cached recipes found");
      }
    } catch (error) {
      console.error("Error loading cached recipes:", error);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  // Save recipes to AsyncStorage
  const cacheRecipes = async (recipesToCache: Recipe[]) => {
    try {
      await AsyncStorage.setItem(
        RECIPES_STORAGE_KEY,
        JSON.stringify(recipesToCache)
      );
      console.log("Cached", recipesToCache.length, "recipes");
    } catch (error) {
      console.error("Error caching recipes:", error);
    }
  };

  // Fetch fresh recipes from API
  const fetchFreshRecipes = async () => {
    try {
      setRefreshing(true);
      console.log("Fetching fresh recipes from API...");

      // Handle the case where uid might be null
      const data = await fetchRecipesFromService(uid || "");

      // Update state with the recipes
      if (data && data.recipes) {
        const newRecipes = data.recipes || [];
        setRecipes(newRecipes);

        // Cache the new recipes
        await cacheRecipes(newRecipes);

        console.log(
          "Successfully fetched and cached",
          newRecipes.length,
          "recipes"
        );
      } else {
        // Ensure recipes is set to an empty array if no data is returned
        setRecipes([]);
        console.log("No recipes returned from API");
      }

      return data;
    } catch (error) {
      console.error("Error fetching fresh recipes:", error);
      // Set recipes to empty array when there's an error
      Alert.alert("Error", "Failed to fetch recipes");
      return null;
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await fetchFreshRecipes();
  };

  const handleRecipePress = (recipe: Recipe) => {
    router.push({
      pathname: "/(main)/recipeDetail",
      params: { recipe: JSON.stringify(recipe) },
    });
  };

  const renderRecipeItem = ({ item }: { item: Recipe }) => (
    <TouchableOpacity
      style={styles.recipeItem}
      onPress={() => handleRecipePress(item)}
    >
      <Image
        source={require("../../assets/placeholder.jpg")}
        style={styles.recipeImage}
      />
      <View style={styles.recipeContent}>
        <Text style={styles.recipeName}>{item.name}</Text>
        <Text style={styles.recipeBrand}>{item.brand}</Text>
        <Text style={styles.recipeDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.recipeDetails}>
          <View style={styles.recipeDetailItem}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={16}
              color="#666"
            />
            <Text style={styles.recipeDetailText}>{item.time_to_make}</Text>
          </View>

          <View style={styles.recipeDetailItem}>
            <MaterialCommunityIcons name="fire" size={16} color="#666" />
            <Text style={styles.recipeDetailText}>
              {item.estimated_calories} cal
            </Text>
          </View>

          <View style={styles.matchContainer}>
            <Text style={styles.matchText}>{item.match_percent}% match</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // If recipe suggestions are disabled, show disabled message
  if (!recipeSuggestionsEnabled) {
    return (
      <SafeAreaViewBackground>
        <View style={styles.disabledContainer}>
          <MaterialCommunityIcons name="food-off" size={80} color="#ccc" />
          <Text style={styles.disabledText}>
            Recipe suggestions are disabled
          </Text>
          <Text style={styles.disabledSubtext}>
            You can enable them in your profile settings
          </Text>
          <TouchableOpacity
            style={styles.enableButton}
            onPress={() => router.push("/(main)/(tabs)/profile")}
          >
            <Text style={styles.enableButtonText}>Go to Settings</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaViewBackground>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Recipe Suggestions</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
          <Feather
            name="refresh-cw"
            size={20}
            color={COLOR_CONST.light_green}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <LottieView
            source={require("../../assets/cooking.json")}
            autoPlay
            loop
            style={styles.lottie}
          />
          <Text style={styles.loadingText}>Loading recipes...</Text>
        </View>
      ) : refreshing ? (
        <View style={styles.loadingContainer}>
          <LottieView
            source={require("../../assets/cooking.json")}
            autoPlay
            loop
            style={styles.lottie}
          />
          <Text style={styles.loadingText}>SmartGroc is thinking...</Text>
        </View>
      ) : recipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="food-off" size={64} color="#888" />
          <Text style={styles.emptyText}>No recipes available</Text>
          <Text style={styles.emptySubtext}>
            Tap refresh to generate recipe suggestions
          </Text>
          <TouchableOpacity
            style={styles.refreshButtonLarge}
            onPress={handleRefresh}
          >
            <Text style={styles.refreshButtonText}>Generate Recipes</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={recipes}
          renderItem={renderRecipeItem}
          keyExtractor={(item, index) => `${item.name}-${index}`}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLOR_CONST.light_green]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  lottie: {
    width: 150, // Adjust size as needed
    height: 150,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  refreshButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
  },
  refreshButtonLarge: {
    backgroundColor: COLOR_CONST.light_green,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  listContent: {
    padding: 16,
  },
  recipeItem: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recipeImage: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
  },
  recipeContent: {
    padding: 16,
  },
  recipeName: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  recipeBrand: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  recipeDescription: {
    fontSize: 14,
    color: "#444",
    marginBottom: 12,
    lineHeight: 20,
  },
  recipeDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  recipeDetailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  recipeDetailText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 4,
  },
  matchContainer: {
    backgroundColor: COLOR_CONST.light_green,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  matchText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  disabledContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  disabledText: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 20,
    textAlign: "center",
  },
  disabledSubtext: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
    textAlign: "center",
  },
  enableButton: {
    marginTop: 30,
    backgroundColor: COLOR_CONST.light_green,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  enableButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
