import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CustomNavBar from '../../components/CustomNavBar';
import { useAuth } from '../../context/AuthContext';
import { getUserReceipts } from '../../services/receiptService';
import { aggregateSpendStats } from '../../services/spendStats';

type PeriodMode = 'monthly' | 'allTime';

const createExpenseBuckets = () => ({
  necessary: { current: 0, goal: 1500, color: '#e8a44a', label: 'Necessary' },
  miscellaneous: { current: 0, goal: 300, color: '#c9663c', label: 'Miscellaneous' },
  recurring: { current: 0, goal: 400, color: '#9c8166', label: 'Recurring' }
});

export default function StatsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [periodMode, setPeriodMode] = useState<PeriodMode>('monthly');
  const [monthlyExpenses, setMonthlyExpenses] = useState(createExpenseBuckets());
  const [allTimeExpenses, setAllTimeExpenses] = useState(createExpenseBuckets());
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [allTimeTotal, setAllTimeTotal] = useState(0);
  const [monthlyCards, setMonthlyCards] = useState<any[]>([]);
  const [allTimeCards, setAllTimeCards] = useState<any[]>([]);
  const [avgDaily, setAvgDaily] = useState(0);
  const [currentDaily, setCurrentDaily] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchStats = async () => {
        if (!user) {
          if (isActive) setLoading(false);
          return;
        }

        try {
          if (isActive) setLoading(true);
          const receipts = await getUserReceipts(user.uid);

          if (!isActive) return;

          const computedStats = aggregateSpendStats(receipts);

          setAllTimeExpenses(prev => ({
            necessary: { ...prev.necessary, current: computedStats.expenses.allTime.necessary },
            miscellaneous: { ...prev.miscellaneous, current: computedStats.expenses.allTime.miscellaneous },
            recurring: { ...prev.recurring, current: computedStats.expenses.allTime.recurring }
          }));

          setMonthlyExpenses(prev => ({
            necessary: { ...prev.necessary, current: computedStats.expenses.monthly.necessary },
            miscellaneous: { ...prev.miscellaneous, current: computedStats.expenses.monthly.miscellaneous },
            recurring: { ...prev.recurring, current: computedStats.expenses.monthly.recurring }
          }));

          setAllTimeTotal(computedStats.totals.allTime);
          setMonthlyTotal(computedStats.totals.monthly);
          setCurrentDaily(computedStats.velocity.today);
          setAvgDaily(computedStats.velocity.avg30Days);
          setAllTimeCards(computedStats.cards.allTime);
          setMonthlyCards(computedStats.cards.monthly);

        } catch (error) {
          console.error('Failed to fetch stats', error);
        } finally {
          if (isActive) setLoading(false);
        }
      };

      fetchStats();

      return () => {
        isActive = false;
      };
    }, [user])
  );

  const velocityIncrease = avgDaily > 0 ? ((currentDaily - avgDaily) / avgDaily * 100).toFixed(1) : '0.0';
  const velocityTrendIcon = currentDaily > avgDaily ? '📈' : '📉';
  const velocityTrendColor = currentDaily > avgDaily ? 'rgba(255, 107, 107, 0.1)' : 'rgba(107, 255, 150, 0.1)';
  const velocityTrendText = avgDaily === 0 ? "Not enough data to calculate trend." : `You are spending ${Math.abs(Number(velocityIncrease))}% ${currentDaily > avgDaily ? 'more' : 'less'} than your 30-day average.`;
  const expenses = periodMode === 'monthly' ? monthlyExpenses : allTimeExpenses;
  const totalCurrent = periodMode === 'monthly' ? monthlyTotal : allTimeTotal;
  const cards = periodMode === 'monthly' ? monthlyCards : allTimeCards;
  const monthLabel = new Date().toLocaleString('en-US', {
  month: 'long',
  year: 'numeric',
});

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#e8a44a" />
      </View>
    );
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: 120 }]}>
        <Text style={styles.sectionLabel}>SPENDING PULSE</Text>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleButton, periodMode === 'monthly' && styles.toggleButtonActive]}
            onPress={() => setPeriodMode('monthly')}
            activeOpacity={0.85}
          >
            <Text style={[styles.toggleText, periodMode === 'monthly' && styles.toggleTextActive]}>Monthly</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, periodMode === 'allTime' && styles.toggleButtonActive]}
            onPress={() => setPeriodMode('allTime')}
            activeOpacity={0.85}
          >
            <Text style={[styles.toggleText, periodMode === 'allTime' && styles.toggleTextActive]}>All Time</Text>
          </TouchableOpacity>
        </View>

        {periodMode === 'monthly' && (
        <Text style={styles.periodHint}>{monthLabel} (Month to Date)</Text>)}


        {/* Hero Summary Card */}
        <View style={styles.summaryCard}>
          
          <Text style={styles.totalValue}>${totalCurrent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          <Text style={styles.totalSub}>{periodMode === 'monthly' ? 'Total Spent This Month' : 'Total Spent (All Time)'}</Text>
        </View>

        {/* The Big Three breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>The Big Three</Text>
          <Text style={styles.cardSubtitle}>Categorical split of your expenses</Text>

          <View style={styles.compositionBar}>
            {totalCurrent === 0 ? (
              <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.05)' }} />
            ) : (
              Object.entries(expenses).map(([key, data]) => (
                <View
                  key={key}
                  style={{
                    flex: data.current,
                    backgroundColor: data.color,
                    height: '100%'
                  }}
                />
              ))
            )}
          </View>

          <View style={styles.legendContainer}>
            {Object.entries(expenses).map(([key, data]) => (
              <View key={key} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: data.color }]} />
                <Text style={styles.legendLabel}>{data.label}</Text>
                <Text style={styles.legendValue}>${data.current.toFixed(2)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Spending Velocity */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Spending Velocity</Text>
          <Text style={styles.cardSubtitle}>Current daily vs 30-day average</Text>

          <View style={styles.velocityRow}>
            <View style={styles.velocityStat}>
              <Text style={styles.velocityValue}>${currentDaily.toFixed(2)}</Text>
              <Text style={styles.velocityLabel}>Today</Text>
            </View>
            <View style={styles.velocityDivider} />
            <View style={styles.velocityStat}>
              <Text style={styles.velocityValue}>${avgDaily.toFixed(2)}</Text>
              <Text style={styles.velocityLabel}>30d Avg</Text>
            </View>
          </View>

          <View style={[styles.velocityTrend, { backgroundColor: avgDaily > 0 ? velocityTrendColor : 'rgba(255, 107, 107, 0.1)' }]}>
            <Text style={styles.trendIcon}>{avgDaily > 0 ? velocityTrendIcon : '➖'}</Text>
            <Text style={styles.trendText}>{velocityTrendText}</Text>
          </View>
        </View>

        {/* Card Distribution */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Card Distribution</Text>
          <Text style={styles.cardSubtitle}>Where your money is drawn from</Text>

          <View style={styles.cardList}>
            {cards.length > 0 ? cards.map((card, idx) => {
              const percentage = totalCurrent > 0 ? ((card.amount / totalCurrent) * 100).toFixed(1) : '0.0';
              return (
                <View key={idx} style={styles.creditCardRow}>
                  <View style={styles.creditCardInfo}>
                    <View style={[styles.cardColorIndicator, { backgroundColor: card.color }]} />
                    <View>
                      <Text style={styles.creditCardName}>{card.name}</Text>
                      <Text style={styles.creditCardLast4}>**** {card.last4}</Text>
                    </View>
                  </View>
                  <View style={styles.creditCardStats}>
                    <Text style={styles.creditCardAmount}>${card.amount.toFixed(2)}</Text>
                    <Text style={styles.creditCardPercent}>{percentage}%</Text>
                  </View>
                </View>
              );
            }) : (
              <Text style={{ color: 'rgba(240,236,227,0.5)', fontSize: 13, fontStyle: 'italic', textAlign: 'center', paddingVertical: 10 }}>No cards linked or parsed yet.</Text>
            )}
          </View>
        </View>

      </ScrollView>
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
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    color: '#e8a44a',
    opacity: 0.8,
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 4,
    marginBottom: 16,
    gap: 8,
  },
  toggleButton: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#e8a44a',
  },
  toggleText: {
    color: 'rgba(240,236,227,0.75)',
    fontSize: 13,
    fontWeight: '700',
  },
  toggleTextActive: {
    color: '#0d1117',
  },
  totalValue: {
    color: '#f0ece3',
    fontSize: 42,
    fontWeight: '900',
  },
  totalSub: {
    color: 'rgba(240,236,227,0.5)',
    fontSize: 14,
    marginTop: 4,
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardTitle: {
    color: '#f0ece3',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    color: 'rgba(240,236,227,0.5)',
    fontSize: 13,
    marginBottom: 20,
  },

  compositionBar: {
    height: 16,
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginBottom: 20,
  },
  legendContainer: {
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    color: '#f0ece3',
    fontSize: 15,
    flex: 1,
  },
  legendValue: {
    color: '#e8a44a',
    fontSize: 15,
    fontWeight: '600',
  },

  velocityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
  },
  velocityStat: {
    alignItems: 'center',
  },
  velocityValue: {
    color: '#f0ece3',
    fontSize: 24,
    fontWeight: '800',
  },
  velocityLabel: {
    color: 'rgba(240,236,227,0.5)',
    fontSize: 13,
    marginTop: 4,
  },
  velocityDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  velocityTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  trendIcon: {
    fontSize: 20,
  },
  trendText: {
    color: 'rgba(240,236,227,0.8)',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },

  cardList: {
    gap: 16,
  },
  creditCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
  },
  creditCardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardColorIndicator: {
    width: 32,
    height: 24,
    borderRadius: 4,
  },
  creditCardName: {
    color: '#f0ece3',
    fontSize: 15,
    fontWeight: '600',
  },
  creditCardLast4: {
    color: 'rgba(240,236,227,0.5)',
    fontSize: 12,
    marginTop: 2,
  },
  creditCardStats: {
    alignItems: 'flex-end',
  },
  creditCardAmount: {
    color: '#f0ece3',
    fontSize: 16,
    fontWeight: '700',
  },
  creditCardPercent: {
    color: 'rgba(240,236,227,0.5)',
    fontSize: 12,
    marginTop: 2,
  },
  periodHint: {
    color: 'rgba(240,236,227,0.65)',
    fontSize: 12,
    marginBottom: 12,
    marginTop: -4,
  },
});
