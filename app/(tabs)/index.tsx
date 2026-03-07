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
} from 'react-native';

export default function HomeScreen(): React.ReactElement {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleCapture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync();
      if (photo) {
        setPhotoUri(photo.uri);
      }
    }
  };

  const handleRetake = () => {
    setPhotoUri(null);
  };

  const handleFlip = () => {
    setFacing((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  const handleProceed = () => {
    // TODO: navigate to next screen or process the image
    console.log('Proceeding with photo:', photoUri);
  };

  // ── Photo Preview ──────────────────────────────────────────────
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

          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.retakeBtn} activeOpacity={0.8} onPress={handleRetake}>
              <Text style={styles.retakeBtnText}>🔄  Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.proceedBtn} activeOpacity={0.85} onPress={handleProceed}>
              <Text style={styles.proceedBtnText}>Proceed  →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  // ── Permission Gate ────────────────────────────────────────────
  const cameraReady = permission?.granted;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View>
          <Text style={styles.sectionLabel}>GOOD EVENING</Text>
          <Text style={styles.heroTitle}>{"What's in\nyour fridge?"}</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={{ fontSize: 18 }}>👤</Text>
        </View>

      </Animated.View>
      <Text style={styles.hintText}>
        {cameraReady
          ? 'Point at your fridge and snap a photo'
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

        {/* Controls Row */}
        {cameraReady && (
          <View style={styles.controlsRow}>
            <TouchableOpacity style={styles.controlBtn} activeOpacity={0.8} onPress={handleFlip}>
              <Text style={{ fontSize: 22 }}>🔄</Text>
              <Text style={styles.controlLabel}>Flip</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.captureOuter} activeOpacity={0.85} onPress={handleCapture}>
              <View style={styles.captureInner}>
                <Text style={{ fontSize: 28 }}>📷</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.controlBtn}>
              {/* Spacer for symmetry */}
              <Text style={{ fontSize: 22, opacity: 0 }}>🔄</Text>
              <Text style={[styles.controlLabel, { opacity: 0 }]}>Flip</Text>
            </View>
          </View>
        )}

        {/* Hint text */}

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
    paddingBottom: 24,
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
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 28,
  },

  /* ── Camera Card ────────────────────────────────── */
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

  /* ── Permission Placeholder ─────────────────────── */
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

  /* ── Viewfinder Brackets ────────────────────────── */
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

  /* ── Controls ───────────────────────────────────── */
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
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
  captureOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: '#e8a44a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(232,164,74,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Hint ───────────────────────────────────────── */
  hintText: {
    textAlign: 'center',
    fontSize: 13,
    color: 'rgba(240,236,227,0.4)',
    marginTop: 16,
    lineHeight: 18,
    paddingBottom: 12,
  },

  /* ── Preview ────────────────────────────────────── */
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
});