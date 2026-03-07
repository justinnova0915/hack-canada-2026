import { Platform } from 'react-native';

const getApiBaseUrl = () => {
    return 'http://localhost:3000'; //REPLACE WITH YOUR IP FOR TESTING
};

export const API_BASE_URL = getApiBaseUrl();

export const uploadFridgeImage = async (imageUri, base64) => {
    if (Platform.OS === 'web' && base64) {
        console.log(`Sending base64 JSON payload to ${API_BASE_URL}/api/upload-fridge-base64`);

        try {
            const response = await fetch(`${API_BASE_URL}/api/upload-fridge-base64`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    image: base64,
                    age: '22',
                    weight: '75',
                    height: '180',
                    activityLevel: '1.5',
                    goal: 'weight loss',
                    budget: '8.0'
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

    const formData = new FormData();
    const filename = imageUri.split('/').pop() || 'fridge.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image`;

    formData.append('image', { uri: imageUri, name: filename, type });
    formData.append('age', '22');
    formData.append('weight', '75');
    formData.append('height', '180');
    formData.append('activityLevel', '1.5');
    formData.append('goal', 'weight loss');
    formData.append('budget', '8.0');

    console.log(`Sending FormData to ${API_BASE_URL}/api/upload-fridge`);

    try {
        const response = await fetch(`${API_BASE_URL}/api/upload-fridge`, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server Error ${response.status}: ${errorText}`);
        }

        return await response.json();

    } catch (error) {
        console.error("API Form Upload Error:", error);
        throw error;
    }
}
