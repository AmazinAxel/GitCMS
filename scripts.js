/* If you're reading through the JS to see how this application works, here's a forewarning:
This script was created quickly, and thus has many issues, such as it not being optimized and having some bugs.
This script is absolute spaghetti code. You wouldn't find a better example of bad coding than this script.
This script is in dire need of a recode. Like, seriously. But I don't feel like refactoring all this, so you'll
have to bear with me when reading this code. Good luck! */

let account = 'unknown';
let repo = 'Site';
let simplemde = '';
let flask = '';
let branch = 'main';

// Handle the callback from GitHub
const url = new URL(window.location.href);
if (url.searchParams.has('access_token')) {
  window.accessToken = url.searchParams.get('access_token');
  localStorage.setItem('access_token', window.accessToken); // Store the access token in local storage
  // Use the access token to authenticate API requests
  async function fetchData() {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${window.accessToken}`
      }
    });
    const data = await response.json();
    localStorage.setItem('account', data.login);
    localStorage.setItem('profileImg', data.avatar_url);
    window.location.reload();
  }
  fetchData();
  url.searchParams.delete('access_token'); // Remove the auth code parameter from the URL
  history.replaceState(null, '', url.toString()); // Update the URL displayed in the address bar without reloading the page
}

  function generateList(tree, path = '') {
    let html = '<ul>';
    let directories = '';
    let files = '';
  
    tree.forEach((item) => {
      if (item.type === 'tree' && item.path.startsWith(path) && !item.path.slice(path.length).includes('/')) {
        directories += `<li class="dropdown" onclick="toggleDropdown.call(this, event)">${item.path.slice(path.length)}`;
        directories += `<ul class="dropdown-content">${generateList(tree, item.path + '/')}</ul></li>`;
      } else if (item.type === 'blob' && item.path.startsWith(path) && !item.path.slice(path.length).includes('/')) {
        files += `<li id="${item.path}" onclick="event.stopPropagation(); fetchFileContents(this, '${item.path}')">${item.path.slice(path.length)}</li>`;
      }
    });
  
    html += directories + files + '</ul>';
    return html;
  }  

  function toggleDropdown(event) {
    event.stopPropagation();
    this.querySelector('.dropdown-content').classList.toggle('show');
    this.classList.toggle('dirOpen');
  }  

  async function loadRepository() {
    console.log(`Loading ${repo}...`);
    try { 
      const accessToken = localStorage.getItem('access_token');
      const response = await fetch(`https://api.github.com/repos/${account}/${repo}/git/trees/${branch}?recursive=1`, {
        headers: {
          'User-Agent': 'request',
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const data = await response.json();
      const tree = data.tree;
      document.getElementById('repository-content').innerHTML = generateList(tree);
      document.getElementById('headerSubtitle').innerHTML = `Editing <strong>${account}/${repo}</strong> on branch <strong>${branch}</strong>`;
      document.getElementById('headerSubtitle').setAttribute('onclick', `window.open("https://github.com/${account}/${repo}/tree/${branch}/", '_blank').focus();`);
      document.getElementById('save-button').classList.remove('hidden');
      document.getElementById('wrapper').classList.add('open');
      document.getElementById('editArea').classList.remove('hidden');
      document.getElementById('filemanager').classList.remove('hidden');
      document.title = 'GitCMS - Editing: ' + repo;
      console.log('Repository sucessfully loaded!');
    } catch(err) { 
      document.getElementById('loginText').innerHTML = `<strong>Error loading repository!</strong> Check if the repository "<a href="https://github.com/${account}/${repo}">https://github.com/${account}/${repo}</a>" and branch <strong>${branch}</strong> exists.`
      document.getElementById('selectRepoWrapper').classList.add('show');
      document.getElementById('loginText').classList.add('show');
      document.getElementById('headerSubtitle').innerHTML = '';
      console.log(err);
   }
  } 

  let currentFilePath = '';

  function fetchFileContents(item, path) {
    console.log('Fetching file contents with URL: https://api.github.com/repos/${account}/${repo}/contents/' + path);
    Array.from(document.querySelectorAll('.itemSelected')).forEach( (el) => el.classList.remove('itemSelected'));
    item.classList.add('itemSelected');
    document.getElementById('editArea').classList.remove('showEditArea');
    const accessToken = localStorage.getItem('access_token');
    const options = { method: "GET", headers: { "User-Agent": "request", "Authorization": `Bearer ${accessToken}` } };
    // These variables are file types & languages that CodeFlask supports natively
    const codeEditorExtensions = ['.html', '.xml', '.css', '.c', '.cpp', '.h', '.hpp', '.js', '.json'];
    const mediaExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.webm', '.mp4', '.wvm', '.flv', '.mov', '.avi', '.ico', '.mp3', '.mp2', '.wav', '.wma'];
    fetch(`https://api.github.com/repos/${account}/${repo}/contents/` + path, options)
      .then((response) => response.json())
      .then((data) => {
        const content = data.content;
        const fileContents = document.getElementById('file-contents');
        const codeContents = document.getElementById('codeContents');
        const mediaItems = document.getElementById('mediaItems');
        document.getElementById('editArea').classList.add('showEditArea');
        if (simplemde != '') { simplemde.toTextArea(); simplemde = ''; } // Probably should optimize this
        if (path.includes('.md')) { 
          const existingMediaElement = mediaItems.querySelector('img, video, object, audio');
          if (existingMediaElement) { existingMediaElement.remove(); }
          const decodedContent = new TextDecoder().decode(Uint8Array.from(atob(content), c => c.charCodeAt(0)));
          simplemde = new SimpleMDE({ initialValue: decodedContent, spellChecker: true, element: fileContents });
          fileContents.style.display = 'none';
          codeContents.style.display = 'none';
          console.log(`Now editing file with path ${path} using the markdown editor.`);
          flask = '';
        } else if (codeEditorExtensions.some(ext => path.endsWith(ext))) {
          const decodedContent = new TextDecoder().decode(Uint8Array.from(atob(content), c => c.charCodeAt(0)));
          fileContents.style.display = 'none';
          codeContents.style.display = 'block';
          const language = path.split('.').pop();
          flask = new CodeFlask('#codeContents', { language });
          flask.updateCode(decodedContent);
          // Code for code editor goes here
          console.log(`Now editing file with path ${path} using the code editor with language mode set to ${language}.`);
        } else if (mediaExtensions.some(ext => path.endsWith(ext))) {
          // Remove any existing media elements
          const existingMediaElement = mediaItems.querySelector('img, video, object, audio');
          if (existingMediaElement) { existingMediaElement.remove(); }
        
          // Create a new media element
          let mediaElement;
          if (path.endsWith('.svg')) {
            mediaElement = document.createElement('object');
            mediaElement.type = 'image/svg+xml';
            mediaElement.data = `data:image/svg+xml;base64,${content}`;
          } else if (['.webm', '.mp4', '.wvm', '.flv', '.mov', '.avi'].some(ext => path.endsWith(ext))) {
            mediaElement = document.createElement('video');
            mediaElement.src = `data:video/${path.split('.').pop()};base64,${content}`;
            mediaElement.controls = true;
          } else if (['.mp3', '.mp2', '.wav', '.wma'].some(ext => path.endsWith(ext))) {
            mediaElement = document.createElement('audio');
            mediaElement.src = `data:audio/${path.split('.').pop()};base64,${content}`;
            mediaElement.controls = true;
          } else {
            mediaElement = document.createElement('img');
            mediaElement.src = `data:image/${path.split('.').pop()};base64,${content}`;
          }
        
          // Append the new media element to the codeContents element
          mediaItems.appendChild(mediaElement);
          fileContents.style.display = 'none';
          codeContents.style.display = 'none';
          console.log(`Now displaying media with path ${path}.`);
        } else {
          const existingMediaElement = mediaItems.querySelector('img, video, object, audio');
          if (existingMediaElement) { existingMediaElement.remove(); }
          const decodedContent = new TextDecoder().decode(Uint8Array.from(atob(content), c => c.charCodeAt(0)));
          fileContents.value = decodedContent;
          fileContents.style.display = 'block';
          codeContents.style.display = 'none';
          console.log(`Now editing file with path ${path} using default text editor.`);
          flask = '';
        }
      })
      .catch((e) => console.error(e));
      currentFilePath = path;
  }  

  async function saveChanges() {
    console.log('Saving changes...');
    let message = prompt(`Enter commit message:
(Enter nothing to use the default message: "Updated ${currentFilePath}")`);
    if (message == '') { message = `Updated ${currentFilePath}`; }
    // Get the updated file contents from the textarea and encode the updated content in Base64
    (currentFilePath.includes('.md')) ? encodedContent = Base64.encode(simplemde.value()):
    encodedContent = btoa(document.getElementById('file-contents').value);
    if (flask != '') { encodedContent = Base64.encode(flask.getCode()); }
    // Set the access token obtained from GitHub OAuth
    const accessToken = localStorage.getItem('access_token');
  
    // Get the SHA of the file to update
    const fileResponse = await fetch(`https://api.github.com/repos/${account}/${repo}/contents/${currentFilePath}`, { headers: {'Authorization': `Bearer ${accessToken}`}});
    const fileData = await fileResponse.json(); const fileSha = fileData.sha;
  
    // Update the file in the repository
    await fetch(`https://api.github.com/repos/${account}/${repo}/contents/${currentFilePath}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message, content: encodedContent, sha: fileSha, branch })
    });
    console.log('Changes successfully saved!')
  }
  
  function login() {
    if (localStorage.getItem('access_token') != null) { 
        account = localStorage.getItem('account');
        document.getElementById('loginText').innerHTML = `You're logged in as <strong>${account}.</strong> You have edit access to your public & private repositories.`;
        document.getElementById('selectRepo').placeholder = 'Enter repository here (like "Site")';
        document.getElementById('login-button').style.display = 'none';
        document.getElementById('github').style.display = 'none';
        document.getElementById('profileImg').src = localStorage.getItem('profileImg');
        document.getElementById('profileImg').setAttribute('onclick', `window.open("https://github.com/${account}", '_blank').focus();`);
    } else { // User is not logged in!
        document.getElementById('loginText').innerHTML = "<strong>You're browsing as a guest.</strong> You have read-only access to public repositories."
        document.getElementById('logout-button').style.display = 'none';
        document.getElementById('selectRepo').placeholder = 'Enter repository here (like "AmazinAxel/Site")'
  }}
  login();
  if (account == "AmazinAxele") {
    document.getElementById('loginText').classList.add('force');
    document.getElementById('selectBranch').classList.add('force');
    document.getElementById('selectRepo').classList.add('force');
    document.getElementById('enterRepo').classList.add('force');

    document.getElementById('blogselector').classList.remove('hidden');
    document.getElementById('loginText').classList.add('show');  
  } else {
    document.getElementById('selectRepoWrapper').classList.add('show');
    document.getElementById('loginText').classList.add('show');  
}

function selectRepo() {
  repo = document.getElementById('selectRepo').value;
  if (document.getElementById('selectBranch').value != '') { branch = document.getElementById('selectBranch').value; }
  document.getElementById('selectRepoWrapper').classList.remove('show');
  document.getElementById('loginText').classList.remove('show');
  if (account != 'unknown') { document.getElementById('username').innerHTML = `Logged in as <strong>${account}</strong>`; }
  document.getElementById('username').classList.remove('hidden');
  document.getElementById('username').href = `https://github.com/${account}`;
  if (account == 'AmazinAxele') {
    if (repo.toLowerCase(repo) == 'site') { openBlogEditor(); return; }
  }
  loadRepository();
}

document.onkeyup = function(e){ if(e.key == 'Enter'){ // On enter key press while selecting repo, submit it
    if (!document.getElementById('headerSubtitle').innerHTML.includes('Editing')) { selectRepo(); }
  }
}
// The blog editor allows you to quickly & easily create blog posts, modify code below to make it work with your CMS!
function openBlogEditor() {
  console.log('Blog CMS editor opened!')
  document.getElementById('selectRepoWrapper').classList.remove('show');
  document.getElementById('loginText').classList.remove('show');
  // First, ask editor if they want to create an SWR post or an announcement
  // Then open up a GUI allowing you to input an optional title and markdown formatted post
  // Then, click the save button to save it and then allow you to preview it
  // Include options for switching to a file viewer and allow changing to announcements editor.
  // You should be able to see past SWRs and announcements by parsing the file, have a similar UI to CP
  // You should also be able to add images and media easily & quickly, including changing the name & pasting it into markdown format

  // Blog editor should allow you to change the post category, add a tag, meta description, images, and more (add to boba blog too!!)
  // Landing site editor should show a disclaimer Just In Case(tm)

  // Add a quick thing to make it so when logged in as amazinaxel, automagically open up a menu
  // that allows you to quickly start creating an SWR post, but give an option to create an announcement post or go edit the boba blog or devblog
  // also have a quick toggle option that allows you to switch to a filemanager if ever needed
  // If it detects that its monday, quickload the SWR editor page so its the first thing thats shown
}

function revertToClassic() {
  document.getElementById('selectRepoWrapper').classList.add('show'); 
  document.getElementById('loginText').classList.add('show');
  document.getElementById('blogselector').classList.add('hidden');

  document.getElementById('loginText').classList.remove('force');
    document.getElementById('selectBranch').classList.remove('force');
    document.getElementById('selectRepo').classList.remove('force');
    document.getElementById('enterRepo').classList.remove('force');
}