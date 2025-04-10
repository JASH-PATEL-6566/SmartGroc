// "use client";

// import { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   Image,
//   TouchableOpacity,
//   SafeAreaView,
// } from "react-native";
// import { useLocalSearchParams, useRouter } from "expo-router";
// import { COLOR_CONST } from "@/constants/color";
// import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";

// type Recipe = {
//   name: string;
//   brand: string;
//   description: string;
//   ingredients_required: string[];
//   instructions: string[];
//   time_to_make: string;
//   estimated_calories: number;
//   imageUrl: string;
//   user_has: string[];
//   user_missing: string[];
//   match_percent: number;
// };

// export default function RecipeDetailScreen() {
//   const router = useRouter();
//   const params = useLocalSearchParams();
//   const [recipe, setRecipe] = useState<Recipe | null>(null);

//   useEffect(() => {
//     if (params.recipe) {
//       try {
//         const parsedRecipe = JSON.parse(params.recipe as string);
//         setRecipe(parsedRecipe);
//       } catch (error) {
//         console.error("Error parsing recipe:", error);
//       }
//     }
//   }, [params.recipe]);

//   if (!recipe) {
//     return (
//       <SafeAreaView style={styles.container}>
//         <View style={styles.header}>
//           <TouchableOpacity
//             style={styles.backButton}
//             onPress={() => router.back()}
//           >
//             <Feather name="arrow-left" size={24} color="black" />
//           </TouchableOpacity>
//           <Text style={styles.title}>Recipe Details</Text>
//           <View style={{ width: 40 }} />
//         </View>
//         <View style={styles.loadingContainer}>
//           <Text style={styles.loadingText}>Recipe not found</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.container}>
//       <ScrollView>
//         <Image
//           source={require("../../assets/placeholder.jpg")}
//           style={styles.recipeImage}
//         />

//         <TouchableOpacity
//           style={styles.backButton}
//           onPress={() => router.back()}
//         >
//           <View style={styles.backButtonCircle}>
//             <Feather name="arrow-left" size={24} color="black" />
//           </View>
//         </TouchableOpacity>

//         <View style={styles.content}>
//           <Text style={styles.recipeName}>{recipe.name}</Text>
//           <Text style={styles.recipeBrand}>{recipe.brand}</Text>

//           <View style={styles.recipeStats}>
//             <View style={styles.statItem}>
//               <MaterialCommunityIcons
//                 name="clock-outline"
//                 size={20}
//                 color={COLOR_CONST.light_green}
//               />
//               <Text style={styles.statText}>{recipe.time_to_make}</Text>
//             </View>

//             <View style={styles.statItem}>
//               <MaterialCommunityIcons
//                 name="fire"
//                 size={20}
//                 color={COLOR_CONST.light_green}
//               />
//               <Text style={styles.statText}>
//                 {recipe.estimated_calories} cal
//               </Text>
//             </View>

//             <View style={styles.statItem}>
//               <MaterialCommunityIcons
//                 name="check-circle"
//                 size={20}
//                 color={COLOR_CONST.light_green}
//               />
//               <Text style={styles.statText}>{recipe.match_percent}% match</Text>
//             </View>
//           </View>

//           <Text style={styles.description}>{recipe.description}</Text>

//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Ingredients</Text>
//             {recipe.ingredients_required.map((ingredient, index) => (
//               <View key={index} style={styles.ingredientItem}>
//                 <View style={styles.bulletPoint} />
//                 <Text
//                   style={[
//                     styles.ingredientText,
//                     recipe.user_has.includes(ingredient.toLowerCase())
//                       ? styles.ingredientAvailable
//                       : styles.ingredientMissing,
//                   ]}
//                 >
//                   {ingredient}
//                   {recipe.user_has.includes(ingredient.toLowerCase()) && (
//                     <Text style={styles.ingredientNote}>
//                       {" "}
//                       (in your inventory)
//                     </Text>
//                   )}
//                 </Text>
//               </View>
//             ))}
//           </View>

