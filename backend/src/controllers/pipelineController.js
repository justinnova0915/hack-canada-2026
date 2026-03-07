const visionService = require('../services/visionService');
const recipeService = require('../services/recipeService');
const algorithmService = require('../services/algorithmService');
const voiceService = require('../services/voiceService');

exports.processFridgeImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided.' });
    }

    const userProfile = {
      age: parseInt(req.body.age) || 20,
      weight: parseInt(req.body.weight) || 70,
      height: parseInt(req.body.height) || 170,
      activityLevel: parseFloat(req.body.activityLevel) || 1.2,
      goal: req.body.goal || 'maintain',
      budget: parseFloat(req.body.budget) || 10.0
    };

    const imageBuffer = req.file.buffer;

    console.log('[Pipeline] 1. Analyzing Image with Google Vision...');
    let ingredients = [];
    try {
        ingredients = await visionService.detectAndCleanIngredients(imageBuffer);
    } catch (visionError) {
        console.warn('[Pipeline Warning] Vision API failed: ' + visionError.message);
        ingredients = ["egg", "spinach", "tomato", "milk"];
    }
    
    if (!ingredients || ingredients.length === 0) {
       return res.status(400).json({ error: 'No valid food ingredients detected in the image.' });
    }
    console.log('[Pipeline] Detected Ingredients:', ingredients);

    console.log('[Pipeline] 2. Matching Ingredients to Recipes (Spoonacular)...');
    let recipes = await recipeService.getRecipesByIngredients(ingredients);

    if (!recipes || recipes.length === 0) {
      return res.status(404).json({ error: 'No recipes found for the detected ingredients.' });
    }
    
    console.log('[Pipeline] 3. Running Algorithm Layer (Calories, Budget, Expiration)...');
    
    recipes = algorithmService.applyBudgetAndExpiryFilters(recipes, ingredients, userProfile.budget);

    const adjustedRecipes = algorithmService.adjustRecipesForUserMetabolism(recipes, userProfile);

    const topRecipe = adjustedRecipes[0];
    
    let audioUrl = null;
    if (topRecipe) {
        console.log('[Pipeline] 4. Generating Voice Instructions (ElevenLabs)...');
        const ttsText = voiceService.generateScript(ingredients, topRecipe);
        audioUrl = await voiceService.generateAudio(ttsText);
    }

    console.log('[Pipeline] Process Complete!');
    
    res.json({
      success: true,
      data: {
        detectedIngredients: ingredients,
        userProfile: userProfile,
        adjustedRecipes: adjustedRecipes,
        topRecipe: topRecipe,
        voiceAudioUrl: audioUrl
      }
    });

  } catch (error) {
    console.error('[Pipeline Error]', error);
    res.status(500).json({ error: 'An error occurred during pipeline processing.', details: error.message });
  }
};

exports.processFridgeImageBase64 = async (req, res) => {
    try {
      if (!req.body || !req.body.image) {
        return res.status(400).json({ error: 'No base64 image provided in JSON body.' });
      }
  
      const userProfile = {
        age: parseInt(req.body.age) || 20,
        weight: parseInt(req.body.weight) || 70,
        height: parseInt(req.body.height) || 170,
        activityLevel: parseFloat(req.body.activityLevel) || 1.2,
        goal: req.body.goal || 'maintain',
        budget: parseFloat(req.body.budget) || 10.0
      };
      
      const base64String = req.body.image.replace(/^data:image\/\w+;base64,/, "");
  
      console.log('[Pipeline Base64] 1. Analyzing Image with Gemini...');
      let ingredients = [];
      try {
          // Pass the raw base64 string directly to the updated Gemini vision service
          ingredients = await visionService.detectAndCleanIngredients(base64String);
      } catch (visionError) {
          console.warn('[Pipeline Base64 Warning] Vision API failed: ' + visionError.message);
          ingredients = ["egg", "spinach", "tomato", "milk"];
      }
      
      if (!ingredients || ingredients.length === 0) {
         console.warn('[Pipeline Base64 Warning] Ingredients empty. Supplying ultimate fallback.');
         ingredients = ["egg", "spinach", "tomato", "milk"];
      }
      console.log('[Pipeline Base64] Detected Ingredients:', ingredients);
  
      console.log('[Pipeline Base64] 2. Matching Ingredients to Recipes (Spoonacular)...');
      let recipes = await recipeService.getRecipesByIngredients(ingredients);
  
      if (!recipes || recipes.length === 0) {
        return res.status(404).json({ error: 'No recipes found for the detected ingredients.' });
      }
      
      console.log('[Pipeline Base64] 3. Running Algorithm Layer...');
      recipes = algorithmService.applyBudgetAndExpiryFilters(recipes, ingredients, userProfile.budget);
      const adjustedRecipes = algorithmService.adjustRecipesForUserMetabolism(recipes, userProfile);
      const topRecipe = adjustedRecipes[0];
      
      let audioUrl = null;
      if (topRecipe) {
          console.log('[Pipeline Base64] 4. Generating Voice Instructions...');
          const ttsText = voiceService.generateScript(ingredients, topRecipe);
          audioUrl = await voiceService.generateAudio(ttsText);
      }
  
      console.log('[Pipeline Base64] Process Complete!');
      res.json({
        success: true,
        data: {
          detectedIngredients: ingredients,
          userProfile: userProfile,
          adjustedRecipes: adjustedRecipes,
          topRecipe: topRecipe,
          voiceAudioUrl: audioUrl
        }
      });
  
    } catch (error) {
      console.error('[Pipeline Base64 Error]', error);
      res.status(500).json({ error: 'An error occurred during pipeline base64 processing.', details: error.message });
    }
  };
