/// <reference types="vite/client" />

declare module '@mercadopago/sdk-react' {
  export function initMercadoPago(publicKey: string, options?: any): void;
  export const Wallet: React.ComponentType<{
    initialization: {
      preferenceId: string;
    };
    customization?: {
      texts?: {
        action?: 'pay' | 'buy';
      };
    };
  }>;
}
