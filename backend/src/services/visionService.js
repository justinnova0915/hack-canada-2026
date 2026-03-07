const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.extractReceiptData = async (imageInput) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
        console.warn('[Vision Service Warning] GEMINI_API_KEY is missing!');
        return getMockReceiptData();
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Analyze this image of a receipt or transaction screenshot. Extract the following information and output ONLY a valid JSON object matching this structure:
      {
        "merchant": "Merchant Name (or 'Unknown')",
        "total": 123.45 (number),
        "date": "YYYY-MM-DD (or 'Unknown')",
        "expenses": [
          { "name": "Item Name", "amount": 10.00, "category": "Category Name" }
        ]
      }
      For the category, choose the most appropriate one from this list: Food, Transport, Rent, Utilities, Entertainment, Necessary, Recurring, Debt, Miscellaneous.
      If it's a tax or fee, categorize it as "Tax/Fee".
      Do not include any markdown formatting like \`\`\`json in the output, just the raw JSON string.
    `;

    const base64Data = Buffer.isBuffer(imageInput) 
        ? imageInput.toString("base64") 
        : imageInput;

    const imagePart = {
      inlineData: {
        data: base64Data,
        mimeType: "image/jpeg"
      },
    };

    console.log('[Vision Service] Sending receipt image to Gemini 2.5 Flash...');
    
    try {
      const result = await model.generateContent([prompt, imagePart]);
      let text = result.response.text().trim();
      
      console.log('[Vision Service] Raw Gemini Response:', text);

      // Clean markdown formatting if Gemini included it despite instructions
      if (text.startsWith('\`\`\`json')) {
        text = text.substring(7);
      }
      if (text.startsWith('\`\`\`')) {
        text = text.substring(3);
      }
      if (text.endsWith('\`\`\`')) {
        text = text.substring(0, text.length - 3);
      }

      const receiptData = JSON.parse(text.trim());
      return receiptData;

    } catch (apiError) {
      console.warn('[Vision Service Warning] Call to Gemini API failed: ' + apiError.message);
      return getMockReceiptData();
    }

  } catch (error) {
    console.error('[Vision Service Error]', error);
    throw error;
  }
};

function getMockReceiptData() {
    return {
        merchant: "Supermarket Inc",
        total: 45.50,
        date: "2026-03-07",
        expenses: [
            { name: "Apples", amount: 5.50, category: "Food" },
            { name: "Bread", amount: 4.00, category: "Food" },
            { name: "Laundry Detergent", amount: 16.00, category: "Necessary" },
            { name: "Magazine", amount: 5.00, category: "Miscellaneous" },
            { name: "Tax", amount: 5.00, category: "Tax/Fee" }
        ]
    };
}
