import { SimplePool } from 'https://esm.sh/nostr-tools@1.17.0';

const pool = new SimplePool();

export async function getProfiles(pubkeys, relays) {
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
      avatar: content.picture,
      banner: content.banner
    };
    return acc;
  }, {});
}
