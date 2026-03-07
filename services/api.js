import { Platform } from 'react-native';

const getApiBaseUrl = () => {
    if (Platform.OS === 'android') {
        return 'http://10.200.11.160:5001';
    } 
    return 'http://10.200.11.160:5001';
};

export const API_BASE_URL = getApiBaseUrl();

export const uploadReceiptImage = async (imageUri, base64) => {
    if (Platform.OS === 'web' && base64) {
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

    const formData = new FormData();
    const filename = imageUri.split('/').pop() || 'fridge.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image`;

    formData.append('image', { uri: imageUri, name: filename, type });

    console.log(`Sending FormData to ${API_BASE_URL}/api/upload-receipt`);

    try {
        const response = await fetch(`${API_BASE_URL}/api/upload-receipt`, {
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
