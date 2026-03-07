exports.applyBudgetAndExpiryFilters = (recipes, ingredients, budget) => {
    // Hackathon simple filter: only return recipes that fit the user's budget cost per meal
    const validRecipes = recipes.filter(r => r.cost <= budget);
    return validRecipes.length > 0 ? validRecipes : recipes; // fallback if all too expensive
};

exports.adjustRecipesForUserMetabolism = (recipes, userProfile) => {
    const { age, weight, height, activityLevel, goal } = userProfile;
    
    // Simple BMR (Mifflin-St Jeor) - rough approx for demo
    // Men: 10 * weight(kg) + 6.25 * height(cm) - 5 * age(y) + 5
    // Women (we'll just use a generic average baseline for hackathon if gender unknown)
    const bmr = (10 * weight) + (6.25 * height) - (5 * age); 
    const tdee = Math.round(bmr * activityLevel);
    
    const caloriesPerMeal = Math.round(tdee / 3);
    
    let targetCalories = caloriesPerMeal;
    if (goal === 'weight loss') targetCalories -= 300;
    if (goal === 'muscle gain') targetCalories += 300;

    return recipes.map(recipe => {
        // Calculate a portion scale to meet the user's metabolic goal
        const scale = (targetCalories / recipe.calories).toFixed(1);
        
        return {
            ...recipe,
            adjustedCalories: Math.round(recipe.calories * scale),
            message: `Adjusted recipe size by ${scale}x to meet your ${goal} target goal of ${targetCalories} calories per meal.`
        }
    });
};
