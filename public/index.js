import { login, logout } from '/scripts/auth/auth.js';
import { fetchZapSenders } from '/scripts/services/zapsender.js';
import { updateUIAfterConnection, updateUIAfterDisconnection } from '/scripts/ui/ui.js';
import { connectWallet, disconnectWallet, payInvoice, getBalance, isWalletConnected } from '/scripts/services/wallet.js';
import { defaultAvatar, corsProxy } from '/scripts/utils/constants.js';
import { convertToHexIfNpub } from '/scripts/utils/utils.js';
import flatpickr from "https://cdn.jsdelivr.net/npm/flatpickr";

document.addEventListener('DOMContentLoaded', () => {
    // Initialize external plugins
    init({ appName: 'zaplist', filters: ["nwc"] });

    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const walletBtn = document.getElementById('walletBtn');
    const userProfile = document.getElementById('userProfile');
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    const userBanner = document.getElementById('userBanner');
    
    
    // Ensure to replace 'your-connection-uri-here' with an actual connection URI
    const connectionUri = 'wss://relay.damus.io'; // Use an actual, working relay URL
    
    loginBtn.addEventListener('click', (event) => {
        event.preventDefault();
        console.log('Login button clicked');
        login();
    });
    
    logoutBtn.addEventListener('click', async (event) => {
        event.preventDefault();
        try {
            await disconnectWallet();
            logout();
            updateUIAfterDisconnection();
        } catch (error) {
            console.error('Failed to disconnect:', error);
        }
    });

    walletBtn.addEventListener('click', async (event) => {
        event.preventDefault();
        console.log('Wallet button clicked');
        try {
            if (!isWalletConnected()) {
                await connectWallet(connectionUri);
                console.log('Wallet connected successfully');
            } else {
                await disconnectWallet();
                console.log('Wallet disconnected successfully');
            }
        } catch (error) {
            console.error('Wallet operation failed:', error);
        }
    });

    document.getElementById('downloadHtmlBtn').addEventListener('click', downloadHtmlResult);
    document.getElementById('downloadImageBtn').addEventListener('click', downloadImageResult);
    document.getElementById('downloadAvatarsBtn').addEventListener('click', downloadAvatars);
    document.getElementById('fetchButton').addEventListener('click', fetchZapSenders);

    // Initialize Flatpickr
    flatpickr("#dateRangeInput", {
        mode: "range",
        dateFormat: "Y-m-d",
        defaultDate: [new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), new Date()],
    });

    // Style for SweetAlert2 dark theme
    const style = document.createElement('style');
    style.textContent = `
        .swal-input-dark {
            width: 100% !important;
            color: #fff !important;
            background-color: #555 !important;
            border: 1px solid #777 !important;
        }
    `;
    document.head.appendChild(style);
});