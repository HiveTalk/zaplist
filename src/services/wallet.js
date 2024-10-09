import { NostrWalletConnect } from './nip47.js';

let walletConnect = null;

export async function connectWallet(connectionUri) {
  console.log('Attempting to connect wallet with URI:', connectionUri);
  walletConnect = new NostrWalletConnect(connectionUri);
  try {
    await walletConnect.connect();
    console.log('Wallet connected successfully');
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
}

export async function disconnectWallet() {
  if (walletConnect) {
    await walletConnect.disconnect();
    walletConnect = null;
  }
}

export async function payInvoice(invoice, amount) {
  if (!walletConnect) {
    throw new Error('Wallet not connected');
  }
  return walletConnect.payInvoice(invoice, amount);
}

export async function getBalance() {
  if (!walletConnect) {
    throw new Error('Wallet not connected');
  }
  return walletConnect.getBalance();
}

export function isWalletConnected() {
  console.log('Checking wallet connection status:', walletConnect !== null);
  return walletConnect !== null;
}
