import { collection, addDoc, query, where, getDocs, orderBy, Timestamp, doc, deleteDoc } from 'firebase/firestore';
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
    const receiptsRef = collection(db, 'users', userId, 'receipts');
    const docRef = await addDoc(receiptsRef, {
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
    const receiptsRef = collection(db, 'users', userId, 'receipts');
    const q = query(
      receiptsRef,
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

export const deleteReceipt = async (userId: string, receiptId: string) => {
  try {
    const docRef = doc(db, 'users', userId, 'receipts', receiptId);
    await deleteDoc(docRef);
  } catch (e) {
    console.error('Error deleting document: ', e);
    throw e;
  }
};
