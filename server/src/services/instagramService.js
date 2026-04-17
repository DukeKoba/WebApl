// Instagram Graph API - Content Publishing API
// Requires: Instagram Business/Creator Account + Facebook Page

const IG_API_BASE = 'https://graph.facebook.com/v21.0';

function getCredentials() {
  return {
    accessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
    accountId: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID,
  };
}

export async function postPhoto(imageUrl, caption) {
  const { accessToken, accountId } = getCredentials();

  // Step 1: Create media container
  const containerRes = await fetch(
    `${IG_API_BASE}/${accountId}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: imageUrl,
        caption,
        access_token: accessToken,
      }),
    }
  );

  if (!containerRes.ok) {
    const err = await containerRes.json();
    throw new Error(err.error?.message || 'Failed to create Instagram media container');
  }

  const { id: containerId } = await containerRes.json();

  // Step 2: Wait briefly for container to be ready
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 3: Publish container
  const publishRes = await fetch(
    `${IG_API_BASE}/${accountId}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken,
      }),
    }
  );

  if (!publishRes.ok) {
    const err = await publishRes.json();
    throw new Error(err.error?.message || 'Failed to publish Instagram post');
  }

  const { id: postId } = await publishRes.json();
  return { id: postId };
}

export async function checkConnection() {
  const { accessToken, accountId } = getCredentials();
  const res = await fetch(
    `${IG_API_BASE}/${accountId}?fields=id,name,username&access_token=${accessToken}`
  );
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Failed to connect to Instagram API');
  }
  return res.json();
}
