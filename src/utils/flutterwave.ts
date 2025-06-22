
// Flutterwave configuration and utilities
export const FLUTTERWAVE_CONFIG = {
  publicKey: 'FLWPUBK_TEST-SANDBOXDEMOKEY-X', // Replace with your actual public key
  baseUrl: 'https://api.flutterwave.com/v3',
  currency: 'NGN'
};

export interface FlutterwavePaymentData {
  amount: number;
  email: string;
  phone_number?: string;
  name: string;
  tx_ref: string;
  redirect_url: string;
  subaccounts?: Array<{
    id: string;
    transaction_split_ratio: number;
  }>;
}

export interface BankInfo {
  account_bank: string;
  account_number: string;
  account_name: string;
}

export const initializeFlutterwavePayment = (paymentData: FlutterwavePaymentData) => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.FlutterwaveCheckout) {
      reject(new Error('Flutterwave SDK not loaded'));
      return;
    }

    window.FlutterwaveCheckout({
      public_key: FLUTTERWAVE_CONFIG.publicKey,
      tx_ref: paymentData.tx_ref,
      amount: paymentData.amount,
      currency: FLUTTERWAVE_CONFIG.currency,
      customer: {
        email: paymentData.email,
        phone_number: paymentData.phone_number,
        name: paymentData.name,
      },
      callback: (response: any) => {
        resolve(response);
      },
      onclose: () => {
        reject(new Error('Payment cancelled'));
      },
      customizations: {
        title: 'UNIOSUN Connect',
        description: 'Session Payment',
        logo: '/favicon.ico',
      },
      subaccounts: paymentData.subaccounts,
    });
  });
};

export const generateTxRef = () => {
  return `UNIOSUN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
