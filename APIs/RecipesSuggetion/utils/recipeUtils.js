exports.filterValidRecipes = (recipes, availableIngredients) => {
  const productSet = new Set(availableIngredients.map((i) => i.toLowerCase()));
  const validRecipes = [];

  for (let recipe of recipes) {
    const required = recipe.ingredients_required.map((i) => i.toLowerCase());
    const matched = required.filter((i) => productSet.has(i));
    const matchPercent = (matched.length / required.length) * 100;

    // if (matchPercent >= 80) {
    validRecipes.push({
      ...recipe,
      user_has: matched,
      user_missing: required.filter((i) => !productSet.has(i)),
      match_percent: Math.round(matchPercent),
    });
    // }
  }

  return validRecipes;
};
