import { SimplePool, nip19 } from 'https://esm.sh/nostr-tools@1.17.0'

const pool = new SimplePool()

let loggedInUser = null

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
      avatar: content.picture
    }
    return acc
  }, {})
}

async function fetchZapSenders() {
  const pubkeyInput = document.getElementById('pubkeyInput')
  const relaysInput = document.getElementById('relaysInput')
  const dateRangeInput = document.getElementById('dateRangeInput')
  const resultsDiv = document.getElementById('results')
  const downloadAvatarsBtn = document.getElementById('downloadAvatarsBtn')
  
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
      const localAvatarUrl = avatarUrl

      resultsHtml += `
      <a href="https://njump.me/${npub}" target="_blank" style="text-decoration: none; color: inherit;">
        <div style="width: 80px; text-align: center;">
          <div style="width: 80px; height: 80px; border-radius: 50%; overflow: hidden;">
            <img src="${localAvatarUrl}" alt="${profile.name || 'Unknown'}" 
                 style="width: 100%; height: 100%; object-fit: cover;"
                 onerror="this.onerror=null; this.src='${defaultAvatar}';"
                 data-original-src="${localAvatarUrl}">
          </div>
          <p style="margin: 5px 0; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${profile.name || 'Unknown'}</p>
        </div>
      </a>
    `
    }
    resultsHtml += '</div>'

    resultsDiv.innerHTML = resultsHtml || 'No zap senders found.'
    downloadAvatarsBtn.style.display = 'inline-block'
  } catch (error) {
    resultsDiv.innerHTML = `Error: ${error.message}`
  }
}

// Function to download the content inside the <div id="result">
function downloadHtmlResult() {
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

async function downloadImageResult() {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({ preferCurrentTab: true });
    const video = document.createElement('video');
    video.srcObject = stream;
    await video.play();

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    stream.getTracks().forEach(track => track.stop());

    const link = document.createElement('a');
    link.download = 'zaplist_result.png';
    link.href = canvas.toDataURL();
    link.click();
  } catch (err) {
    console.error("Error: " + err);
  }
}

async function downloadAvatars() {
  const resultDiv = document.getElementById('results');
  const images = resultDiv.querySelectorAll('img');
  const zip = new JSZip();

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const response = await fetch(img.getAttribute('data-original-src'));
    const blob = await response.blob();
    zip.file(`avatar_${i + 1}.jpg`, blob);
  }

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, "avatars.zip");
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
  } catch (error) {
    console.error('Error during login:', error);
    alert('Failed to login. Please try again.');
  }
}

function logout() {
  loggedInUser = null;
  updateLoginState();
  document.getElementById('pubkeyInput').value = '';
}

function updateLoginState() {
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const zapLink = document.getElementById('zap');

  if (loggedInUser) {
    loginBtn.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
    zapLink.innerHTML = `<img src="https://api.dicebear.com/6.x/identicon/svg?seed=${loggedInUser}" alt="User Avatar" style="width: 20px; height: 20px; border-radius: 50%; margin-right: 5px;"> ⚡️ Zap`;
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
document.getElementById('downloadHtmlBtn').addEventListener('click', downloadHtmlResult);
document.getElementById('downloadImageBtn').addEventListener('click', downloadImageResult);
document.getElementById('downloadAvatarsBtn').addEventListener('click', downloadAvatars);
document.getElementById('fetchButton').addEventListener('click', fetchZapSenders);
document.getElementById('loginBtn').addEventListener('click', login);
document.getElementById('logoutBtn').addEventListener('click', logout);

// Initialize login state
updateLoginState();