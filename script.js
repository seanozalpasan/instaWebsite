const folderInput = document.getElementById('folderInput');
const loading = document.getElementById('loading');
const results = document.getElementById('results');
const error = document.getElementById('error');

folderInput.addEventListener('change', handleFolderUpload);

async function handleFolderUpload(event) {
    const files = Array.from(event.target.files);
    
    // Reset UI
    error.style.display = 'none';
    results.style.display = 'none';
    
    // Find the required files in the connections/followers_and_following/ directory
    const followersFile = files.find(f => 
        f.webkitRelativePath && 
        f.webkitRelativePath.endsWith('connections/followers_and_following/followers_1.html')
    );
    const followingFile = files.find(f => 
        f.webkitRelativePath && 
        f.webkitRelativePath.endsWith('connections/followers_and_following/following.html')
    );
    
    if (!followersFile || !followingFile) {
        showError('Please make sure your folder contains followers_1.html and following.html files in the connections/followers_and_following/ directory.');
        return;
    }
    
    loading.style.display = 'block';
    
    try {
        // Read file contents
        const followersContent = await readFile(followersFile);
        const followingContent = await readFile(followingFile);
        
        // Analyze the data
        const analysis = analyzeInstagramRelationships(followersContent, followingContent);
        
        // Display results
        displayResults(analysis);
    } catch (err) {
        showError('Error analyzing files: ' + err.message);
    } finally {
        loading.style.display = 'none';
    }
}

function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

function extractUsernames(content) {
    const pattern = /href="https:\/\/www\.instagram\.com\/([^"]+)"/g;
    const matches = [...content.matchAll(pattern)];
    return new Set(matches.map(match => match[1]));
}

function analyzeInstagramRelationships(followersContent, followingContent) {
    const followers = extractUsernames(followersContent);
    const following = extractUsernames(followingContent);
    
    const notFollowingBack = [...following].filter(user => !followers.has(user));
    const youDontFollowBack = [...followers].filter(user => !following.has(user));
    
    return {
        totalFollowers: followers.size,
        totalFollowing: following.size,
        notFollowingBack: notFollowingBack.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())),
        youDontFollowBack: youDontFollowBack.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    };
}

function displayResults(analysis) {
    // Update stats
    document.getElementById('totalFollowers').textContent = analysis.totalFollowers;
    document.getElementById('totalFollowing').textContent = analysis.totalFollowing;
    document.getElementById('notFollowingBack').textContent = analysis.notFollowingBack.length;
    
    // Update counts
    document.getElementById('notFollowingBackCount').textContent = analysis.notFollowingBack.length;
    
    // Display usernames
    const notFollowingBackList = document.getElementById('notFollowingBackList');
    
    if (analysis.notFollowingBack.length === 0) {
        notFollowingBackList.innerHTML = '<div class="no-results">Everyone you follow follows you back! 🎉</div>';
    } else {
        notFollowingBackList.innerHTML = analysis.notFollowingBack
            .map(username => `<div class="username" onclick="openInstagram('${username}')">@${username}</div>`)
            .join('');
    }
    
    results.style.display = 'block';
}

function openInstagram(username) {
    window.open(`https://www.instagram.com/${username}`, '_blank');
}

function showError(message) {
    error.textContent = message;
    error.style.display = 'block';
}