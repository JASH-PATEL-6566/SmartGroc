export const foodAllergens = {
  commonAllergens: [
    "milk",
    "eggs",
    "peanuts",
    "tree nuts", // e.g., almonds, walnuts, cashews, pistachios
    "soy",
    "wheat",
    "fish",
    "shellfish", // e.g., shrimp, crab, lobster
  ],
  treeNuts: [
    "almonds",
    "walnuts",
    "cashews",
    "pecans",
    "hazelnuts",
    "pistachios",
    "macadamia nuts",
    "brazil nuts",
  ],
  shellfish: [
    "shrimp",
    "crab",
    "lobster",
    "scallops",
    "clams",
    "mussels",
    "oysters",
  ],
  fruits: [
    "apples",
    "peaches",
    "plums",
    "cherries",
    "kiwis",
    "bananas",
    "mangoes",
    "strawberries",
    "melons",
    "pineapple",
    "avocados",
    "grapes",
    "papaya",
  ],
  vegetables: [
    "celery",
    "carrots",
    "potatoes",
    "tomatoes",
    "peppers",
    "spinach",
    "parsley",
    "corn",
    "peas",
  ],
  grainsAndLegumes: [
    "wheat",
    "barley",
    "rye",
    "oats",
    "corn",
    "buckwheat",
    "lentils",
    "chickpeas",
    "soybeans",
    "peas",
    "quinoa",
  ],
  seeds: [
    "sesame",
    "mustard",
    "sunflower seeds",
    "poppy seeds",
    "chia seeds",
    "pumpkin seeds",
  ],
  spices: [
    "cinnamon",
    "coriander",
    "cumin",
    "mustard",
    "paprika",
    "garlic",
    "onion",
    "turmeric",
    "ginger",
    "black pepper",
  ],
  meats: ["beef", "pork", "chicken", "turkey", "lamb", "rabbit"],
  additives: [
    "sulfites",
    "monosodium glutamate (MSG)",
    "food coloring (e.g., Red 40, Yellow 5)",
    "benzoates",
    "nitrates",
  ],
  others: [
    "gelatin",
    "yeast",
    "chocolate",
    "vanilla",
    "coffee",
    "alcohol",
    "mushrooms",
    "latex (cross-reactive with banana, avocado, kiwi, etc.)",
  ],
};

// Helper function to get all allergens as a flat array
export const getAllAllergens = (): string[] => {
  return Object.values(foodAllergens).flat();
};

// Helper function to get allergen category
export const getAllergenCategory = (allergen: string): string => {
  for (const [category, allergens] of Object.entries(foodAllergens)) {
    if ((allergens as string[]).includes(allergen.toLowerCase())) {
      return category;
    }
  }
  return "other";
};

// Helper function to check if a product contains allergens
export const checkProductForAllergens = (
  ingredients: string,
  userAllergies: string[]
): string[] => {
  if (!ingredients || !userAllergies || userAllergies.length === 0) {
    return [];
  }

  const ingredientsLower = ingredients.toLowerCase();
  const foundAllergens: string[] = [];

  userAllergies.forEach((allergen) => {
    const allergenLower = allergen.toLowerCase();

    // Check if the allergen appears as a substring within the ingredients
    // This will catch variations like "milk chocolate" when searching for "chocolate"
    if (ingredientsLower.includes(allergenLower)) {
      foundAllergens.push(allergen);
    }
  });

  return foundAllergens;
};
