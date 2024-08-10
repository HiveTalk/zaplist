import { SimplePool, nip19 } from 'https://esm.sh/nostr-tools@1.17.0'

const pool = new SimplePool()

async function getZapSenders(recipientPubkey, relays, startTimestamp, endTimestamp) {
  const zapReceipts = await pool.list(relays, [
    {
      kinds: [9735],
      '#p': [recipientPubkey],
      since: startTimestamp,
      until: endTimestamp
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
  
  const myPubkey = pubkeyInput.value.trim()
  const relays = relaysInput.value.split(',').map(relay => relay.trim())
  const dateRange = dateRangeInput.value.split(' to ')

  if (dateRange.length !== 2) {
    resultsDiv.innerHTML = 'Please select a valid date range.'
    return
  }

  const startDate = new Date(dateRange[0])
  const endDate = new Date(dateRange[1])
  const startTimestamp = Math.floor(startDate.getTime() / 1000)
  const endTimestamp = Math.floor(endDate.getTime() / 1000)

  resultsDiv.innerHTML = 'Fetching zap senders...'

  try {
    const senderPubkeys = await getZapSenders(myPubkey, relays, startTimestamp, endTimestamp)
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
                 onerror="this.onerror=null; this.src='${defaultAvatar}';"
                 data-original-src="${avatarUrl}">
          </div>
          <p style="margin: 5px 0; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${profile.name || 'Unknown'}</p>
        </div>
      </a>
    `
    }
    resultsHtml += '</div>'

    resultsDiv.innerHTML = resultsHtml || 'No zap senders found.'
  } catch (error) {
    resultsDiv.innerHTML = `Error: ${error.message}`
  }
}

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

document.addEventListener('DOMContentLoaded', () => {
  flatpickr("#dateRangeInput", {
    mode: "range",
    dateFormat: "Y-m-d",
    defaultDate: [new Date().fp_incr(-10), new Date()],
  });

  document.getElementById('downloadBtn').addEventListener('click', downloadResult);
  document.getElementById('fetchButton').addEventListener('click', fetchZapSenders);
});
