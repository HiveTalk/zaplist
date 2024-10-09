import { nip19, getPublicKey, nip04 } from 'nostr-tools';
import { updateLoginState, updateUIAfterDisconnection } from './ui/ui.js';
import { getProfiles } from './auth/profiles.js';

let loggedInUser = null;

export async function login() {
  if (typeof window.nostr === 'undefined') {
    alert('Nostr extension not found. Please install a Nostr-compatible browser extension.');
    return;
  }

  try {
    const pubkey = await window.nostr.getPublicKey();
    loggedInUser = pubkey;
    updateLoginState();
    document.getElementById('pubkeyInput').value = pubkey;
    await fetchUserProfile(pubkey);
  } catch (error) {
    console.error('Error during login:', error);
    alert('Failed to login. Please try again.');
  }
}

export function logout() {
  loggedInUser = null;
  updateLoginState();
  document.getElementById('pubkeyInput').value = '';
  document.getElementById('userProfile').style.display = 'none';
  document.getElementById('pubkeyInputContainer').style.display = 'block';
  document.body.style.backgroundImage = 'none';
}

async function fetchUserProfile(pubkey) {
  const relays = document.getElementById('relaysInput').value.split(',').map(relay => relay.trim());
  const profiles = await getProfiles([pubkey], relays);
  const profile = profiles[pubkey] || {};

  const npub = nip19.npubEncode(pubkey);
  const avatarUrl = profile.avatar || '';

  document.getElementById('userBanner').src = profile.banner || '';
  document.getElementById('userAvatar').src = avatarUrl;
  document.getElementById('userName').textContent = profile.name || 'Unknown';
  document.getElementById('userProfile').style.display = 'block';
  document.getElementById('pubkeyInputContainer').style.display = 'none';
}

export { loggedInUser };