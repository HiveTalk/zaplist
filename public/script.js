import { SimplePool, nip19 } from 'https://esm.sh/nostr-tools@1.17.0'

const pool = new SimplePool()

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
  const timeRangeInput = document.getElementById('timeRangeInput')
  const resultsDiv = document.getElementById('results')
  const downloadAvatarsBtn = document.getElementById('downloadAvatarsBtn')
  
  const myPubkey = pubkeyInput.value.trim()
  const relays = relaysInput.value.split(',').map(relay => relay.trim())
  const timeRangeDays = parseInt(timeRangeInput.value, 10)

  resultsDiv.innerHTML = 'Fetching zap senders...'

  try {
    const senderPubkeys = await getZapSenders(myPubkey, relays, timeRangeDays)
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
    downloadAvatarsBtn.style.display = 'none'
  }
}

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

// Function to download avatar images as a zip file
async function downloadAvatars() {
  const resultDiv = document.getElementById('results');
  if (!resultDiv) {
    alert('Results section not found!');
    return;
  }

  const images = resultDiv.querySelectorAll('img');
  const zip = new JSZip();

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const src = img.getAttribute('data-original-src');
    const alt = img.getAttribute('alt');
    
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      zip.file(`${alt || 'unknown'}_${i}.jpg`, blob);
    } catch (error) {
      console.error(`Failed to fetch image: ${src}`, error);
    }
  }

  zip.generateAsync({type:"blob"})
    .then(function(content) {
      saveAs(content, "avatars.zip");
    });
}

// Add event listeners to the buttons
document.getElementById('downloadBtn').addEventListener('click', downloadResult);
document.getElementById('fetchButton').addEventListener('click', fetchZapSenders);
document.getElementById('downloadAvatarsBtn').addEventListener('click', downloadAvatars);