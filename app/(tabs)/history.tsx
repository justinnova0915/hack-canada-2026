import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HistoryScreen() {
  const transactions: any[] = [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionLabel}>PAPER TRAIL</Text>
      <Text style={styles.heroTitle}>Digital Ledger</Text>
      
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <Text style={styles.searchPlaceholder}>Search by merchant, category, or amount...</Text>
      </View>

      <View style={styles.listContainer}>
        {transactions.length > 0 ? (
          transactions.map((tx) => (
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
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptyDesc}>Snap a receipt on the home tab to start logging.</Text>
          </View>
        )}
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
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  searchPlaceholder: {
    color: 'rgba(240,236,227,0.4)',
    fontSize: 14,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.8,
  },
  emptyTitle: {
    color: '#f0ece3',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyDesc: {
    color: 'rgba(240,236,227,0.5)',
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 240,
  }
});
