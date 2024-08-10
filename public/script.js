import { SimplePool, nip19 } from 'https://esm.sh/nostr-tools@1.17.0'

const pool = new SimplePool()

let flatpickrInstance;

// Function to initialize the date range picker
function initializeDatePicker() {
  flatpickrInstance = flatpickr("#dateRangeInput", {
    mode: "range",
    dateFormat: "Y-m-d",
    defaultDate: [new Date().fp_incr(-10), new Date()],
    onChange: function(selectedDates, dateStr, instance) {
      instance.element.value = dateStr;
    }
  });
}

// Function to fetch zap senders
async function fetchZapSenders() {
  const pubkey = document.getElementById('pubkeyInput').value;
  const relays = document.getElementById('relaysInput').value.split(',').map(r => r.trim());
  
  // Get the selected date range from Flatpickr
  const selectedDates = flatpickrInstance.selectedDates;

  if (selectedDates.length !== 2) {
    alert('Please select a date range');
    return;
  }

  const [startDate, endDate] = selectedDates;
  
  // Convert dates to timestamps (in seconds)
  const startTimestamp = Math.floor(startDate.getTime() / 1000);
  const endTimestamp = Math.floor(endDate.getTime() / 1000);

  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = 'Fetching zap senders...';

  try {
    const senderPubkeys = await getZapSenders(pubkey, relays, startTimestamp, endTimestamp);
    const profiles = await getProfiles(senderPubkeys, relays);
    displayResults(senderPubkeys, profiles);
  } catch (error) {
    resultsDiv.innerHTML = `Error: ${error.message}`;
  }
}

async function getZapSenders(recipientPubkey, relays, startTimestamp, endTimestamp) {
  const zapReceipts = await pool.list(relays, [
    {
      kinds: [9735],
      '#p': [recipientPubkey],
      since: startTimestamp,
      until: endTimestamp
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

async function getProfiles(pubkeys, relays) {
  const profiles = await pool.list(relays, [
    {
      kinds: [0],
      authors: pubkeys
    }
  ]);

  return profiles.reduce((acc, profile) => {
    const content = JSON.parse(profile.content);
    acc[profile.pubkey] = {
      name: content.name,
      avatar: content.picture
    };
    return acc;
  }, {});
}

// Function to display results
function displayResults(senderPubkeys, profiles) {
  const resultsDiv = document.getElementById('results');
  const defaultAvatar = "https://image.nostr.build/8a7acc13b5102c660a7974ebf57b11b613bb6862cf55196d624a09191ac6cc5f.jpg";

  let resultsHtml = '<div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">';
  for (const pubkey of senderPubkeys) {
    const profile = profiles[pubkey] || {};
    const npub = nip19.npubEncode(pubkey);
    const avatarUrl = profile.avatar || defaultAvatar;

    resultsHtml += `
    <a href="https://njump.me/${npub}" target="_blank" style="text-decoration: none; color: inherit;">
      <div style="width: 80px; text-align: center;">
        <div style="width: 80px; height: 80px; border-radius: 50%; overflow: hidden;">
          <img src="${avatarUrl}" alt="${profile.name || 'Unknown'}" 
               style="width: 100%; height: 100%; object-fit: cover;"
               onerror="this.onerror=null; this.src='${defaultAvatar}';"
               data-original-src="${avatarUrl}">
        </div>
        <p style="margin: 5px 0; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${profile.name || 'Unknown'}</p>
      </div>
    </a>
  `;
  }
  resultsHtml += '</div>';

  resultsDiv.innerHTML = resultsHtml || 'No zap senders found.';
}

// Function to download results as HTML
function downloadResults() {
  const resultsHtml = document.getElementById('results').innerHTML;
  const blob = new Blob([resultsHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'zap_senders_results.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  initializeDatePicker();
  document.getElementById('fetchButton').addEventListener('click', fetchZapSenders);
  document.getElementById('downloadBtn').addEventListener('click', downloadResults);
});
