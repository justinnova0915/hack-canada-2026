import React, { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';

import CustomNavBar from '../../components/CustomNavBar';
import { useAuth } from '@/context/AuthContext';
import { getUserReceipts } from '../../services/receiptService';
import { aggregateSpendStats } from '../../services/spendStats';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [monthlySpent, setMonthlySpent] = useState(0);
  const totalSpent = monthlySpent;
  const incomeValue = parseFloat(monthlyIncome) || 0;
  const progress = incomeValue > 0 ? Math.min(Math.max(totalSpent / incomeValue, 0), 1) : 0;
  const remaining = incomeValue - totalSpent;
  const hasIncome = incomeValue > 0;
  const spendRatio = hasIncome ? totalSpent / incomeValue : 0;
  const adviceText = !hasIncome
    ? 'Set your monthly income to get personalized budgeting advice.'
    : spendRatio < 0.5
      ? 'You are pacing well this month. Keep discretionary spending steady to stay under budget.'
      : spendRatio < 0.85
        ? 'You are in a healthy range. Review non-essential purchases weekly to protect your remaining budget.'
        : spendRatio <= 1
          ? 'You are close to your budget cap. Prioritize essentials for the rest of the month.'
          : 'You are over budget this month. Reduce variable expenses and plan a catch-up target next month.';
  const adviceToneStyle = !hasIncome
    ? styles.adviceNeutral
    : spendRatio <= 1
      ? styles.adviceGood
      : styles.adviceWarning;

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchData = async () => {
        if (!user) {
          if (isActive) setMonthlySpent(0);
          return;
        }

        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (isActive && userDoc.exists()) {
            const data = userDoc.data();
            if (data.budget !== undefined) {
              setMonthlyIncome(data.budget.toString());
            }
          }

          const receipts = await getUserReceipts(user.uid);
          const stats = aggregateSpendStats(receipts);
          if (isActive) {
            setMonthlySpent(stats.totals.monthly);
          }
        } catch (error) {
          console.error('Failed to fetch data', error);
          if (isActive) setMonthlySpent(0);
        }
      };

      fetchData();

      return () => {
        isActive = false;
      };
    }, [user])
  );

  const handleSaveIncome = async () => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { budget: parseFloat(monthlyIncome) || 0 }, { merge: true });
      Alert.alert('Saved', 'Monthly income updated!');
    } catch (error) {
      console.error('Failed to save income', error);
      Alert.alert('Error', 'Failed to save monthly income.');
    }
  };

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.sectionLabel}>ACCOUNT</Text>
            <Text style={styles.heroTitle}>Profile</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Name</Text>
              <Text style={styles.rowValue}>{user?.displayName || '—'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Email</Text>
              <Text style={styles.rowValue}>{user?.email || 'Not logged in'}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Monthly Income</Text>
            <Text style={styles.cardSubtitle}>Used to calculate spending vs budget</Text>

            <View style={styles.inputRow}>
              <Text style={styles.currency}>$</Text>
              <TextInput
                value={monthlyIncome}
                onChangeText={setMonthlyIncome}
                placeholder="0"
                placeholderTextColor="rgba(240,236,227,0.35)"
                keyboardType="numeric"
                style={styles.input}
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveIncome} activeOpacity={0.85}>
              <Text style={styles.saveButtonText}>Save Income</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Financials This Month</Text>
            {hasIncome ? (
              <>
                <Text style={styles.cardSubtitle}>
                  ${totalSpent.toFixed(2)} spent of ${incomeValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                </View>
                <Text style={[styles.remainingText, remaining >= 0 ? styles.remainingPositive : styles.remainingNegative]}>
                  ${Math.abs(remaining).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                  {remaining >= 0 ? 'remaining' : 'over budget'}
                </Text>
              </>
            ) : (
              <Text style={styles.insightMuted}>Set your monthly income to see insights</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Budgeting Advice</Text>
            <Text style={[styles.adviceText, adviceToneStyle]}>{adviceText}</Text>
          </View>

          <TouchableOpacity style={styles.logoutButton} onPress={signOut} activeOpacity={0.85}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <CustomNavBar />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
  content: {
    padding: 24,
    paddingTop: 64,
    paddingBottom: 120,
    gap: 16,
  },
  header: {
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    color: '#e8a44a',
    opacity: 0.9,
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#f0ece3',
    lineHeight: 40,
  },
  card: {
    backgroundColor: '#161b22',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  rowLabel: {
    color: 'rgba(240,236,227,0.65)',
    fontSize: 13,
    fontWeight: '600',
  },
  rowValue: {
    color: '#f0ece3',
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  cardTitle: {
    color: '#f0ece3',
    fontSize: 18,
    fontWeight: '800',
  },
  cardSubtitle: {
    color: 'rgba(240,236,227,0.55)',
    fontSize: 13,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(232,164,74,0.5)',
    backgroundColor: 'rgba(232,164,74,0.08)',
    paddingHorizontal: 12,
    height: 48,
    marginTop: 4,
  },
  currency: {
    color: '#e8a44a',
    fontSize: 20,
    fontWeight: '800',
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#f0ece3',
    fontSize: 18,
    fontWeight: '700',
    paddingVertical: 0,
  },
  saveButton: {
    marginTop: 6,
    backgroundColor: '#e8a44a',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  saveButtonText: {
    color: '#0d1117',
    fontSize: 14,
    fontWeight: '800',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    borderRadius: 999,
    backgroundColor: '#161b22',
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#e8a44a',
  },
  remainingText: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 6,
  },
  remainingPositive: {
    color: '#2ecc71',
  },
  remainingNegative: {
    color: '#c0392b',
  },
  insightMuted: {
    color: '#888',
    fontSize: 13,
  },
  adviceText: {
    fontSize: 13,
    lineHeight: 20,
  },
  adviceNeutral: {
    color: '#888',
  },
  adviceGood: {
    color: '#2ecc71',
  },
  adviceWarning: {
    color: '#c0392b',
  },
  logoutButton: {
    marginTop: 4,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#c0392b',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoutButtonText: {
    color: '#f0ece3',
    fontSize: 15,
    fontWeight: '800',
  },
});
