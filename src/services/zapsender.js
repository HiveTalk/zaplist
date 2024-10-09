import { SimplePool, nip19 } from 'https://esm.sh/nostr-tools@1.17.0';
import { corsProxy, defaultAvatar } from './constants.js';
import { convertToHexIfNpub } from './utils.js';

const pool = new SimplePool();

export async function getZapSenders(recipientPubkey, relays, startDate, endDate) {
  const sinceTimestamp = Math.floor(new Date(startDate).getTime() / 1000);
  const untilTimestamp = Math.floor(new Date(endDate).getTime() / 1000);

  const zapReceipts = await pool.list(relays, [
    {
      kinds: [9735],
      '#p': [recipientPubkey],
      since: sinceTimestamp,
      until: untilTimestamp
    }
  ]);

  const senderPubkeys = new Set();

  zapReceipts.forEach(receipt => {
    const senderTag = receipt.tags.find(tag => tag[0] === 'P');
    if (senderTag) {
      senderPubkeys.add(senderTag[1]);
    }
  });

  return Array.from(senderPubkeys);
}

export async function fetchZapSenders() {
  const pubkeyInput = document.getElementById('pubkeyInput');
  const relaysInput = document.getElementById('relaysInput');
  const dateRangeInput = document.getElementById('dateRangeInput');
  const resultsDiv = document.getElementById('results');
  const downloadImageBtn = document.getElementById('downloadImageBtn');
  const downloadAvatarsBtn = document.getElementById('downloadAvatarsBtn');
  const loadingIndicator = document.getElementById('loadingIndicator');

  let myPubkey = pubkeyInput.value.trim();
  const relays = relaysInput.value.split(',').map(relay => relay.trim());
  const [startDate, endDate] = dateRangeInput.value.split(' to ');

  resultsDiv.innerHTML = '';
  loadingIndicator.style.display = 'block';

  try {
    myPubkey = convertToHexIfNpub(myPubkey);
    const senderPubkeys = await getZapSenders(myPubkey, relays, startDate, endDate);
    const profiles = await getProfiles(senderPubkeys, relays);

    zapSendersResults = senderPubkeys.map(pubkey => {
      const profile = profiles[pubkey] || {};
      const npub = nip19.npubEncode(pubkey);
      const avatarUrl = profile.avatar || defaultAvatar;
      return { npub, name: profile.name || 'Unknown', avatarUrl };
    });

    let resultsHtml = '<div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">';
    for (const sender of zapSendersResults) {
      resultsHtml += `
      <a href="https://njump.me/${sender.npub}" target="_blank" style="text-decoration: none; color: inherit;">
        <div style="width: 80px; text-align: center;">
          <div class="avatar-container" style="width: 80px; height: 80px; border-radius: 50%; overflow: hidden;">
            <img src="${sender.avatarUrl}" alt="${sender.name}" 
                 style="width: 100%; height: 100%; object-fit: cover;"
                 onerror="this.onerror=null; this.src='${defaultAvatar}';">
          </div>
          <p style="margin: 5px 0; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${sender.name}</p>
        </div>
      </a>
    `;
    }
    resultsHtml += '</div>';

    resultsDiv.innerHTML = resultsHtml || 'No zap senders found.';
    downloadImageBtn.style.display = 'inline-block';
    downloadAvatarsBtn.style.display = 'inline-block';
  } catch (error) {
    resultsDiv.innerHTML = `Error: ${error.message}`;
  } finally {
    loadingIndicator.style.display = 'none';
  }
}
