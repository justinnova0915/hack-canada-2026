import { API_BASE_URL } from './api';

export const getBudgetAdvice = async (monthlyIncome: number, spending: { necessary: number; miscellaneous: number; recurring: number }) => {
    console.log(`Requesting budget advice from ${API_BASE_URL}/api/budget-advice`);

    try {
        const response = await fetch(`${API_BASE_URL}/api/budget-advice`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                monthlyIncome,
                spending
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server Error ${response.status}: ${errorText}`);
        }

        const result = await response.json();
        return result;

    } catch (error) {
        console.error("Budget Advice API Error:", error);
        throw error;
    }
};
