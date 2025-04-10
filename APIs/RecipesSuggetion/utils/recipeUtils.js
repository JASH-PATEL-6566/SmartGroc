exports.filterValidRecipes = (recipes) => {
  const validRecipes = [];

  for (let recipe of recipes) {
    // Create the updated ingredients array with just the ingredient names
    const updatedIngredients = recipe.ingredients_required.map((ingredient) => {
      return ingredient.name;
    });

    const user_has =
      recipe.ingredients_required
        .filter((ingredient) => ingredient.isPresent)
        .map((ing) => ing.name) ?? [];
    const user_missing =
      recipe.ingredients_required
        .filter((ingredient) => !ingredient.isPresent)
        .map((ing) => ing.name) ?? [];

    // Push the valid recipe to the list
    validRecipes.push({
      name: recipe.name,
      brand: recipe.brand,
      description: recipe.description,
      ingredients_required: updatedIngredients,
      instructions: recipe.instructions,
      time_to_make: recipe.time_to_make,
      estimated_calories: recipe.estimated_calories,
      imageUrl: recipe.imageUrl,
      match_percent: Math.round(recipe.match_percent),
      user_has,
      user_missing,
    });
  }

  return validRecipes;
};
