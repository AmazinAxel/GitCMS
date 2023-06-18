export async function onRequest({ env }) { // Get GitHub auth code
    function generateRandomString() { // This is used for additional security
      const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      const values = crypto.getRandomValues(new Uint8Array(32));
      for (let i = 0; i < 32; i++) { result += charset[values[i] % charset.length]; }
      return result;
    }

    // Redirect to GitHub's authorization endpoint
    const params = new URLSearchParams({
      client_id: env.OAUTH_CLIENT_ID,
      redirect_uri: env.REDIRECT_URL,
      scope: 'repo',
      state: generateRandomString(),
    });
    const authorizationUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

    return Response.redirect(authorizationUrl, 302);
}