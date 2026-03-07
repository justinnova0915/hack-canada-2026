import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Octicons from '@expo/vector-icons/Octicons';
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { uploadFridgeImage } from '../api';

export default function HomeScreen(): React.ReactElement {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const [aiResult, setAiResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const toggleFacing = (current: CameraType): CameraType =>
    current === 'back' ? 'front' : 'back';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.35, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [fadeAnim, slideAnim, pulseAnim]);

  useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const handleCapture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ base64: true });
      if (photo) {
        setPhotoUri(photo.uri);
        setPhotoBase64(photo.base64 || null);
      }
    }
  };

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
      setPhotoUri(result.assets[0].uri);
      setPhotoBase64(result.assets[0].base64 || null);
    }
  };

  const processImageWithAI = async (uri: string, base64: string | null) => {
    if (!base64) return;
    setLoading(true);
    setErrorMsg('');
    try {
        const response: any = await uploadFridgeImage(uri, base64);
        if (response.success && response.data) {
           setAiResult(response.data);
           if (response.data.voiceAudioUrl) {
               playVoiceAudio(response.data.voiceAudioUrl.audioUrl || response.data.voiceAudioUrl);
           }
        } else {
           setErrorMsg('Failed to process image: ' + JSON.stringify(response));
        }
    } catch (e: any) {
        setErrorMsg('Error connecting to backend: ' + e.message);
    } finally {
        setLoading(false);
    }
  };

  const playVoiceAudio = async (base64AudioUrl: string) => {
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
  };

  const handleRetake = () => {
    setPhotoUri(null);
    setPhotoBase64(null);
    setAiResult(null);
    setErrorMsg('');
  };

  const handleFlip = () => {
    setFacing(toggleFacing);
  };

  const handleProceed = () => {
    if (photoUri && photoBase64) {
      processImageWithAI(photoUri, photoBase64);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
         <ActivityIndicator size="large" color="#e8a44a" />
         <Text style={{ color: '#e8a44a', marginTop: 16, fontSize: 16 }}>AI is analyzing your ingredients...</Text>
      </View>
    );
  }

  if (aiResult) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View>
            <Text style={styles.sectionLabel}>RESULTS</Text>
            <Text style={styles.heroTitle}>{'Here is what\nwe found'}</Text>
          </View>
          <TouchableOpacity style={styles.avatar} onPress={handleRetake}>
            <Text style={{ fontSize: 18 }}>📸</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.section}>
          {errorMsg ? (
            <Text style={{ color: '#ff4444', marginBottom: 16 }}>{errorMsg}</Text>
          ) : null}

          <View style={styles.resultsCard}>
             <Text style={styles.resultsSubtitle}>Detected Ingredients</Text>
             <View style={styles.tagContainer}>
                 {aiResult.detectedIngredients?.map((ing: string, i: number) => (
                    <Text key={i} style={styles.tag}>{ing}</Text>
                 ))}
             </View>
             
             {aiResult.topRecipe && (
                 <View style={styles.recipeCard}>
                    <Text style={styles.resultsSubtitleDark}>Top Recommended Recipe</Text>
                    <Text style={styles.recipeTitle}>{aiResult.topRecipe.title}</Text>
                    <Text style={styles.recipeDetail}>Cost: ${aiResult.topRecipe.cost}</Text>
                    <Text style={styles.recipeDetail}>Calories: {aiResult.topRecipe.adjustedCalories} kcal</Text>
                    
                    <View style={styles.recipeGoalBox}>
                        <Text style={styles.goalText}>{aiResult.topRecipe.message}</Text>
                    </View>
                 </View>
             )}

             {aiResult.voiceAudioUrl && (
               <>
                 <Text style={[styles.resultsSubtitle, { marginTop: 24 }]}>Voice Assistant Script</Text>
                 <Text style={styles.voiceScript}>{aiResult.voiceAudioUrl.text_used || aiResult.voiceAudioUrl}</Text>
                 
                 <TouchableOpacity style={styles.playAudioBtn} activeOpacity={0.8} onPress={() => playVoiceAudio(aiResult.voiceAudioUrl.audioUrl || aiResult.voiceAudioUrl)}>
                   <Text style={styles.playAudioBtnText}>🔊 Replay Audio</Text>
                 </TouchableOpacity>
               </>
             )}

             <TouchableOpacity style={[styles.proceedBtn, { marginTop: 32 }]} activeOpacity={0.85} onPress={handleRetake}>
                <Text style={styles.proceedBtnText}>Scan Another</Text>
             </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  if (photoUri) {
    return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View>
            <Text style={styles.sectionLabel}>PREVIEW</Text>
            <Text style={styles.heroTitle}>{'Looking\ngood?'}</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={{ fontSize: 18 }}>👤</Text>
          </View>
        </Animated.View>

        <View style={styles.section}>
          <View style={styles.previewCard}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="cover" />
          </View>

          {errorMsg ? (
              <Text style={{ color: '#ff4444', marginTop: 16, textAlign: 'center' }}>{errorMsg}</Text>
          ) : null}

          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.retakeBtn} activeOpacity={0.8} onPress={handleRetake}>
              <Text style={styles.retakeBtnText}>🔄  Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.proceedBtn} activeOpacity={0.85} onPress={handleProceed}>
              <Text style={styles.proceedBtnText}>AI Analyze  →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  const cameraReady = permission?.granted;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View>
          <Text style={styles.sectionLabel}>GOOD EVENING</Text>
          <Text style={styles.heroTitle}>{"What's in\nyour fridge?"}</Text>
        </View>
        <TouchableOpacity style={styles.avatar} activeOpacity={0.8} onPress={pickImage}>
          <Text style={{ fontSize: 18 }}>🖼️</Text>
        </TouchableOpacity>
      </Animated.View>
      <Text style={styles.hintText}>
        {cameraReady
          ? 'Point at your fridge, snap a photo, or upload from gallery 🖼️'
          : 'Camera permission is needed to scan ingredients'}
      </Text>
      {/* Camera Viewfinder */}
      <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.cameraCard}>
          {cameraReady ? (
            <CameraView
              ref={cameraRef}
              style={styles.cameraView}
              facing={facing}
            />
          ) : (
            <TouchableOpacity
              style={styles.permissionBox}
              activeOpacity={0.8}
              onPress={requestPermission}
            >
              <Text style={{ fontSize: 40 }}>📷</Text>
              <Text style={styles.permissionTitle}>Enable Camera</Text>
              <Text style={styles.permissionSubtitle}>
                Tap to grant camera access
              </Text>
            </TouchableOpacity>
          )}
          {cameraReady && (
            <View style={styles.controlsRow}>
              <TouchableOpacity style={styles.controlBtn} activeOpacity={0.8} onPress={handleFlip}>
                <Octicons size={28} name="arrow-switch" color="#e8a44a" />
              </TouchableOpacity>

              <View style={styles.captureWrapper}>
                <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
                <TouchableOpacity style={styles.captureOuter} activeOpacity={0.85} onPress={handleCapture}>
                  <View style={styles.captureInner}>
                    <FontAwesome6 size={28} name="camera" color="#e8a44a" />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.controlBtn}>
                <Text style={{ fontSize: 22, opacity: 0 }}>🔄</Text>
                <Text style={[styles.controlLabel, { opacity: 0 }]}>Flip</Text>
              </View>
            </View>
          )}

          {/* Viewfinder corner brackets */}
          {cameraReady && (
            <>
              <View style={[styles.bracket, styles.bracketTL]} />
              <View style={[styles.bracket, styles.bracketTR]} />
              <View style={[styles.bracket, styles.bracketBL]} />
              <View style={[styles.bracket, styles.bracketBR]} />
            </>
          )}
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const BORDER_RADIUS = 20;
const BRACKET_SIZE = 24;
const BRACKET_THICKNESS = 3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    color: '#e8a44a',
    opacity: 0.8,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#f0ece3',
    lineHeight: 40,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e8a44a',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 28,
  },

  cameraCard: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cameraView: {
    flex: 1,
  },

  permissionBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f0ece3',
    marginTop: 4,
  },
  permissionSubtitle: {
    fontSize: 13,
    color: 'rgba(240,236,227,0.45)',
  },

  bracket: {
    position: 'absolute',
    width: BRACKET_SIZE,
    height: BRACKET_SIZE,
    borderColor: '#e8a44a',
  },
  bracketTL: {
    top: 16,
    left: 16,
    borderTopWidth: BRACKET_THICKNESS,
    borderLeftWidth: BRACKET_THICKNESS,
    borderTopLeftRadius: 6,
  },
  bracketTR: {
    top: 16,
    right: 16,
    borderTopWidth: BRACKET_THICKNESS,
    borderRightWidth: BRACKET_THICKNESS,
    borderTopRightRadius: 6,
  },
  bracketBL: {
    bottom: 16,
    left: 16,
    borderBottomWidth: BRACKET_THICKNESS,
    borderLeftWidth: BRACKET_THICKNESS,
    borderBottomLeftRadius: 6,
  },
  bracketBR: {
    bottom: 16,
    right: 16,
    borderBottomWidth: BRACKET_THICKNESS,
    borderRightWidth: BRACKET_THICKNESS,
    borderBottomRightRadius: 6,
  },

  controlsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 20,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  controlBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 2,
  },
  controlLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(240,236,227,0.5)',
    letterSpacing: 0.5,
  },
  captureWrapper: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: '#e8a44a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: 'rgba(232, 164, 74, 0.4)',
  },
  captureInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(232,164,74,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  hintText: {
    textAlign: 'center',
    fontSize: 13,
    color: 'rgba(240,236,227,0.4)',
    marginTop: 16,
    lineHeight: 18,
    paddingBottom: 12,
  },

  previewCard: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: BORDER_RADIUS,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  previewImage: {
    flex: 1,
  },
  previewActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  retakeBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
  },
  retakeBtnText: {
    color: '#f0ece3',
    fontSize: 16,
    fontWeight: '600',
  },
  proceedBtn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 18,
    backgroundColor: '#e8a44a',
    alignItems: 'center',
  },
  proceedBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  
  // Results view styles
  resultsCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: BORDER_RADIUS,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  resultsSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f0ece3',
    marginBottom: 16,
  },
  resultsSubtitleDark: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  tag: {
    backgroundColor: 'rgba(232,164,74,0.15)',
    color: '#e8a44a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 14,
    overflow: 'hidden',
  },
  recipeCard: {
    backgroundColor: '#f0ece3',
    padding: 18,
    borderRadius: 16,
    marginTop: 8,
  },
  recipeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#e8a44a',
    marginBottom: 6,
  },
  recipeDetail: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
  },
  recipeGoalBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(232,164,74,0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#e8a44a',
  },
  goalText: {
    color: '#333',
    fontSize: 13,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  voiceScript: {
    fontSize: 14,
    color: 'rgba(240,236,227,0.7)',
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
  },
  playAudioBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  playAudioBtnText: {
    color: '#f0ece3',
    fontSize: 15,
    fontWeight: '600',
  },
});
