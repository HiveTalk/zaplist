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
    const defaultAvatar = "https://image.nostr.build/8a7acc13b5102c660a7974ebf57b11b613bb6862cf55196d624a09191ac6cc5f.jpg"

    let resultsHtml = '<div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">'
    for (const pubkey of senderPubkeys) {

      const profile = profiles[pubkey] || {}
      const npub = nip19.npubEncode(pubkey)
      const avatarUrl = profile.avatar || defaultAvatar
      //const localAvatarUrl = await cacheImage(avatarUrl, pubkey)
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
  } catch (error) {
    resultsDiv.innerHTML = `Error: ${error.message}`
  }
}

// Function to cache images locally
async function cacheImage(imageUrl, pubkey) {
  const cacheDir = './imgstash'
  const avatarFilename = imageUrl.split('/').pop()
  //const filename = `${cacheDir}/${pubkey}/${avatarFilename}`
  const filename = `${cacheDir}/${avatarFilename}`

  // Check if the file already exists
  if (await fileExists(filename)) {
    return filename
  }

  // Download the image and save it to the local cache
  try {
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    const buffer = await blob.arrayBuffer()

    // Send the image buffer to the server to save
    await saveFile(filename, buffer, pubkey, avatarFilename)
    return filename
  } catch (error) {
    console.error(`Failed to cache image ${imageUrl}:`, error)
    return imageUrl
  }
}

// Helper function to check if a file exists
async function fileExists(filePath) {
  try {
    const response = await fetch(filePath, { method: 'HEAD' })
    return response.ok
  } catch (error) {
    return false
  }
}

// Helper function to save a file
async function saveFile(filePath, buffer, pubkey, avatarFilename) {
  try {
    await fetch('/save-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ filePath, buffer, pubkey, avatarFilename })
    })
  } catch (error) {
    console.error(`Failed to save file ${filePath}:`, error)
  }
}

// Function to download the content inside the <div id="result">
function downloadResult() {
  // Get the content inside the <div id="result">
  const resultDiv = document.getElementById('results');
  if (!resultDiv) {
      alert('Results section not found!');
      return;
  }
  const htmlContent = resultDiv.innerHTML;
  // Create a Blob with the HTML content
  const blob = new Blob([htmlContent], { type: 'text/html' });

  // Create a link element
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'result.html'; // Specify the file name

  // Append the link to the body (required for Firefox)
  document.body.appendChild(link);

  // Programmatically click the link to trigger the download
  link.click();

  // Remove the link from the document
  document.body.removeChild(link);
}


function captureScreenshot() {
  // doesn't seem to capture the images for some reason.
  var div = document.getElementById('results');
  if (!div) {
      alert('Results section not found!');
      return;
  }          
  html2canvas(div).then(function(canvas) {
      var imgData = canvas.toDataURL('image/png');
      var link = document.createElement('a');
      link.href = imgData;
      link.download = 'screenshot.png';
      link.click();
  });
}

// Add event listeners to the buttons
document.getElementById('downloadBtn').addEventListener('click', downloadResult);
// document.getElementById('captureScreen').addEventListener('click', captureScreenshot);

document.getElementById('fetchButton').addEventListener('click', fetchZapSenders)
