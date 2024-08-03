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
  
  const myPubkey = pubkeyInput.value.trim()
  const relays = relaysInput.value.split(',').map(relay => relay.trim())
  const timeRangeDays = parseInt(timeRangeInput.value, 10)

  resultsDiv.innerHTML = 'Fetching zap senders...'

  try {
    const senderPubkeys = await getZapSenders(myPubkey, relays, timeRangeDays)
    const profiles = await getProfiles(senderPubkeys, relays)

    let resultsHtml = '<div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">'
    senderPubkeys.forEach(pubkey => {
      const profile = profiles[pubkey] || {}
      const npub = nip19.npubEncode(pubkey)
      const avatarUrl = profile.avatar || 'images/nostr.png'
      
      resultsHtml += `
      <a href="https://njump.me/${npub}" target="_blank" style="text-decoration: none; color: inherit;">
        <div style="width: 80px; text-align: center;">
          <div style="width: 80px; height: 80px; border-radius: 50%; overflow: hidden;">
            <img src="${avatarUrl}" alt="${profile.name || 'Unknown'}" 
                 style="width: 100%; height: 100%; object-fit: cover;"
                 onerror="this.onerror=null; this.src='images/nostr.png';"
                 data-original-src="${avatarUrl}">
          </div>
          <p style="margin: 5px 0; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${profile.name || 'Unknown'}</p>
        </div>
      </a>
    `

    })
    resultsHtml += '</div>'

    resultsDiv.innerHTML = resultsHtml || 'No zap senders found.'
  } catch (error) {
    resultsDiv.innerHTML = `Error: ${error.message}`
  }
}

document.getElementById('fetchButton').addEventListener('click', fetchZapSenders)

