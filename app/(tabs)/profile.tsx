import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
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

import { useAuth } from '@/context/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import CustomNavBar from '../../components/CustomNavBar';
import { db } from '../../firebaseConfig';
import { getBudgetAdvice } from '../../services/budgetService';
import { getUserReceipts } from '../../services/receiptService';
import { aggregateSpendStats } from '../../services/spendStats';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [monthlySpent, setMonthlySpent] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState({ necessary: 0, miscellaneous: 0, recurring: 0 });
  const [budgetAdvice, setBudgetAdvice] = useState<any>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceError, setAdviceError] = useState('');
  const totalSpent = monthlySpent;
  const incomeValue = parseFloat(monthlyIncome) || 0;
  const progress = incomeValue > 0 ? Math.min(Math.max(totalSpent / incomeValue, 0), 1) : 0;
  const remaining = incomeValue - totalSpent;
  const hasIncome = incomeValue > 0;


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
            setMonthlyExpenses(stats.expenses.monthly);
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
            <Text style={styles.cardTitle}>🤖 AI Budget Advisor</Text>
            <Text style={styles.cardSubtitle}>Personalized advice powered by Gemini AI</Text>

            <TouchableOpacity
              style={[styles.adviceButton, (adviceLoading || !hasIncome) && { opacity: 0.6 }]}
              activeOpacity={0.85}
              disabled={adviceLoading || !hasIncome}
              onPress={async () => {
                setAdviceError('');
                setAdviceLoading(true);
                try {
                  const result = await getBudgetAdvice(incomeValue, monthlyExpenses);
                  setBudgetAdvice(result.data);
                } catch (e: any) {
                  setAdviceError(e.message || 'Failed to get advice.');
                } finally {
                  setAdviceLoading(false);
                }
              }}
            >
              {adviceLoading ? (
                <ActivityIndicator size="small" color="#0d1117" />
              ) : (
                <Text style={styles.adviceButtonText}>✨ Get AI Advice</Text>
              )}
            </TouchableOpacity>
            {!hasIncome && <Text style={styles.insightMuted}>Enter your income above first</Text>}
            {adviceError ? <Text style={styles.errorText}>{adviceError}</Text> : null}
          </View>

          {budgetAdvice && (
            <>
              {/* Score Card */}
              <View style={styles.card}>
                <View style={styles.scoreHeader}>
                  <View style={styles.scoreCircle}>
                    <Text style={styles.scoreValue}>{budgetAdvice.overallScore}</Text>
                    <Text style={styles.scoreOutOf}>/100</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={styles.scoreLabelText}>{budgetAdvice.scoreLabel}</Text>
                    <Text style={styles.scoreSummary}>{budgetAdvice.summary}</Text>
                  </View>
                </View>
              </View>

              {/* Recommended Budget Split */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>📊 Recommended Budget</Text>
                <Text style={styles.cardSubtitle}>AI-optimized allocation for your income</Text>

                <View style={styles.pieChartContainer}>
                  {[
                    { label: 'Necessary', pct: budgetAdvice.recommendedBudget.necessary, color: '#e8a44a', target: budgetAdvice.monthlyTarget.necessary },
                    { label: 'Miscellaneous', pct: budgetAdvice.recommendedBudget.miscellaneous, color: '#c9663c', target: budgetAdvice.monthlyTarget.miscellaneous },
                    { label: 'Recurring', pct: budgetAdvice.recommendedBudget.recurring, color: '#9c8166', target: budgetAdvice.monthlyTarget.recurring },
                    { label: 'Savings', pct: budgetAdvice.recommendedBudget.savings, color: '#4ade80', target: budgetAdvice.monthlyTarget.savings },
                  ].map((item, idx) => (
                    <View key={idx} style={styles.pieRow}>
                      <View style={styles.pieRowLeft}>
                        <View style={[styles.pieDot, { backgroundColor: item.color }]} />
                        <Text style={styles.pieLabel}>{item.label}</Text>
                      </View>
                      <View style={styles.pieRowRight}>
                        <View style={styles.pieBarBg}>
                          <View style={[styles.pieBarFill, { width: `${item.pct}%`, backgroundColor: item.color }]} />
                        </View>
                        <Text style={styles.piePct}>{item.pct}%</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.targetGrid}>
                  {[
                    { label: 'Necessary', amount: budgetAdvice.monthlyTarget.necessary, color: '#e8a44a' },
                    { label: 'Misc', amount: budgetAdvice.monthlyTarget.miscellaneous, color: '#c9663c' },
                    { label: 'Recurring', amount: budgetAdvice.monthlyTarget.recurring, color: '#9c8166' },
                    { label: 'Savings', amount: budgetAdvice.monthlyTarget.savings, color: '#4ade80' },
                  ].map((item, idx) => (
                    <View key={idx} style={styles.targetItem}>
                      <Text style={[styles.targetAmount, { color: item.color }]}>${item.amount}</Text>
                      <Text style={styles.targetLabel}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Tips */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>💡 Personalized Tips</Text>

                <View style={{ gap: 10 }}>
                  {budgetAdvice.tips?.map((tip: any, idx: number) => (
                    <View key={idx} style={styles.tipCard}>
                      <Text style={styles.tipIcon}>{tip.icon}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.tipTitle}>{tip.title}</Text>
                        <Text style={styles.tipDesc}>{tip.description}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}

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
  errorText: {
    color: '#ff6b6b',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  adviceButton: {
    backgroundColor: '#e8a44a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  adviceButtonText: {
    color: '#0d1117',
    fontSize: 15,
    fontWeight: '800',
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(232,164,74,0.12)',
    borderWidth: 3,
    borderColor: '#e8a44a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    color: '#e8a44a',
    fontSize: 24,
    fontWeight: '900',
  },
  scoreOutOf: {
    color: 'rgba(232,164,74,0.6)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: -3,
  },
  scoreLabelText: {
    color: '#e8a44a',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  scoreSummary: {
    color: 'rgba(240,236,227,0.7)',
    fontSize: 12,
    lineHeight: 18,
  },
  pieChartContainer: {
    gap: 12,
    marginBottom: 16,
  },
  pieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pieRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
  },
  pieDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  pieLabel: {
    color: '#f0ece3',
    fontSize: 12,
    fontWeight: '600',
  },
  pieRowRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pieBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  pieBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  piePct: {
    color: 'rgba(240,236,227,0.7)',
    fontSize: 12,
    fontWeight: '700',
    width: 36,
    textAlign: 'right',
  },
  targetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  targetItem: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  targetAmount: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  targetLabel: {
    color: 'rgba(240,236,227,0.5)',
    fontSize: 11,
    fontWeight: '600',
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  tipIcon: {
    fontSize: 22,
  },
  tipTitle: {
    color: '#f0ece3',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  tipDesc: {
    color: 'rgba(240,236,227,0.6)',
    fontSize: 12,
    lineHeight: 17,
  },
});
