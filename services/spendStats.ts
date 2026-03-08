import type { ReceiptData } from './receiptService';

export type ExpenseKey = 'necessary' | 'miscellaneous' | 'recurring';

export interface CardStat {
  amount: number;
  name: string;
  last4: string | null;
  color: string;
}

export interface SpendStats {
  totals: {
    allTime: number;
    monthly: number;
  };
  expenses: {
    allTime: Record<ExpenseKey, number>;
    monthly: Record<ExpenseKey, number>;
  };
  cards: {
    allTime: CardStat[];
    monthly: CardStat[];
  };
  velocity: {
    today: number;
    avg30Days: number;
  };
}

interface ReceiptDoc {
  id: string;
  receiptData?: ReceiptData;
  createdAt?: { toDate?: () => Date };
}

const CARD_COLORS = ['#e8a44a', '#c9663c', '#9c8166', '#5c6d70', '#837b7d'];

const createExpenseTotals = (): Record<ExpenseKey, number> => ({
  necessary: 0,
  miscellaneous: 0,
  recurring: 0,
});

function classifyCategory(category: string): ExpenseKey {
  const normalized = category.toLowerCase();

  if (
    normalized.includes('grocer') ||
    normalized.includes('supermarket') ||
    normalized.includes('food') ||
    normalized.includes('transit') ||
    normalized.includes('health') ||
    normalized.includes('gas') ||
    normalized.includes('pharmacy') ||
    normalized.includes('restaurant')
  ) {
    return 'necessary';
  }

  if (
    normalized.includes('subscript') ||
    normalized.includes('insur') ||
    normalized.includes('phone') ||
    normalized.includes('internet') ||
    normalized.includes('utilit')
  ) {
    return 'recurring';
  }

  return 'miscellaneous';
}

function resolveReceiptDate(receipt: ReceiptDoc): Date | null {
  const rawDate = receipt.receiptData?.date;
  if (rawDate) {
    const parsed = new Date(rawDate);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  const createdAtDate = receipt.createdAt?.toDate?.();
  if (createdAtDate && !isNaN(createdAtDate.getTime())) return createdAtDate;

  return null;
}

function addToCardMap(
  map: Record<string, CardStat>,
  cardKey: string,
  name: string,
  amount: number,
  last4: string | null
) {
  if (!map[cardKey]) {
    map[cardKey] = {
      amount: 0,
      name,
      last4,
      color: CARD_COLORS[Object.keys(map).length % CARD_COLORS.length],
    };
  }
  map[cardKey].amount += amount;
}

function toRoundedCards(map: Record<string, CardStat>): CardStat[] {
  return Object.values(map)
    .sort((a, b) => b.amount - a.amount)
    .map((c) => ({ ...c, amount: Math.round(c.amount * 100) / 100 }));
}

export function aggregateSpendStats(receipts: ReceiptDoc[]): SpendStats {
  const now = new Date();
  const todayString = now.toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const allTimeExpenses = createExpenseTotals();
  const monthlyExpenses = createExpenseTotals();
  const allTimeCardsMap: Record<string, CardStat> = {};
  const monthlyCardsMap: Record<string, CardStat> = {};

  let todayTotal = 0;
  let last30DaysTotal = 0;

  receipts.forEach((receipt) => {
    const data = receipt.receiptData || {};
    const amount = Number(data.totals?.gross || 0);
    if (!amount || amount <= 0) return;

    const bucket = classifyCategory(data.merchant?.category || 'Misc');
    allTimeExpenses[bucket] += amount;

    const receiptDate = resolveReceiptDate(receipt);
    const isCurrentMonth =
      !!receiptDate &&
      receiptDate.getMonth() === currentMonth &&
      receiptDate.getFullYear() === currentYear;

    if (isCurrentMonth) {
      monthlyExpenses[bucket] += amount;
    }

    if (receiptDate) {
      if (receiptDate.toISOString().split('T')[0] === todayString) {
        todayTotal += amount;
      }
      if (receiptDate >= thirtyDaysAgo) {
        last30DaysTotal += amount;
      }
    }

    const cardIdentifier = data.source?.cardIdentifier;
    const paymentMethod = data.source?.paymentMethod || 'Other Payments';

    if (cardIdentifier) {
      addToCardMap(allTimeCardsMap, cardIdentifier, paymentMethod, amount, cardIdentifier.slice(-4));
      if (isCurrentMonth) {
        addToCardMap(monthlyCardsMap, cardIdentifier, paymentMethod, amount, cardIdentifier.slice(-4));
      }
      return;
    }

    if (paymentMethod) {
      addToCardMap(allTimeCardsMap, paymentMethod, paymentMethod, amount, null);
      if (isCurrentMonth) {
        addToCardMap(monthlyCardsMap, paymentMethod, paymentMethod, amount, null);
      }
    }
  });

  const allTimeTotal = allTimeExpenses.necessary + allTimeExpenses.miscellaneous + allTimeExpenses.recurring;
  const monthlyTotal = monthlyExpenses.necessary + monthlyExpenses.miscellaneous + monthlyExpenses.recurring;

  return {
    totals: {
      allTime: Math.round(allTimeTotal * 100) / 100,
      monthly: Math.round(monthlyTotal * 100) / 100,
    },
    expenses: {
      allTime: {
        necessary: Math.round(allTimeExpenses.necessary * 100) / 100,
        miscellaneous: Math.round(allTimeExpenses.miscellaneous * 100) / 100,
        recurring: Math.round(allTimeExpenses.recurring * 100) / 100,
      },
      monthly: {
        necessary: Math.round(monthlyExpenses.necessary * 100) / 100,
        miscellaneous: Math.round(monthlyExpenses.miscellaneous * 100) / 100,
        recurring: Math.round(monthlyExpenses.recurring * 100) / 100,
      },
    },
    cards: {
      allTime: toRoundedCards(allTimeCardsMap),
      monthly: toRoundedCards(monthlyCardsMap),
    },
    velocity: {
      today: Math.round(todayTotal * 100) / 100,
      avg30Days: Math.round((last30DaysTotal / 30) * 100) / 100,
    },
  };
}
