export async function onRequest({ request, env }) { // Handle callback & authorize user
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        client_id: env.OAUTH_CLIENT_ID,
        client_secret: env.OAUTH_CLIENT_SECRET,
        code,
      }),
    });

    const data = await response.json();
    let mess, content;
    if (data.error) {
      console.error('Token access error: ', data.error_description);
      mess = 'error';
      content = JSON.stringify(data);
    } else {
      mess = 'success';
      content = {
        token: data.access_token,
        provider: 'github'
      };
    }

    const redirectUrl = `https://gitcms.pages.dev/?access_token=${content.token}`;
    return Response.redirect(redirectUrl, 302);
}