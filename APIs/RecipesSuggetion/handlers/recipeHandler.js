const { getRecipesFromOpenAI } = require("../services/openaiService");
const { filterValidRecipes } = require("../utils/recipeUtils");

module.exports.handler = async (event) => {
  try {
    const body =
      typeof event.body === "string" ? JSON.parse(event.body) : event.body;

    // Extract products from the body, default to empty array if not found
    const userProducts = body.products || [];

    const availableIngredients = userProducts.map(
      (item) => item?.nf_ingredient_statement || item?.name
    );

    const recipes = await getRecipesFromOpenAI(availableIngredients);

    const validRecipes = filterValidRecipes(recipes);

    return {
      statusCode: 200,
      body: JSON.stringify({
        count: validRecipes.length,
        recipes: validRecipes,
      }),
    };
  } catch (err) {
    console.error("Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal server error",
        details: err.message,
      }),
    };
  }
};
