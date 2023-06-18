/* If you're reading through the JS to see how this application works, here's a forewarning:
This script was created quickly, and thus has many issues, such as it not being optimized and having some bugs.
This script is absolute spaghetti code. You wouldn't find a better example of bad coding than this script.
This script is in dire need of a recode. Like, seriously. But I don't feel like refactoring all this, so you'll
have to bear with me when reading this code. Good luck! */

let account = 'unknown';
let repo = '';
let simplemde = '';
let flask = '';
let branch = 'master';

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

  async function loadRepository(repo, elementId) {
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
      document.getElementById(elementId).innerHTML = generateList(tree);
      document.querySelector('header h2').innerHTML = `Editing <strong>${account}/${repo}</strong> on branch <strong>${branch}</strong>`;
      document.querySelector('header h2').setAttribute('onclick', `window.open("https://github.com/${account}/${repo}/tree/${branch}/", '_blank').focus();`);
      Array.from(document.querySelectorAll('.editorBtn')).forEach( (el) => el.classList.remove('hidden'));
      document.querySelector('.main').classList.remove('hidden');
      document.querySelector('.wrapper').classList.add('open');
    } catch(err) { 
      document.getElementById('loginText').innerHTML = `<strong>Error loading repository!</strong> Check if the repository "<a href="https://github.com/${account}/${repo}">https://github.com/${account}/${repo}</a>" and branch <strong>${branch}</strong> exists.<br>Please try again.`
      document.querySelector('#selectRepoWrapper').classList.add('show');
      document.getElementById('loginText').classList.add('show');
      document.querySelector('header h2').innerHTML = '';
   }
  } 

  let currentFilePath = '';

  function fetchFileContents(item, path) {
    Array.from(document.querySelectorAll('.itemSelected')).forEach( (el) => el.classList.remove('itemSelected'));
    item.classList.add('itemSelected');
    document.querySelector('.editArea').classList.remove('showEditArea');
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
        document.querySelector('.editArea').classList.add('showEditArea');
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
  document.getElementById('selectRepoWrapper').classList.add('show');
  document.getElementById('loginText').classList.add('show');

function selectRepo() {
  repo = document.getElementById('selectRepo').value;
  if (document.getElementById('selectBranch').value != '') { branch = document.getElementById('selectBranch').value; }
  document.querySelector('#selectRepoWrapper').classList.remove('show');
  document.getElementById('loginText').classList.remove('show');
  document.querySelector('header h2').innerHTML = `Loading ${repo}...`;
  document.getElementById('username').innerHTML = `Logged in as <strong>${account}</strong>`;
  document.getElementById('username').classList.remove('hidden');
  document.getElementById('username').href = `https://github.com/${account}`;
  loadRepository(repo, 'repository-content');
}

document.onkeyup = function(e){ if(e.key == 'Enter'){ // On enter key press while selecting repo, submit it
    if (!document.querySelector('header h2').innerHTML.includes('Editing')) { selectRepo(); }
  }
}