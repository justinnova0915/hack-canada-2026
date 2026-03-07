import Feather from '@expo/vector-icons/Feather';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import Octicons from '@expo/vector-icons/Octicons';
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../../context/AuthContext';
import { uploadReceiptImage } from '../../services/api';
import { logReceipt } from '../../services/receiptService';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

/* ── Liquid Wave Loading ────────────────────────────────────────── */

function LiquidLoading() {
  const fillAnim = useRef(new Animated.Value(0)).current;
  const timeRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const [wavePath, setWavePath] = useState('');
  const [highlightPath, setHighlightPath] = useState('');
  const fillRef = useRef(0);
  const reachedTarget = useRef(false);

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: 0.65,
      duration: 9000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        reachedTarget.current = true;
        Animated.loop(
          Animated.sequence([
            Animated.timing(fillAnim, {
              toValue: 0.68,
              duration: 2500,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: false,
            }),
            Animated.timing(fillAnim, {
              toValue: 0.62,
              duration: 2500,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: false,
            }),
          ])
        ).start();
      }
    });

    const listener = fillAnim.addListener(({ value }) => {
      if (reachedTarget.current) {
        fillRef.current = Math.max(value, 0.62);
      } else {
        fillRef.current = value;
      }
    });

    return () => {
      fillAnim.removeListener(listener);
      fillAnim.stopAnimation();
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [fillAnim]);

  const buildPaths = useCallback(() => {
    const t = timeRef.current;
    const fill = fillRef.current;
    const baseY = SCREEN_H * (1 - fill);
    const step = 4;

    let mainD = `M 0 ${SCREEN_H} `;
    for (let x = 0; x <= SCREEN_W; x += step) {
      const y =
        baseY +
        Math.sin(x * 0.008 + t * 1.8) * 14 +
        Math.sin(x * 0.015 + t * 2.5) * 8 +
        Math.sin(x * 0.003 + t * 1.2) * 18 +
        Math.cos(x * 0.012 + t * 3.0) * 5;
      if (x === 0) mainD += `L 0 ${y} `;
      mainD += `L ${x} ${y} `;
    }
    mainD += `L ${SCREEN_W} ${SCREEN_H} Z`;

    const hlAmp = 8;
    const hlOffset = -10;
    let highD = '';
    for (let x = 0; x <= SCREEN_W; x += step) {
      const y =
        baseY +
        hlOffset +
        Math.sin(x * 0.006 + t * 1.6) * hlAmp +
        Math.sin(x * 0.01 + t * 2.2) * (hlAmp * 0.5);
      if (x === 0) {
        highD = `M ${x} ${y}`;
      } else {
        highD += ` L ${x} ${y}`;
      }
    }

    setWavePath(mainD);
    setHighlightPath(highD);
  }, []);

  useEffect(() => {
    let lastTime = Date.now();

    const tick = () => {
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      timeRef.current += dt;
      buildPaths();
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [buildPaths]);

  return (
    <View style={liquidStyles.container}>
      <StatusBar barStyle="light-content" />
      <Svg width={SCREEN_W} height={SCREEN_H} style={StyleSheet.absoluteFill}>
        <Path d={wavePath} fill="rgba(180,110,20,0.22)" />
        <Path d={highlightPath} fill="none" stroke="rgba(180,110,20,0.4)" strokeWidth={3} />
      </Svg>
      <View style={liquidStyles.content}>
        <FontAwesome6 size={32} name="receipt" color="#b46e14" style={{ marginBottom: 28 }} />
        <Text style={liquidStyles.title}>Analyzing</Text>
        <Text style={liquidStyles.subtitle}>Extracting expenses from your receipt...</Text>
      </View>
    </View>
  );
}

const liquidStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1117' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  title: { color: '#f0ece3', fontSize: 24, fontWeight: '800', marginBottom: 8 },
  subtitle: { color: 'rgba(240,236,227,0.4)', fontSize: 14, fontWeight: '500' },
});

/* ── Nav Bubble ─────────────────────────────────────────────────── */

interface NavItem {
  route: string;
  icon: string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { route: '/(tabs)', icon: 'home', label: 'Home' },
  { route: '/(tabs)/history', icon: 'clock', label: 'History' },
  { route: '/(tabs)/stats', icon: 'pie-chart', label: 'Stats' },
  { route: '/(tabs)/map', icon: 'map', label: 'Map' },
];

const BUBBLE_SIZE = 52;
const ITEM_SIZE = 44;
const ITEM_GAP = 8;

