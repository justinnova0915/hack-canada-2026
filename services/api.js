
const getApiBaseUrl = () => {
    return 'https://us-central1-hack-canada-2026-b2c76.cloudfunctions.net/api';
};

export const API_BASE_URL = getApiBaseUrl();

export const uploadReceiptImage = async (imageUri, base64) => {
    if (!base64) {
        throw new Error("Base64 image data is required for Firebase Functions upload.");
    }

    console.log(`Sending base64 JSON payload to ${API_BASE_URL}/api/upload-receipt-base64`);

    try {
        const response = await fetch(`${API_BASE_URL}/api/upload-receipt-base64`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                image: base64
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server Error ${response.status}: ${errorText}`);
        }

        return await response.json();

    } catch (error) {
        console.error("API Base64 Upload Error:", error);
        throw error;
    }
}
