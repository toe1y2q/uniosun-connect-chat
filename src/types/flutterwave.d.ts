
declare global {
  interface Window {
    FlutterwaveCheckout: (options: {
      public_key: string;
      tx_ref: string;
      amount: number;
      currency: string;
      customer: {
        email: string;
        phone_number?: string;
        name: string;
      };
      callback: (response: any) => void;
      onclose: () => void;
      customizations: {
        title: string;
        description: string;
        logo: string;
      };
      subaccounts?: Array<{
        id: string;
        transaction_split_ratio: number;
      }>;
    }) => void;
  }
}

export {};
