const axios = require('axios');

exports.getRecipesByIngredients = async (ingredients) => {
  try {
    const ingredientsString = ingredients.join(',');
    
    if (!process.env.SPOONACULAR_API_KEY) {
        console.warn('[Recipe Service Warning] No Spoonacular API Key. Using Mock Data.');
        return [
           { id: 1, title: 'Spinach Omelette', cost: 2.00, calories: 350 },
           { id: 2, title: 'Tomato Soup', cost: 1.50, calories: 200 }
        ];
    }
    
    // We add ranking=2 to minimize missing ingredients and ignorePantry=true so it doesn't assume staples.
    const response = await axios.get(`https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredientsString}&number=2&ranking=2&ignorePantry=true&apiKey=${process.env.SPOONACULAR_API_KEY}`);
    
    const recipes = response.data.map(r => ({
        id: r.id,
        title: r.title,
        image: r.image,
        cost: Math.floor(Math.random() * 5) + 1, // hackathon mock cost
        calories: Math.floor(Math.random() * 400) + 100 // hackathon mock cals
    }));
    return recipes;

  } catch (error) {
    console.warn('[Recipe Service Error] external API failed, using mock data.', error.message);
    return [
           { id: 1, title: 'Spinach Omelette', cost: 2.00, calories: 350 },
           { id: 2, title: 'Tomato Soup', cost: 1.50, calories: 200 }
    ];
  }
};
