"use client";

import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { COLOR_CONST } from "@/constants/color";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";

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

export default function RecipeDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);

  useEffect(() => {
    if (params.recipe) {
      try {
        const parsedRecipe = JSON.parse(params.recipe as string);
        setRecipe(parsedRecipe);
      } catch (error) {
        console.error("Error parsing recipe:", error);
      }
    }
  }, [params.recipe]);

  if (!recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.title}>Recipe Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Recipe not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Image
          source={require("../../assets/placeholder.jpg")}
          style={styles.recipeImage}
        />

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <View style={styles.backButtonCircle}>
            <Feather name="arrow-left" size={24} color="black" />
          </View>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.recipeName}>{recipe.name}</Text>
          <Text style={styles.recipeBrand}>{recipe.brand}</Text>

          <View style={styles.recipeStats}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={20}
                color={COLOR_CONST.light_green}
              />
              <Text style={styles.statText}>{recipe.time_to_make}</Text>
            </View>

            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="fire"
                size={20}
                color={COLOR_CONST.light_green}
              />
              <Text style={styles.statText}>
                {recipe.estimated_calories} cal
              </Text>
            </View>

            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color={COLOR_CONST.light_green}
              />
              <Text style={styles.statText}>{recipe.match_percent}% match</Text>
            </View>
          </View>

          <Text style={styles.description}>{recipe.description}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {recipe.ingredients_required.map((ingredient, index) => (
              <View key={index} style={styles.ingredientItem}>
                <View style={styles.bulletPoint} />
                <Text
                  style={[
                    styles.ingredientText,
                    recipe.user_has.includes(ingredient.toLowerCase())
                      ? styles.ingredientAvailable
                      : styles.ingredientMissing,
                  ]}
                >
                  {ingredient}
                  {recipe.user_has.includes(ingredient.toLowerCase()) && (
                    <Text style={styles.ingredientNote}>
                      {" "}
                      (in your inventory)
                    </Text>
                  )}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {recipe.instructions.map((step, index) => (
              <View key={index} style={styles.instructionItem}>
                <Text style={styles.instructionText}>{step}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  recipeImage: {
    width: "100%",
    height: 250,
    resizeMode: "cover",
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 16,
    zIndex: 10,
  },
  backButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    flex: 1,
  },
  recipeName: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  recipeBrand: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  recipeStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  statText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "500",
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#444",
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    color: COLOR_CONST.light_green,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLOR_CONST.light_green,
    marginRight: 8,
  },
  ingredientText: {
    fontSize: 16,
    flex: 1,
  },
  ingredientAvailable: {
    color: "#444",
  },
  ingredientMissing: {
    color: "#888",
  },
  ingredientNote: {
    fontSize: 14,
    fontStyle: "italic",
    color: COLOR_CONST.light_green,
  },
  instructionItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  instructionText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#444",
  },
});