function NavBubble() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const toValue = open ? 0 : 1;
    Animated.parallel([
      Animated.spring(expandAnim, {
        toValue,
        useNativeDriver: false,
        friction: 9,
        tension: 65,
      }),
      Animated.timing(rotateAnim, {
        toValue,
        duration: 250,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
    setOpen(!open);
  };

  const navigate = (route: string) => {
    router.push(route as any);
    if (open) toggle();
  };

  const totalHeight = NAV_ITEMS.length * (ITEM_SIZE + ITEM_GAP) + ITEM_GAP;

  const columnHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, totalHeight],
  });

  const itemsOpacity = expandAnim.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [0, 0, 1],
  });

  const chevronRotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const borderWidth = expandAnim.interpolate({
    inputRange: [0, 0.1, 1],
    outputRange: [0, 1, 1],
  });

  return (
    <View style={navStyles.wrapper}>
      <Animated.View style={[navStyles.column, { height: columnHeight, borderWidth }]}>
        <Animated.View style={[navStyles.columnInner, { opacity: itemsOpacity }]}>
          {NAV_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.route}
              style={navStyles.navItem}
              activeOpacity={0.8}
              onPress={() => navigate(item.route)}
            >
              <Feather name={item.icon as any} size={18} color="#e8a44a" />
            </TouchableOpacity>
          ))}
        </Animated.View>
      </Animated.View>

      <TouchableOpacity style={navStyles.toggleBtn} activeOpacity={0.8} onPress={toggle}>
        <Animated.View style={{ transform: [{ rotate: chevronRotate }] }}>
          <Feather name="chevron-up" size={20} color="#e8a44a" />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const navStyles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    width: BUBBLE_SIZE,
  },
  column: {
    position: 'absolute',
    bottom: BUBBLE_SIZE + 8,
    width: BUBBLE_SIZE,
    backgroundColor: 'rgba(13,17,23,0.92)',
    borderRadius: 26,
    borderColor: 'rgba(232,164,74,0.2)',
    overflow: 'hidden',
  },
  columnInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: ITEM_GAP,
    gap: ITEM_GAP,
  },
  navItem: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleBtn: {
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

/* ── Main Screen ────────────────────────────────────────────────── */

export default function HomeScreen(): React.ReactElement {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const [aiResult, setAiResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const toggleFacing = (current: CameraType): CameraType =>
    current === 'back' ? 'front' : 'back';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.35, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [fadeAnim, slideAnim, pulseAnim]);

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
      const response: any = await uploadReceiptImage(uri, base64);
      if (response.success && response.data) {
        setAiResult(response.data);
      } else {
        setErrorMsg('Failed to process image: ' + JSON.stringify(response));
      }
    } catch (e: any) {
      setErrorMsg('Error connecting to backend: ' + e.message);
    } finally {
      setLoading(false);
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

  const handleShowAllItems = () => {
    if (!aiResult?.items?.length) return;

    router.push({
      pathname: '/(tabs)/more',
      params: {
        items: JSON.stringify(aiResult.items),
      },
    });
  };

  const handleLogReceipt = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save receipts.');
      return;
    }
    if (!aiResult) return;
    try {
      setLoading(true);
      await logReceipt(user.uid, aiResult);
      Alert.alert('Added', 'Receipt added to your history.', [
        {
          text: 'OK',
          onPress: () => {
            handleRetake();
            router.push('/(tabs)/history');
          },
        },
      ]);
    } catch (e: any) {
      Alert.alert('Error', 'Failed to log receipt: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Loading — Liquid Wave ──────────────────────────────────────
  if (loading) {
    return <LiquidLoading />;
  }

  if (aiResult) {
    return (
      <ScrollView style={[styles.fullScreen, { backgroundColor: '#0d1117' }]} showsVerticalScrollIndicator={false}>
        <StatusBar barStyle="light-content" />
        <View style={[styles.resultsTop, { paddingTop: insets.top + 16 }]}>
          <View>
            <Text style={styles.labelAccent}>RESULTS</Text>
            <Text style={styles.headingLg}>Expense{'\n'}Breakdown</Text>
          </View>
          <TouchableOpacity style={styles.circleBtn} onPress={handleRetake}>
            <FontAwesome6 size={16} name="camera" color="#0d1117" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <View style={styles.resultsCard}>
            <View style={styles.merchantRow}>
              <Text style={styles.merchantName}>{aiResult.merchant?.name || 'Unknown'}</Text>
              <View style={styles.tagContainer}>
                <View style={styles.tagPill}>
                  <Text style={styles.tagText}>{aiResult.merchant?.category || 'Misc'}</Text>
                </View>
                <TouchableOpacity style={{}} activeOpacity={0} onPress={() => {
                  // Handle edit action here
                }}>
                  <Feather name="edit" size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.dateMuted}>{aiResult.date}</Text>

            {aiResult.location?.address && (
              <View style={styles.locationChip}>
                <Feather name="map-pin" size={12} color="rgba(240,236,227,0.6)" />
                <Text style={styles.locationText}>{aiResult.location.address}</Text>
              </View>
            )}

            <View style={{ marginTop: 8 }}>
              {aiResult.items?.slice(0, 5).map((item: any, i: number) => (
                <View key={i} style={styles.itemRow}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemPrice}>${item.amount?.toFixed(2)}</Text>
                </View>
              ))}
              {aiResult.items?.length > 5 && (
                <View style={styles.itemRow}>
                  <Text style={styles.moreText}>+{aiResult.items.length - 5} more</Text>
                  <TouchableOpacity onPress={handleShowAllItems} activeOpacity={0.8}>
                    <Text style={styles.showAllBtnText}>Show all</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalVal}>${aiResult.totals?.subtotal?.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax</Text>
              <Text style={styles.totalVal}>${aiResult.totals?.tax?.toFixed(2)}</Text>
            </View>
            {aiResult.totals?.tip > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tip</Text>
                <Text style={styles.totalVal}>${aiResult.totals?.tip?.toFixed(2)}</Text>
              </View>
            )}
            <View style={[styles.totalRow, { marginTop: 12 }]}>
              <Text style={styles.grossLabel}>Total</Text>
              <Text style={styles.grossVal}>${aiResult.totals?.gross?.toFixed(2)}</Text>
            </View>

            <View style={styles.paymentChip}>
              <Feather name="credit-card" size={14} color="#e8a44a" />
              <Text style={styles.paymentText}>
                {aiResult.source?.paymentMethod} {aiResult.source?.cardIdentifier}
              </Text>
            </View>

            <TouchableOpacity style={styles.btnPrimary} activeOpacity={0.85} onPress={handleLogReceipt}>
              <Text style={styles.btnPrimaryText}>Verify & Log</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ height: 120 }} />
      </ScrollView>
    );
  }

  if (photoUri) {
    return (
      <View style={styles.fullScreen}>
        <StatusBar barStyle="light-content" />
        <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />

        <View style={[styles.bracket, { top: insets.top + 12, left: 12 }, styles.bTL]} />
        <View style={[styles.bracket, { top: insets.top + 12, right: 12 }, styles.bTR]} />
        <View style={[styles.bracket, { bottom: 120, left: 12 }, styles.bBL]} />
        <View style={[styles.bracket, { bottom: 120, right: 12 }, styles.bBR]} />

        {errorMsg ? <Text style={styles.errorFloat}>{errorMsg}</Text> : null}

        <View style={[styles.previewBar, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={styles.btnGhost} activeOpacity={0.8} onPress={handleRetake}>
            <Feather name="rotate-ccw" size={18} color="#f0ece3" />
            <Text style={styles.btnGhostText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnPrimary} activeOpacity={0.85} onPress={handleProceed}>
            <Text style={styles.btnPrimaryText}>Analyze  →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const cameraReady = permission?.granted;

  return (
    <View style={styles.fullScreen}>
      <StatusBar barStyle="light-content" />

      {cameraReady ? (
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing={facing} />
      ) : (
        <TouchableOpacity
          style={[StyleSheet.absoluteFillObject, styles.permissionBox]}
          activeOpacity={0.8}
          onPress={requestPermission}
        >
          <View style={styles.permissionCircle}>
            <FontAwesome6 size={28} name="camera" color="#e8a44a" />
          </View>
          <Text style={styles.permissionTitle}>Enable Camera</Text>
          <Text style={styles.permissionSub}>Tap to grant access</Text>
        </TouchableOpacity>
      )}

      {cameraReady && (
        <>
          <View style={[styles.bracket, { top: insets.top + 12, left: 12 }, styles.bTL]} />
          <View style={[styles.bracket, { top: insets.top + 12, right: 12 }, styles.bTR]} />
          <View style={[styles.bracket, { bottom: 12, left: 12 }, styles.bBL]} />
          <View style={[styles.bracket, { bottom: 12, right: 12 }, styles.bBR]} />
        </>
      )}

      {cameraReady && (
        <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
          <View style={[styles.topBar, { top: insets.top - 30, right: insets.right + 0 }]} pointerEvents="box-none">
            <TouchableOpacity style={styles.topPill} activeOpacity={0.8} onPress={pickImage}>
              <Feather name="image" size={16} color="#e8a44a" />
              <Text style={styles.topPillText}>Gallery</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.hintText}>Point at a receipt</Text>

          <View style={styles.controlsRow}>
            <NavBubble />

            <View style={styles.captureWrapper}>
              <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
              <TouchableOpacity style={styles.captureOuter} activeOpacity={0.85} onPress={handleCapture}>
                <View style={styles.captureInner}>
                  <FontAwesome6 size={26} name="camera" color="#e8a44a" />
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.controlBtn} activeOpacity={0.8} onPress={handleFlip}>
              <Octicons size={20} name="arrow-switch" color="#e8a44a" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const B = 24;
const BW = 3;

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  topPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  topPillText: {
    color: '#e8a44a',
    fontSize: 13,
    fontWeight: '600',
  },

  bracket: {
    position: 'absolute',
    width: B,
    height: B,
    borderColor: '#e8a44a',
    zIndex: 5,
  },
  bTL: { borderTopWidth: BW, borderLeftWidth: BW, borderTopLeftRadius: 8 },
  bTR: { borderTopWidth: BW, borderRightWidth: BW, borderTopRightRadius: 8 },
  bBL: { borderBottomWidth: BW, borderLeftWidth: BW, borderBottomLeftRadius: 8 },
  bBR: { borderBottomWidth: BW, borderRightWidth: BW, borderBottomRightRadius: 8 },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingTop: 12,
    backgroundColor: 'rgba(13,17,23,0.85)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  hintText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-evenly',
    width: '100%',
    paddingHorizontal: 32,
  },
  controlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureWrapper: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureOuter: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#e8a44a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: 'rgba(232,164,74,0.3)',
  },
  captureInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(232,164,74,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  permissionBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d1117',
    gap: 12,
  },
  permissionCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(232,164,74,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(232,164,74,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f0ece3',
  },
  permissionSub: {
    fontSize: 14,
    color: 'rgba(240,236,227,0.4)',
  },

  previewBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: 'rgba(13,17,23,0.85)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  btnGhost: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnGhostText: {
    color: '#f0ece3',
    fontSize: 15,
    fontWeight: '600',
  },
  btnPrimary: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 22,
    backgroundColor: '#e8a44a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  errorFloat: {
    color: '#ff4444',
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    fontSize: 13,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  errorText: {
    color: '#ff4444',
    marginBottom: 16,
  },

  loadingTitle: {
    color: '#f0ece3',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
  },
  loadingSub: {
    color: 'rgba(240,236,227,0.4)',
    fontSize: 14,
  },
  loaderPulse: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: 'rgba(232,164,74,0.25)',
  },

  resultsTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  circleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e8a44a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelAccent: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    color: '#e8a44a',
    marginBottom: 6,
  },
  headingLg: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f0ece3',
    lineHeight: 34,
  },
  section: {
    paddingHorizontal: 24,
  },
  resultsCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  merchantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  merchantName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f0ece3',
    flex: 1,
    marginRight: 12,
  },
  tagContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  tagPill: {
    backgroundColor: 'rgba(232,164,74,0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 5,
  },
  editPill: {
    backgroundColor: 'rgba(232,164,74,0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    color: '#e8a44a',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  editText: {
    color: '#e8a44a',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dateMuted: {
    color: 'rgba(240,236,227,0.4)',
    fontSize: 13,
    marginBottom: 20,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
  },
  locationText: {
    color: 'rgba(240,236,227,0.6)',
    fontSize: 12,
    flex: 1,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  itemName: {
    color: '#f0ece3',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginRight: 12,
  },
  itemPrice: {
    color: '#f0ece3',
    fontSize: 15,
    fontWeight: '700',
  },
  moreText: {
    color: 'rgba(240,236,227,0.3)',
    fontSize: 12,
    marginTop: 8,
  },
  showAllBtnText: {
    color: '#e8a44a',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalLabel: {
    color: 'rgba(240,236,227,0.4)',
    fontSize: 14,
  },
  totalVal: {
    color: 'rgba(240,236,227,0.5)',
    fontSize: 14,
    fontWeight: '600',
  },
  grossLabel: {
    color: '#e8a44a',
    fontSize: 18,
    fontWeight: '800',
  },
  grossVal: {
    color: '#e8a44a',
    fontSize: 22,
    fontWeight: '900',
  },
  paymentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(232,164,74,0.06)',
    padding: 14,
    borderRadius: 16,
    marginTop: 20,
    marginBottom: 24,
  },
  paymentText: {
    color: '#e8a44a',
    fontSize: 13,
    fontWeight: '600',
  },
});