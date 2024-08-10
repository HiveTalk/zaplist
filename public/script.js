import { SimplePool, nip19 } from 'https://esm.sh/nostr-tools@1.17.0'

const pool = new SimplePool()

// Global variables
let currentUser = null;
const loginButton = document.getElementById('loginButton');
const logoutButton = document.getElementById('logoutButton');
const userInfo = document.getElementById('userInfo');
const userPubkey = document.getElementById('userPubkey');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');

// Function to check if NIP-07 extension is available
function isNostrExtensionAvailable() {
  return typeof window.nostr !== 'undefined';
}

// Login function using NIP-07
async function login() {
  if (!isNostrExtensionAvailable()) {
    alert('Nostr extension not found. Please install a NIP-07 compatible extension and try again.');
    return;
  }

  try {
    const pubkey = await window.nostr.getPublicKey();
    currentUser = { publicKey: pubkey };
    await updateUI();
  } catch (error) {
    console.error('Login failed:', error);
    alert('Login failed. Please make sure your Nostr extension is unlocked and try again.');
  }
}

// Logout function
function logout() {
  currentUser = null;
  updateUI();
}

// Update UI when user is logged in or out
async function updateUI() {
  if (currentUser) {
    userInfo.style.display = 'block';
    loginButton.style.display = 'none';
    logoutButton.style.display = 'inline-block';
    
    // Fetch user profile
    const userProfile = await getUserProfile(currentUser.publicKey);
    
    // Update UI with user information
    userAvatar.src = userProfile.picture || 'https://i.ibb.co/qCxs8Qk/image.png'; // Default avatar URL
    userName.textContent = userProfile.name || 'Unknown User';
    userPubkey.textContent = nip19.npubEncode(currentUser.publicKey);
  } else {
    userInfo.style.display = 'none';
    loginButton.style.display = 'inline-block';
    logoutButton.style.display = 'none';
  }
}

// Function to fetch user profile from a Nostr relay
async function getUserProfile(pubkey) {
  const relays = document.getElementById('relaysInput').value.split(',').map(relay => relay.trim());
  const profiles = await pool.list(relays, [
    {
      kinds: [0],
      authors: [pubkey]
    }
  ]);

  if (profiles.length > 0) {
    const content = JSON.parse(profiles[0].content);
    return {
      name: content.name || 'Unknown User',
      picture: content.picture || 'https://i.ibb.co/qCxs8Qk/image.png' // Default avatar URL
    };
  }

  return { name: 'Unknown User', picture: 'https://i.ibb.co/qCxs8Qk/image.png' };
}

// Function to get zap senders
async function getZapSenders(recipientPubkey, relays, timeRangeDays) {
  const sinceTimestamp = Math.floor(Date.now() / 1000) - (timeRangeDays * 24 * 60 * 60)
  
  const zapReceipts = await pool.list(relays, [
    {
      kinds: [9735],
      '#p': [recipientPubkey],
      since: sinceTimestamp
    }
  ])

  const senderPubkeys = new Set()
  
  zapReceipts.forEach(receipt => {
    const senderTag = receipt.tags.find(tag => tag[0] === 'P')
    if (senderTag) {
      senderPubkeys.add(senderTag[1])
    }
  })

  return Array.from(senderPubkeys)
}

// Function to get profiles
async function getProfiles(pubkeys, relays) {
  const profiles = await pool.list(relays, [
    {
      kinds: [0],
      authors: pubkeys
    }
  ])

  return profiles.reduce((acc, profile) => {
    const content = JSON.parse(profile.content)
    acc[profile.pubkey] = {
      name: content.name,
      avatar: content.picture
    }
    return acc
  }, {})
}

// Fetch Zap Senders function
async function fetchZapSenders() {
  const relaysInput = document.getElementById('relaysInput');
  const timeRangeInput = document.getElementById('timeRangeInput');
  const resultsDiv = document.getElementById('results');
  
  const myPubkey = currentUser ? currentUser.publicKey : null;
  if (!myPubkey) {
    alert('Please log in with your Nostr extension first.');
    return;
  }

  const relays = relaysInput.value.split(',').map(relay => relay.trim());
  const timeRangeDays = parseInt(timeRangeInput.value, 10);

  resultsDiv.innerHTML = 'Fetching zap senders...';

  try {
    const senderPubkeys = await getZapSenders(myPubkey, relays, timeRangeDays);
    const profiles = await getProfiles(senderPubkeys, relays);
    const defaultAvatar = "https://image.nostr.build/8a7acc13b5102c660a7974ebf57b11b613bb6862cf55196d624a09191ac6cc5f.jpg"

    let resultsHtml = '<div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">'
    for (const pubkey of senderPubkeys) {
      const profile = profiles[pubkey] || {}
      const npub = nip19.npubEncode(pubkey)
      const avatarUrl = profile.avatar || defaultAvatar

      resultsHtml += `
      <a href="https://njump.me/${npub}" target="_blank" style="text-decoration: none; color: inherit;">
        <div style="width: 80px; text-align: center;">
          <div style="width: 80px; height: 80px; border-radius: 50%; overflow: hidden;">
            <img src="${avatarUrl}" alt="${profile.name || 'Unknown'}" 
                 style="width: 100%; height: 100%; object-fit: cover;"
                 onerror="this.onerror=null; this.src='${defaultAvatar}';">
          </div>
          <p style="margin: 5px 0; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${profile.name || 'Unknown'}</p>
        </div>
      </a>
    `
    }
    resultsHtml += '</div>'

    resultsDiv.innerHTML = resultsHtml || 'No zap senders found.';
  } catch (error) {
    resultsDiv.innerHTML = `Error: ${error.message}`;
  }
}

// Event listeners
loginButton.addEventListener('click', login);
logoutButton.addEventListener('click', logout);
document.getElementById('fetchButton').addEventListener('click', fetchZapSenders);

// Initialize UI on page load
document.addEventListener('DOMContentLoaded', () => {
  updateUI();
  if (!isNostrExtensionAvailable()) {
    loginButton.textContent = 'Install Nostr Extension';
    loginButton.addEventListener('click', () => {
      window.open('https://github.com/nostr-protocol/nips/blob/master/07.md', '_blank');
    });
  }
});

// Function to download the content inside the <div id="result">
function downloadResult() {
  const resultDiv = document.getElementById('results');
  if (!resultDiv) {
    alert('Results section not found!');
    return;
  }
  const htmlContent = resultDiv.innerHTML;
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'result.html';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Add event listener to the download button
document.getElementById('downloadBtn').addEventListener('click', downloadResult);
