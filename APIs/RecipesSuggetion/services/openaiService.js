const { OpenAI } = require("openai");
require("dotenv").config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.getRecipesFromOpenAI = async (ingredients) => {

  // Directly use the ingredient names (as the array contains strings)
  const ingredientList = ingredients.join(", ");

  if (!ingredientList) {
    console.error("No valid ingredients provided.");
    return [];
  }

  const prompt = `
I have the following food items: ${ingredientList}.
Also assume I have all common vegetables, spices, oil, salt, etc.

Based on this, suggest multiple recipes. For each recipe, return a JSON object with:
- name (e.g., "Cheesy Pizza", "Tomato Pasta", "Spicy Chickpea Snack", etc.)
- brand (e.g., "Quick Recipe", "Home Recipe", "Easy Dinner", etc.)
- description (a short summary about the dish, its flavor, and when it can be enjoyed)
- ingredients_required (list of objects, each with "name" and "isPresent" (true/false based on whether the ingredient is present in the input list))
- instructions (list of strings)(detailed, step-by-step instructions for each stage of preparation and cooking)
- time_to_make (e.g., "20 minutes")
- estimated_calories (number)
- imageUrl (direct link to an image of the final dish make sure it is working)
- match_percent (percentage of the ingredients user has compared to the ingredients required for the recipe)

Please ensure the recipes are based on the ingredients provided and can be easily made. Respond strictly in JSON array format as shown in the example below:
[
  {
    "name": "Lemon Garlic Chicken Stir-Fry",
    "brand": "Quick Recipe",
    "description": "A zesty, protein-rich stir-fry perfect for weeknight dinners.",
    "ingredients_required": [
      {
        "name": "Chicken Breast",
        "isPresent": true
      },
      {
        "name": "Broccoli",
        "isPresent": false
      },
      {
        "name": "Olive Oil",
        "isPresent": true
      }
    ],
    "instructions": [
      "Step 1: Marinate chicken in lemon juice, minced garlic, and a tablespoon of olive oil for 10 minutes.",
      "Step 2: Heat a pan over medium heat and add the marinated chicken. Cook for 5-6 minutes until browned.",
      "Step 3: Add chopped broccoli and sauté for another 5-7 minutes. Stir occasionally.",
      "Step 4: Adjust seasoning with salt, pepper, and a squeeze of fresh lemon.",
      "Step 5: Serve hot with optional rice or noodles."
    ],
    "time_to_make": "30 minutes",
    "estimated_calories": 350,
    "imageUrl": "https://example.com/image.jpg",
    "match_percent": 67
  },
  ...
]
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4", // Use gpt-4 for better quality responses
      messages: [
        {
          role: "system",
          content:
            "You are a helpful recipe generator AI, providing meal ideas based on the ingredients provided.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const message = completion.choices[0].message.content;

    // Clean up the response: remove any unexpected characters (like markdown backticks)
    const cleanMessage = message.replace(/```json|```/g, "").trim();

    // Attempt to parse the cleaned message as JSON
    let recipes = [];
    try {
      recipes = JSON.parse(cleanMessage);
    } catch (jsonError) {
      console.error("Failed to parse response as JSON", jsonError);
      throw new Error("Invalid JSON response from OpenAI");
    }

    // If recipes array is empty, log an error
    if (recipes.length === 0) {
      console.error("No valid recipes returned from OpenAI.");
      return [];
    }

    return recipes;
  } catch (error) {
    console.error("Error generating recipes from OpenAI:", error);
    throw new Error("Failed to generate recipes");
  }
};
