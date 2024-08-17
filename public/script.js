import { SimplePool, nip19 } from 'https://esm.sh/nostr-tools@1.17.0'

const pool = new SimplePool()

let loggedInUser = null
const cachedAvatars = new Map()

function convertToHexIfNpub(pubkey) {
  if (pubkey.startsWith('npub')) {
    try {
      const { type, data } = nip19.decode(pubkey)
      if (type === 'npub') {
        return data
      }
    } catch (error) {
      throw new Error('Invalid npub')
    }
  }
  return pubkey
}

async function getZapSenders(recipientPubkey, relays, startDate, endDate) {
  const sinceTimestamp = Math.floor(new Date(startDate).getTime() / 1000)
  const untilTimestamp = Math.floor(new Date(endDate).getTime() / 1000)
  
  const zapReceipts = await pool.list(relays, [
    {
      kinds: [9735],
      '#p': [recipientPubkey],
      since: sinceTimestamp,
      until: untilTimestamp
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
      avatar: content.picture,
      banner: content.banner
    }
    return acc
  }, {})
}

async function fetchZapSenders() {
  const pubkeyInput = document.getElementById('pubkeyInput')
  const relaysInput = document.getElementById('relaysInput')
  const dateRangeInput = document.getElementById('dateRangeInput')
  const resultsDiv = document.getElementById('results')
  const downloadImageBtn = document.getElementById('downloadImageBtn')
  
  let myPubkey = pubkeyInput.value.trim()
  const relays = relaysInput.value.split(',').map(relay => relay.trim())
  const [startDate, endDate] = dateRangeInput.value.split(' to ')

  resultsDiv.innerHTML = 'Fetching zap senders...'

  try {
    myPubkey = convertToHexIfNpub(myPubkey)
    const senderPubkeys = await getZapSenders(myPubkey, relays, startDate, endDate)
    const profiles = await getProfiles(senderPubkeys, relays)
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

    resultsDiv.innerHTML = resultsHtml || 'No zap senders found.'
    downloadImageBtn.style.display = 'inline-block'
  } catch (error) {
    resultsDiv.innerHTML = `Error: ${error.message}`
  }
}

async function downloadImageResult() {
  try {
    const fetchButton = document.getElementById('fetchButton');
    const downloadImageBtn = document.getElementById('downloadImageBtn');
    const resultDiv = document.getElementById('results');
    
    // Create a container for the snapshot
    const snapshotContainer = document.createElement('div');
    snapshotContainer.style.position = 'absolute';
    snapshotContainer.style.left = '-9999px';
    snapshotContainer.style.width = resultDiv.offsetWidth + 'px';
    document.body.appendChild(snapshotContainer);

    // Clone the content between the buttons
    const clone = document.createElement('div');
    clone.innerHTML = resultDiv.innerHTML;
    snapshotContainer.appendChild(clone);

    // Capture the snapshot
    const canvas = await html2canvas(snapshotContainer, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: window.getComputedStyle(document.body).backgroundColor,
      width: resultDiv.offsetWidth,
      height: snapshotContainer.offsetHeight,
      scrollY: -window.scrollY
    });

    // Remove the temporary container
    document.body.removeChild(snapshotContainer);

    // Create download link
    const link = document.createElement('a');
    link.download = 'zaplist_result.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (err) {
    console.error("Error: " + err);
    alert("An error occurred while generating the image. Please try again.");
  }
}

async function login() {
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

function logout() {
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

  // Set the banner as the background image
  if (profile.banner) {
    document.body.style.backgroundImage = `url(${profile.banner})`;
  }
}

function updateLoginState() {
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const zapLink = document.getElementById('zap');

  if (loggedInUser) {
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    zapLink.innerHTML = '⚡️ Zap';
  } else {
    loginBtn.style.display = 'inline-block';
    logoutBtn.style.display = 'none';
    zapLink.innerHTML = '⚡️ Zap';
  }
}

// Initialize Flatpickr
flatpickr("#dateRangeInput", {
  mode: "range",
  dateFormat: "Y-m-d",
  defaultDate: [new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), new Date()],
});

// Add event listeners to the buttons
document.getElementById('downloadImageBtn').addEventListener('click', downloadImageResult);
document.getElementById('fetchButton').addEventListener('click', fetchZapSenders);
document.getElementById('loginBtn').addEventListener('click', login);
document.getElementById('logoutBtn').addEventListener('click', logout);

// Initialize login state
updateLoginState();