//           <View style={styles.section}>
//             <Text style={styles.sectionTitle}>Instructions</Text>
//             {recipe.instructions.map((step, index) => (
//               <View key={index} style={styles.instructionItem}>
//                 <Text style={styles.instructionText}>{step}</Text>
//               </View>
//             ))}
//           </View>
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#fff",
//   },
//   header: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "space-between",
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   loadingText: {
//     fontSize: 16,
//     color: "#666",
//   },
//   recipeImage: {
//     width: "100%",
//     height: 250,
//     resizeMode: "cover",
//   },
//   backButton: {
//     position: "absolute",
//     top: 40,
//     left: 16,
//     zIndex: 10,
//   },
//   backButtonCircle: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     backgroundColor: "rgba(255, 255, 255, 0.8)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   content: {
//     padding: 16,
//   },
//   title: {
//     fontSize: 20,
//     fontWeight: "bold",
//     textAlign: "center",
//     flex: 1,
//   },
//   recipeName: {
//     fontSize: 24,
//     fontWeight: "bold",
//     marginBottom: 4,
//   },
//   recipeBrand: {
//     fontSize: 16,
//     color: "#666",
//     marginBottom: 16,
//   },
//   recipeStats: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     marginBottom: 20,
//     backgroundColor: "#f5f5f5",
//     padding: 12,
//     borderRadius: 8,
//   },
//   statItem: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   statText: {
//     marginLeft: 4,
//     fontSize: 14,
//     fontWeight: "500",
//   },
//   description: {
//     fontSize: 16,
//     lineHeight: 24,
//     color: "#444",
//     marginBottom: 20,
//   },
//   section: {
//     marginBottom: 24,
//   },
//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: "bold",
//     marginBottom: 12,
//     color: COLOR_CONST.light_green,
//   },
//   ingredientItem: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 8,
//   },
//   bulletPoint: {
//     width: 6,
//     height: 6,
//     borderRadius: 3,
//     backgroundColor: COLOR_CONST.light_green,
//     marginRight: 8,
//   },
//   ingredientText: {
//     fontSize: 16,
//     flex: 1,
//   },
//   ingredientAvailable: {
//     color: "#444",
//   },
//   ingredientMissing: {
//     color: "#888",
//   },
//   ingredientNote: {
//     fontSize: 14,
//     fontStyle: "italic",
//     color: COLOR_CONST.light_green,
//   },
//   instructionItem: {
//     marginBottom: 12,
//     paddingBottom: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: "#eee",
//   },
//   instructionText: {
//     fontSize: 16,
//     lineHeight: 24,
//     color: "#444",
//   },
// });
"use client";

import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { COLOR_CONST } from "@/constants/color";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  const [recipeSuggestionsEnabled, setRecipeSuggestionsEnabled] =
    useState(false);

  useEffect(() => {
    const checkRecipeSuggestions = async () => {
      try {
        const userPrefs = await AsyncStorage.getItem("@user_preferences");
        if (userPrefs) {
          const prefs = JSON.parse(userPrefs);
          setRecipeSuggestionsEnabled(prefs.recipeSuggestions || false);

          // If recipe suggestions are disabled, go back to home
          if (!prefs.recipeSuggestions) {
            Alert.alert(
              "Feature Disabled",
              "Recipe suggestions are currently disabled. Please enable them in your profile settings.",
              [{ text: "OK", onPress: () => router.back() }]
            );
          } else {
            // Parse recipe from params
            if (params.recipe) {
              try {
                const parsedRecipe = JSON.parse(params.recipe as string);
                setRecipe(parsedRecipe);
              } catch (error) {
                console.error("Error parsing recipe:", error);
                Alert.alert("Error", "Failed to load recipe details");
                router.back();
              }
            } else {
              Alert.alert("Error", "No recipe data provided");
              router.back();
            }
          }
        } else {
          // Default to disabled if no preferences found
          setRecipeSuggestionsEnabled(false);
          Alert.alert(
            "Feature Disabled",
            "Recipe suggestions are currently disabled. Please enable them in your profile settings.",
            [{ text: "OK", onPress: () => router.back() }]
          );
        }
      } catch (error) {
        console.error("Failed to load user preferences", error);
        // Parse recipe from params anyway if there's an error
        if (params.recipe) {
          try {
            const parsedRecipe = JSON.parse(params.recipe as string);
            setRecipe(parsedRecipe);
          } catch (error) {
            console.error("Error parsing recipe:", error);
            Alert.alert("Error", "Failed to load recipe details");
            router.back();
          }
        } else {
          Alert.alert("Error", "No recipe data provided");
          router.back();
        }
      }
    };

    checkRecipeSuggestions();
  }, [params.recipe, router]);

  if (!recipeSuggestionsEnabled) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recipe Details</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.disabledContainer}>
          <MaterialCommunityIcons name="food-off" size={64} color="#888" />
          <Text style={styles.disabledText}>Recipe Suggestions Disabled</Text>
          <Text style={styles.disabledSubtext}>
            Please enable recipe suggestions in your profile settings to access
            this feature.
          </Text>
          <TouchableOpacity
            style={styles.enableButton}
            onPress={() => router.push("/(main)/(tabs)/profile")}
          >
            <Text style={styles.enableButtonText}>Go to Settings</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle}>Recipe Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text>Loading recipe details...</Text>
        </View>
      </SafeAreaView>
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
        <Text style={styles.headerTitle}>Recipe Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <Image
          source={require("../../assets/placeholder.jpg")}
          style={styles.recipeImage}
        />

        <View style={styles.recipeContent}>
          <Text style={styles.recipeName}>{recipe.name}</Text>
          <Text style={styles.recipeBrand}>{recipe.brand}</Text>

          <View style={styles.recipeStats}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons
                name="clock-outline"
                size={20}
                color="#666"
              />
              <Text style={styles.statText}>{recipe.time_to_make}</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="fire" size={20} color="#666" />
              <Text style={styles.statText}>
                {recipe.estimated_calories} cal
              </Text>
            </View>
            <View style={styles.matchContainer}>
              <Text style={styles.matchText}>
                {recipe.match_percent}% match
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{recipe.description}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <View style={styles.ingredientsContainer}>
              {recipe.ingredients_required.map((ingredient, index) => {
                console.log(ingredient);
                console.log(recipe.user_has.includes(ingredient));
                console.log(recipe.user_has);

                return (
                  <View key={index} style={styles.ingredientItem}>
                    <MaterialCommunityIcons
                      name={
                        recipe.user_has.includes(ingredient)
                          ? "checkbox-marked-circle-outline"
                          : "close-circle-outline"
                      }
                      size={20}
                      color={
                        recipe.user_has.includes(ingredient)
                          ? COLOR_CONST.light_green
                          : "#FF3B30"
                      }
                    />
                    <Text
                      style={[
                        styles.ingredientText,
                        {
                          color: recipe.user_has.includes(ingredient)
                            ? "#333"
                            : "#FF3B30",
                        },
                      ]}
                    >
                      {ingredient}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {recipe.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <View style={styles.instructionNumber}>
                  <Text style={styles.instructionNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </View>

          {recipe.user_missing.length > 0 && (
            <View style={styles.missingIngredientsContainer}>
              <Text style={styles.missingIngredientsTitle}>
                Missing Ingredients
              </Text>
              <Text style={styles.missingIngredientsText}>
                You're missing {recipe.user_missing.length} ingredient
                {recipe.user_missing.length > 1 ? "s" : ""} for this recipe:
              </Text>
              <Text style={styles.missingIngredientsList}>
                {recipe.user_missing.join(", ")}
              </Text>
            </View>
          )}
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
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  recipeImage: {
    width: "100%",
    height: 250,
    resizeMode: "cover",
  },
  recipeContent: {
    padding: 16,
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
    alignItems: "center",
    marginBottom: 24,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  statText: {
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#444",
  },
  ingredientsContainer: {
    marginTop: 8,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ingredientText: {
    fontSize: 16,
    marginLeft: 8,
  },
  instructionItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLOR_CONST.light_green,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  instructionNumberText: {
    color: "white",
    fontWeight: "bold",
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: "#444",
  },
  missingIngredientsContainer: {
    backgroundColor: "#FFF3F3",
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  missingIngredientsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF3B30",
    marginBottom: 8,
  },
  missingIngredientsText: {
    fontSize: 16,
    color: "#444",
    marginBottom: 8,
  },
  missingIngredientsList: {
    fontSize: 16,
    color: "#FF3B30",
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    color: "#666",
    textAlign: "center",
    marginTop: 16,
  },
  disabledSubtext: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  enableButton: {
    backgroundColor: COLOR_CONST.light_green,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  enableButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
});
