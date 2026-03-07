import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function StatsScreen() {
  const expenses = {
    necessary: { current: 0, goal: 1500, color: '#e8a44a', label: 'Necessary' },
    miscellaneous: { current: 0, goal: 300, color: '#c9663c', label: 'Miscellaneous' },
    recurring: { current: 0, goal: 400, color: '#9c8166', label: 'Recurring' }
  };

  const cards: any[] = [];

  const totalCurrent = Object.values(expenses).reduce((acc, curr) => acc + curr.current, 0);
  const avgDaily = 0;
  const currentDaily = 0;
  const velocityIncrease = avgDaily > 0 ? ((currentDaily - avgDaily) / avgDaily * 100).toFixed(1) : '0.0';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionLabel}>SPENDING PULSE</Text>

      {/* Hero Summary Card */}
      <View style={styles.summaryCard}>
        <Text style={styles.totalValue}>${totalCurrent.toLocaleString()}</Text>
        <Text style={styles.totalSub}>Total Spent This Month</Text>
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
                 <Text style={styles.legendValue}>${data.current}</Text>
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

        <View style={styles.velocityTrend}>
            <Text style={styles.trendIcon}>➖</Text>
            <Text style={styles.trendText}>Not enough data to calculate trend.</Text>
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
                            <Text style={styles.creditCardAmount}>${card.amount}</Text>
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
  }
});