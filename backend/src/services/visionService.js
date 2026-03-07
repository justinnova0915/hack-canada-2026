const { GoogleGenerativeAI } = require("@google/generative-ai");
const NodeGeocoder = require('node-geocoder');

const geocoder = NodeGeocoder({
  provider: 'openstreetmap'
});

exports.extractReceiptData = async (imageInput) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
        console.warn('[Vision Service Warning] GEMINI_API_KEY is missing!');
        return getMockReceiptData();
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Analyze this image of a receipt or transaction screenshot. Perform "Deep Metadata" extraction to output ONLY a valid JSON object matching this exact structure:
      {
        "merchant": {
          "name": "Standardized Merchant Name (e.g. 'Walmart' instead of 'WMT 3114')",
          "category": "Primary category (e.g. Groceries, Dining, Transit)"
        },
        "totals": {
          "gross": 123.45,
          "subtotal": 110.00,
          "tax": 8.45,
          "tip": 5.00
        },
        "source": {
          "paymentMethod": "Visa, MC, Amex, Cash, etc.",
          "cardIdentifier": "**** 1234 (extract from receipt footer if available, else null)"
        },
        "items": [
          { "name": "Item Name", "amount": 10.00 }
        ],
        "location": {
          "address": "Extracted full address or ZIP/Postal code if available"
        },
        "date": "YYYY-MM-DD"
      }
      For the merchant category, choose the most appropriate one from this hierarchy:
      - Necessary: Rent, Groceries, Utilities, Insurance, Gas/Transit
      - Miscellaneous: Dining, Entertainment, Hobbies, Shopping
      - Recurring: Subscriptions, Gym
      - Debt/Credit: Payments, Interest
      If an item cannot be extracted, use null or 0 where appropriate. Do not include any markdown formatting like \`\`\`json in the output, just the raw JSON string.
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

      // Attempt to geocode the address
      if (receiptData.location && receiptData.location.address) {
        try {
          const res = await geocoder.geocode(receiptData.location.address);
          if (res && res.length > 0) {
            receiptData.location.latitude = res[0].latitude;
            receiptData.location.longitude = res[0].longitude;
          }
        } catch (geocodeErr) {
          console.warn('[Vision Service Warning] Geocoding failed:', geocodeErr.message);
        }
      }

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
        merchant: {
            name: "Supermarket Inc",
            category: "Groceries"
        },
        totals: {
            gross: 45.50,
            subtotal: 40.50,
            tax: 5.00,
            tip: 0
        },
        source: {
            paymentMethod: "Visa",
            cardIdentifier: "**** 1234"
        },
        items: [
            { name: "Apples", amount: 5.50 },
            { name: "Bread", amount: 4.00 },
            { name: "Laundry Detergent", amount: 16.00 },
            { name: "Magazine", amount: 5.00 }
        ],
        location: {
            address: "123 Main St, Cityville, 12345",
            latitude: 43.6532,
            longitude: -79.3832
        },
        date: "2026-03-07"
    };
}
