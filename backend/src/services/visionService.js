const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.detectAndCleanIngredients = async (imageInput) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
        console.warn('[Vision Service Warning] GEMINI_API_KEY is completely missing in .env!');
        console.log('[Vision Service] Falling back to mock ingredient data for the hackathon demo.');
        return ["egg", "spinach", "tomato", "milk"];
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = "Analyze this image of a fridge or groceries. List exactly the food ingredients you see in a comma-separated format. Do not include generic categories like 'food', 'vegetable', or 'container'. Only list the specific, raw food items. Example output: milk, egg, tomato, spinach.";

    const base64Data = Buffer.isBuffer(imageInput) 
        ? imageInput.toString("base64") 
        : imageInput;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: "image/jpeg"
      },
    };

    console.log('[Vision Service] Sending image to Gemini 2.5 Flash...');
    
    try {
      const result = await model.generateContent([prompt, imagePart]);
      const text = result.response.text();
      
      console.log('[Vision Service] Gemini raw text response:', text);

      const ingredients = text.split(',')
                              .map(item => item.trim().toLowerCase().replace(/[^a-z -]/g, ''))
                              .filter(item => item.length > 0);

      const uniqueIngredients = [...new Set(ingredients)];

      if (uniqueIngredients.length === 0) {
        console.warn('[Vision Service] Gemini found nothing. Falling back.');
        return ["egg", "spinach", "tomato", "milk"];
      }

      return uniqueIngredients;

    } catch (apiError) {
      console.warn('[Vision Service Warning] Call to Gemini API failed: ' + apiError.message);
      console.log('[Vision Service] Using mock ingredient data for the hackathon demo.');
      return ["egg", "spinach", "tomato", "milk"];
    }

  } catch (error) {
    console.error('[Vision Service Error]', error);
    throw error;
  }
};
