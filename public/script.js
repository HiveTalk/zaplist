import { SimplePool, nip19 } from 'https://esm.sh/nostr-tools@1.17.0';

const pool = new SimplePool();
let loggedInUser = null;
const cachedAvatars = new Map();

async function cacheAvatar(url, npub) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const fileExtension = blob.type.split('/')[1];
        const fileName = `avatar_${npub}.${fileExtension}`;
        const formData = new FormData();
        formData.append('file', blob, fileName);

        const cacheResponse = await fetch('/api/cache-avatar', {
            method: 'POST',
            body: formData
        });

        if (cacheResponse.ok) {
            const cachedUrl = await cacheResponse.text();
            cachedAvatars.set(npub, cachedUrl);
            return cachedUrl;
        } else {
            console.error('Failed to cache avatar:', await cacheResponse.text());
            return url;
        }
    } catch (error) {
        console.error('Error caching avatar:', error);
        return url;
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
        zip.file(`avatar_${i + 1}.png`, blob);
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "avatars.zip");
}

// Add event listeners
document.getElementById('downloadAvatarsBtn').addEventListener('click', downloadAvatars);