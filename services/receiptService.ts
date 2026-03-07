import { collection, addDoc, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export interface ReceiptData {
  merchant?: {
    name?: string;
    category?: string;
  };
  totals?: {
    gross?: number;
    subtotal?: number;
    tax?: number;
    tip?: number;
  };
  source?: {
    paymentMethod?: string;
    cardIdentifier?: string;
  };
  items?: Array<{ name: string; amount: number }>;
  location?: {
    address?: string;
  };
  imageUrl?: string;
  date?: string;
}

export const logReceipt = async (userId: string, receiptData: ReceiptData) => {
  try {
    const receiptsRef = collection(db, 'receipts');
    const docRef = await addDoc(receiptsRef, {
      userId,
      receiptData,
      createdAt: Timestamp.now(),
    });
    console.log('Document written with ID: ', docRef.id);
    return docRef.id;
  } catch (e) {
    console.error('Error adding document: ', e);
    throw e;
  }
};

export const getUserReceipts = async (userId: string) => {
  try {
    const receiptsRef = collection(db, 'receipts');
    const q = query(
      receiptsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const receipts: any[] = [];
    querySnapshot.forEach((doc) => {
      receipts.push({ id: doc.id, ...doc.data() });
    });
    return receipts;
  } catch (e) {
    console.error('Error fetching receipts: ', e);
    throw e;
  }
};
