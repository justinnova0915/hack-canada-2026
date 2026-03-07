import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HistoryScreen() {
  const transactions = [
    { id: '1', merchant: 'Walmart', date: '2026-03-05', amount: 125.50, category: 'Necessary' },
    { id: '2', merchant: 'Uber', date: '2026-03-04', amount: 18.20, category: 'Transport' },
    { id: '3', merchant: 'Netflix', date: '2026-03-01', amount: 15.49, category: 'Recurring' },
    { id: '4', merchant: 'Starbucks', date: '2026-02-28', amount: 6.50, category: 'Food' },
    { id: '5', merchant: 'Rent', date: '2026-02-25', amount: 1200.00, category: 'Rent' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionLabel}>TRANSACTION HISTORY</Text>
      <Text style={styles.heroTitle}>Recent Logs</Text>

      <View style={styles.listContainer}>
        {transactions.map((tx) => (
          <View key={tx.id} style={styles.transactionCard}>
            <View style={styles.leftCol}>
              <View style={styles.iconBox}>
                <Text style={{ fontSize: 20 }}>💸</Text>
              </View>
              <View>
                <Text style={styles.merchantText}>{tx.merchant}</Text>
                <Text style={styles.dateText}>{tx.date}</Text>
              </View>
            </View>
            <View style={styles.rightCol}>
              <Text style={styles.amountText}>-${tx.amount.toFixed(2)}</Text>
              <Text style={styles.categoryText}>{tx.category}</Text>
            </View>
          </View>
        ))}
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
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#f0ece3',
    lineHeight: 40,
    marginBottom: 32,
  },
  listContainer: {
    gap: 16,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(232,164,74,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  merchantText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f0ece3',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: 'rgba(240,236,227,0.5)',
  },
  rightCol: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#e8a44a',
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 12,
    color: 'rgba(240,236,227,0.5)',
  },
});
