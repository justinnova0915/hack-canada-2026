const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.getBudgetAdvice = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'No data provided.' });
    }

    const { monthlyIncome, spending } = req.body;

    if (!monthlyIncome || monthlyIncome <= 0) {
      return res.status(400).json({ error: 'Monthly income is required and must be positive.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured.' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const totalSpent = (spending?.necessary || 0) + (spending?.miscellaneous || 0) + (spending?.recurring || 0);
    const savingsRate = ((monthlyIncome - totalSpent) / monthlyIncome * 100).toFixed(1);

    const prompt = `
      You are a certified financial advisor AI. A user has provided their monthly financial data. Analyze it and provide personalized budgeting advice.

      USER DATA:
      - Monthly Income: $${monthlyIncome}
      - Necessary Spending (Rent, Groceries, Utilities, Insurance, Gas): $${spending?.necessary || 0}
      - Miscellaneous Spending (Dining, Entertainment, Hobbies, Shopping): $${spending?.miscellaneous || 0}
      - Recurring Spending (Subscriptions, Gym): $${spending?.recurring || 0}
      - Total Spent: $${totalSpent}
      - Current Savings Rate: ${savingsRate}%

      Respond with ONLY a valid JSON object matching this exact structure:
      {
        "overallScore": 85,
        "scoreLabel": "Good / Needs Work / Excellent / Critical",
        "summary": "A 2-3 sentence overall assessment of their financial health.",
        "recommendedBudget": {
          "necessary": 50,
          "miscellaneous": 20,
          "recurring": 10,
          "savings": 20
        },
        "tips": [
          {
            "title": "Short actionable title",
            "description": "2-3 sentence practical advice",
            "icon": "emoji icon"
          }
        ],
        "monthlyTarget": {
          "necessary": 1500,
          "miscellaneous": 600,
          "recurring": 300,
          "savings": 600
        }
      }

      Rules:
      - overallScore is 0-100 based on how well they follow the 50/30/20 rule (50% needs, 30% wants, 20% savings).
      - recommendedBudget percentages must add up to 100.
      - monthlyTarget values should be dollar amounts based on their income and the recommended percentages.
      - Provide exactly 3-4 tips that are specific to their spending patterns. Be encouraging but honest.
      - Do not include any markdown formatting in the output, just the raw JSON string.
    `;

    console.log('[Budget Advisor] Asking Gemini for budget advice...');

    const result = await model.generateContent([prompt]);
    let text = result.response.text().trim();

    // Clean markdown formatting
    if (text.startsWith('```json')) text = text.substring(7);
    if (text.startsWith('```')) text = text.substring(3);
    if (text.endsWith('```')) text = text.substring(0, text.length - 3);

    const advice = JSON.parse(text.trim());

    console.log('[Budget Advisor] Advice generated successfully!');

    res.json({
      success: true,
      data: advice
    });

  } catch (error) {
    console.error('[Budget Advisor Error]', error);
    res.status(500).json({ error: 'Failed to generate budget advice.', details: error.message });
  }
};
