import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type TabType = 'Have Now' | 'Can Get';

interface Recipe {
  name: string;
  cal: number;
  time: string;
  match: number;
  emoji: string;
  tags: TabType[];
}

interface Feature {
  icon: string;
  title: string;
  desc: string;
}

const ingredients: string[] = [
  '🥕 Carrots', '🧀 Cheese', '🥚 Eggs', '🧄 Garlic', '🍅 Tomatoes', '🥦 Broccoli',
];

const recipes: Recipe[] = [
  { name: 'Garlic Pasta',     cal: 420, time: '20 min', match: 94, emoji: '🍝', tags: ['Have Now'] },
  { name: 'Veggie Omelette',  cal: 310, time: '10 min', match: 88, emoji: '🍳', tags: ['Have Now'] },
  { name: 'Tomato Soup',      cal: 210, time: '25 min', match: 76, emoji: '🍲', tags: ['Have Now'] },
  { name: 'Chicken Stir Fry', cal: 510, time: '30 min', match: 65, emoji: '🍜', tags: ['Can Get'] },
  { name: 'Avocado Toast',    cal: 290, time: '5 min',  match: 72, emoji: '🥑', tags: ['Can Get'] },
];

const features: Feature[] = [
  { icon: '📷', title: 'Scan Fridge',    desc: 'AI detects ingredients via camera' },
  { icon: '🍽️', title: 'Get Recipes',   desc: 'Personalized picks for you' },
  { icon: '🛒', title: 'Grocery List',   desc: 'Auto-generate shopping lists' },
  { icon: '🔊', title: 'Cook Assistant', desc: 'Voice-guided cooking' },
];

export default function HomeScreen(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<TabType>('Have Now');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.4, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const filtered: Recipe[] = recipes.filter((r) => r.tags.includes(activeTab));

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

      {/* Scan CTA */}
      <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.card}>
          <View style={styles.scanRow}>
            <View style={styles.scanIconWrapper}>
              <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
              <View style={styles.scanIconCircle}>
                <Text style={{ fontSize: 26 }}>📷</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Scan Your Fridge</Text>
              <Text style={styles.cardSubtitle}>YOLO + Gemini detects ingredients instantly</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.scanBtn} activeOpacity={0.85}>
            <Text style={styles.scanBtnText}>📸  Open Camera</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Ingredients */}
      <Animated.View style={[{ opacity: fadeAnim }, styles.ingredientSection]}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionLabel}>DETECTED INGREDIENTS</Text>
          <Text style={styles.viewAll}>View all →</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
          <View style={styles.chipsRow}>
            {ingredients.map((item, i) => (
              <View key={i} style={styles.chip}>
                <Text style={styles.chipText}>{item}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </Animated.View>

      {/* Recipe Tabs */}
      <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
        <View style={styles.rowBetween}>
          <Text style={styles.sectionLabel}>RECIPES FOR YOU</Text>
          <View style={styles.tabRow}>
            {(['Have Now', 'Can Get'] as TabType[]).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'Have Now' ? '🧊 ' : '🛒 '}{tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ marginTop: 14, gap: 10 }}>
          {filtered.map((recipe, i) => (
            <TouchableOpacity key={i} style={styles.card} activeOpacity={0.8}>
              <View style={styles.recipeRow}>
                <View style={styles.recipeEmoji}>
                  <Text style={{ fontSize: 26 }}>{recipe.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.recipeName}>{recipe.name}</Text>
                    <Text style={styles.matchText}>{recipe.match}%</Text>
                  </View>
                  <View style={[styles.rowBetween, { marginBottom: 8 }]}>
                    <Text style={styles.recipeMeta}>🔥 {recipe.cal} cal</Text>
                    <Text style={styles.recipeMeta}>⏱ {recipe.time}</Text>
                  </View>
                  <View style={styles.matchBarBg}>
                    <View style={[styles.matchBar, { width: `${recipe.match}%` }]} />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

      {/* Features Grid */}
      <Animated.View style={[styles.section, { opacity: fadeAnim, paddingBottom: 100 }]}>
        <Text style={styles.sectionLabel}>EVERYTHING YOU NEED</Text>
        <View style={styles.featuresGrid}>
          {features.map((f, i) => (
            <TouchableOpacity key={i} style={[styles.card, styles.featureCard]} activeOpacity={0.8}>
              <View style={styles.featureIcon}>
                <Text style={{ fontSize: 22 }}>{f.icon}</Text>
              </View>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>

    </ScrollView>
  );
}

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
  ingredientSection: {
    marginBottom: 28,
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 18,
  },
  scanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 18,
  },
  scanIconWrapper: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(232, 164, 74, 0.4)',
  },
  scanIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(232,164,74,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(232,164,74,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f0ece3',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: 'rgba(240,236,227,0.55)',
    lineHeight: 18,
  },
  scanBtn: {
    backgroundColor: '#e8a44a',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  scanBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAll: {
    fontSize: 13,
    color: '#e8a44a',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 4,
  },
  chip: {
    backgroundColor: 'rgba(232,164,74,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232,164,74,0.25)',
    borderRadius: 30,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  chipText: {
    fontSize: 13,
    color: '#e8a44a',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  tabActive: {
    backgroundColor: '#e8a44a',
    borderColor: 'transparent',
  },
  tabText: {
    fontSize: 13,
    color: 'rgba(240,236,227,0.5)',
  },
  tabTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  recipeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  recipeEmoji: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(232,164,74,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(232,164,74,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f0ece3',
  },
  matchText: {
    fontSize: 12,
    color: '#e8a44a',
    fontWeight: '500',
  },
  recipeMeta: {
    fontSize: 12,
    color: 'rgba(240,236,227,0.5)',
  },
  matchBarBg: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  matchBar: {
    height: 3,
    backgroundColor: '#e8a44a',
    borderRadius: 2,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 14,
  },
  featureCard: {
    width: (Dimensions.get('window').width - 60) / 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(232,164,74,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(232,164,74,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f0ece3',
    marginBottom: 6,
  },
  featureDesc: {
    fontSize: 12,
    color: 'rgba(240,236,227,0.5)',
    lineHeight: 18,
  },
});