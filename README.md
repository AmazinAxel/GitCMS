# 📝GitCMS
GitCMS: a Git-based, JAMstack-compatible CMS that allows you to easily, simply, and efficently manage the content of your Github-hosted site. 

## 📦 Archived

GitCMS is a very basic CMS intended to be modified for your usage. It currently just allows you to edit and view Markdown files but customizing it gives you many more useful CMS features. It also includes a code editor and defaults to a nice text editor on unsupported files. It also supports viewing of videos, audio, and images. It's super fast, both to deploy (you can deploy this site in under 10 seconds with Cloudflare Pages, including building of the Functions and build setup) & to use. It has no dependencies and only relies on the GitHub API to allow you to edit & view files. It has a nice UI and scales from a phone to a large desktop.

# Development
You don't really need to host this application yourself. Just use [gitcms.amazinaxel.com](https://gitcms.amazinaxel.com). Follow the below steps to create your own instance of GitCMS. This repository also already includes the Worker files for a self-hosted authentication setup built with JavaScript. For this to work, I've used Cloudflare Functions to handle the authentication. You can convert the Workers code to any backend language you want.

First, clone this repository and setup the site on Cloudflare. Connect Cloudflare Pages with your GitHub account and then add the cloned repository. Then try building the site (it may fail, but that's OK) and then follow these instructions:

In the `Settings` tab, click `Builds & deployments` and enter the following information:

- Change the 'Build Command' to `rm README.md LICENSE` (to remove unnecessary files before deployment)
- Configure the 'Build system version' to use version `2`

Then, you need to get the authentication script working. For additional security, it's recommended that you host your own auth script. First, go to the [GitHub Developer settings](https://github.com/settings/developers) and click `OAuth Apps` and create a new app. Set the Homepage URL to your Cloudflare Pages URL (ends in *.pages.dev). Set the `Authorization Callback URL` to your Cloudflare Pages default URL, but add /callback to it. For example, if your URL is https://gitcms.pages.dev, set the Callback URL to 'https://gitcms.pages.dev/callback' **It is very important that you set the Authorization Callback URL correctly.** Now, copy the Client ID variable and create a new client secret. **It is extremely important that you use this client secret carefully.** Don't share it with ANYBODY, and ONLY paste it in the environment variable with it encrypted. You should never see this secret again for security reasons. Now, you're ready to start to start setting up the variables.

In the `Environment Variables` tab, enter these variables in the Production environment:

- Set the `OAUTH_CLIENT_ID` variable to your copied Client ID from GitHub. 
- Set the `OAUTH_CLIENT_SECRET` variable to your copied Client Secret that you recieved from GitHub. **Encrypt this variable.**
- Set the `REDIRECT_URL` to the exact same URL as the 'Authorization callback URL' you set in GitHub.

Now, head back to 'Deployments' and rebuild based off the last build. If you are having problems with the authentication scripts, change the 'Compatibility Date' within the Functions tab to `2023-05-18`. You should only do this if are encountering issues. Otherwise, leave it to the latest version for additional security.

For local development, install Wrangler and use the following command in the project directory to run a local development server with Miniflare: `npx wrangler pages dev --compatibility-date 2023-05-18 .`

You will *need* to modify this project to suit your needs. It does not include all CMS features by default!
