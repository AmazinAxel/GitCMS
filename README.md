# 📝GitCMS, a new way to manage sites hosted on GitHub.
Welcome to GitCMS, a Git-based, JAMstack-compatible CMS that allows you to easily, simply, and efficently manage the content of your site for free. 

# ❓What is this?
This is a very basic CMS meant to be modified for your usage. It mainly just allows you to edit and view Markdown files easily, quickly, and efficently, however, customizing it gives you many more useful CMS features. It also includes a code editor and defaults to a nice text editor on unsupported files. It also supports viewing of videos, audio, and images. It's super fast, both to deploy (you can deploy this site in under 10 seconds with Cloudflare Pages, including building of the Functions and setup) & to use. It has no dependencies and only relies on the GitHub API to allow you to edit & view files. It's overanimated, meaning if you love eye candy, you'll love using this. It has a nice UI, and scales all the way from a phone to a large desktop. This project's goal is to make editing your site easier by providing a great Markdown editor with the ease-of-use of just clicking a few intuitive buttons! 
Because this is a personal project mainly used for managing my sites, it's already configured for how I like it. However, additional configuration allows you to modify everything to work how you want so you can create blog posts & manage your content very easily and quickly! 

# 🚀How can I set this up?
You don't really need to set up this application up on your own if you don't want to. There is a fully working, prebuilt version available at [gitcms.amazinaxel.com](https://gitcms.amazinaxel.com). However, you can still follow the below steps to create your own instance of GitCMS. This repository also already includes the files necessary for a custom, self-hosted authentication setup built with JavaScript. For this to work, I've used Cloudflare Functions to handle the authentication. You can convert the Workers code to any backend language you want, but for this example, we'll be using Cloudflare Pages. 

First, clone this repository and setup the site on Cloudflare by naming it whatever you'd like. Connect Cloudflare Pages with your GitHub account and then add the cloned repository. Next, try building the site (it may fail, but that's OK) and then following these instructions:

In the `Settings` tab, click `Builds & deployments` and enter the following information:

- Change the 'Build Command' to `rm README.md LICENSE` (to remove unnecessary files before deployment)
- Configure the 'Build system version' to use version `2`

Now, we need to get the authentication script working. For additional security, it's recommended that you host your own auth script, so lets set that up. First, go to the [GitHub Developer settings](https://github.com/settings/developers) and click `OAuth Apps`. Create a new app and name it whatever you'd like. Set the Homepage URL to your Cloudflare Pages URL (ends in *.pages.dev). Set the `Authorization Callback URL` to your Cloudflare Pages default URL, but add /callback to it. For example, if your URL is https://gitcms.pages.dev, set the Callback URL to 'https://gitcms.pages.dev/callback' **It is very important that you set the Authorization Callback URL correctly.** Now, copy the Client ID variable and create a new client secret. **It is extremely important that you use this client secret carefully.** Don't share it with ANYBODY, and ONLY paste it in the environment variable with it encrypted. You should never see this secret again for security reasons. Now, you're ready to start to start setting up the variables.

In the `Environment Variables` tab, enter these variables in the Production environment:

- Set the `OAUTH_CLIENT_ID` variable to your copied Client ID from GitHub. 
- Set the `OAUTH_CLIENT_SECRET` variable to your copied Client Secret that you recieved from GitHub. **Encrypt this variable.**
- Set the `REDIRECT_URL` to the exact same URL as the 'Authorization callback URL' you set in GitHub.

Now, head back to 'Deployments' and rebuild based off the last build. If you are having problems with the authentication scripts, change the 'Compatibility Date' within the Functions tab to `2023-05-18`. You should only do this if are encountering issues. Otherwise, leave it to the latest version for additional security.

For local development, install Wrangler and use the following command in the project directory to run a local development server with Miniflare: `npx wrangler pages dev --compatibility-date 2023-05-18 .`

As stated before, if you want access to extra features such as better and more streamlined post creation, please go through the scripts.js file and modify things as needed. You will need to change a lot of code to work with your CMS. *(Note: variables are hardcoded into the code, so make sure to search through the file thoroughly to make sure everything works as expected!)*