import React, { useState } from 'react';
import { StyleSheet, View, Text, Button, ScrollView, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { uploadFridgeImage } from '../api';

export default function HomeScreen() {
  const [image, setImage] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [sound, setSound] = useState();

  const pickImage = async () => {
    setErrorMsg('');
    setAiResult(null);

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      processImageWithAI(result.assets[0].uri, result.assets[0].base64);
    }
  };

  const processImageWithAI = async (uri, base64) => {
    setLoading(true);
    try {
        const response = await uploadFridgeImage(uri, base64);
        if (response.success && response.data) {
           setAiResult(response.data);
           if (response.data.voiceAudioUrl) {
               playVoiceAudio(response.data.voiceAudioUrl);
           }
        } else {
           setErrorMsg('Failed to process image: ' + JSON.stringify(response));
        }
    } catch (e) {
        setErrorMsg('Error connecting to backend: ' + e.message);
    } finally {
        setLoading(false);
    }
  };

  const playVoiceAudio = async (base64AudioUrl) => {
    try {
        console.log('Playing voice script...');
        const { sound } = await Audio.Sound.createAsync(
            { uri: base64AudioUrl }
        );
        setSound(sound);
        await sound.playAsync();
    } catch (e) {
        console.error("Audio playback error", e);
    }
  }

  React.useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Fridge AI App</ThemedText>
        <ThemedText>Upload a photo of your fridge to get recipes!</ThemedText>
      </ThemedView>

      <Button title="Choose Fridge Photo" onPress={pickImage} />

      {image && (
          <Image source={{ uri: image }} style={styles.imagePreview} contentFit="cover" />
      )}

      {loading && (
          <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#0000ff" />
              <ThemedText>AI is analyzing your ingredients...</ThemedText>
              <ThemedText style={{fontSize: 10}}>(Ensure Node.js API is running dynamically)</ThemedText>
          </View>
      )}

      {errorMsg ? (
          <ThemedText style={styles.errorText}>{errorMsg}</ThemedText>
      ) : null}

      {aiResult && !loading && (
          <View style={styles.resultsContainer}>
             <ThemedText type="subtitle">Detected Ingredients</ThemedText>
             <View style={styles.tagContainer}>
                 {aiResult.detectedIngredients.map((ing, i) => (
                    <Text key={i} style={styles.tag}>{ing}</Text>
                 ))}
             </View>
             
             {aiResult.topRecipe && (
                 <View style={styles.recipeCard}>
                    <ThemedText type="subtitle">Top Recommended Recipe</ThemedText>
                    <ThemedText type="defaultSemiBold" style={{marginTop: 5}}>{aiResult.topRecipe.title}</ThemedText>
                    <ThemedText>Budget Cost: ${aiResult.topRecipe.cost}</ThemedText>
                    <ThemedText>Adjusted Calories: {aiResult.topRecipe.adjustedCalories} kcal</ThemedText>
                    
                    <View style={styles.recipeGoalBox}>
                        <ThemedText style={styles.goalText}>{aiResult.topRecipe.message}</ThemedText>
                    </View>
                 </View>
             )}

             <ThemedText type="subtitle" style={{marginTop: 20}}>Voice Assistant Script</ThemedText>
             <ThemedText style={styles.voiceScript}>{aiResult.voiceAudioUrl?.text_used}</ThemedText>
             <Button title="Replay Audio" onPress={() => playVoiceAudio(aiResult.voiceAudioUrl?.audioUrl)} />

          </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  header: { marginBottom: 20, alignItems: 'center' },
  imagePreview: { width: '100%', height: 250, borderRadius: 12, marginVertical: 15 },
  loadingContainer: { marginTop: 20, alignItems: 'center', gap: 10 },
  errorText: { color: 'red', marginTop: 10, textAlign: 'center' },
  resultsContainer: { marginTop: 20, padding: 15, backgroundColor: '#f9f9f9', borderRadius: 12 },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, marginBottom: 20 },
  tag: { backgroundColor: '#e6f7ff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15, color: '#0055ff', fontWeight: '600', overflow: 'hidden' },
  recipeCard: { backgroundColor: '#ffffff', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#eee', marginTop: 10 },
  recipeGoalBox: { marginTop: 10, padding: 10, backgroundColor: '#fff0f5', borderRadius: 8 },
  goalText: { color: '#d10056', fontSize: 13 },
  voiceScript: { marginTop: 10, marginBottom: 10, fontStyle: 'italic', color: '#555' }
});
