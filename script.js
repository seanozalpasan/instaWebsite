// DOM Elements
const uploadSection = document.getElementById('uploadSection');
const loadingSection = document.getElementById('loadingSection');
const resultsSection = document.getElementById('resultsSection');
const errorSection = document.getElementById('errorSection');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const dropZone = document.getElementById('dropZone');
const exportBtn = document.getElementById('exportBtn');
const resetBtn = document.getElementById('resetBtn');
const retryBtn = document.getElementById('retryBtn');
const totalFollowers = document.getElementById('totalFollowers');
const totalFollowing = document.getElementById('totalFollowing');
const notFollowingBack = document.getElementById('notFollowingBack');
const resultsList = document.getElementById('resultsList');
const errorMessage = document.getElementById('errorMessage');

// Global variables
let analysisResults = null;

// Event Listeners
uploadBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);
exportBtn.addEventListener('click', exportResults);
resetBtn.addEventListener('click', resetAnalysis);
retryBtn.addEventListener('click', resetAnalysis);

// Drag and Drop
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
        dropZone.classList.add('active');
    }, false);
});

['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => {
        dropZone.classList.remove('active');
    }, false);
});

dropZone.addEventListener('drop', handleDrop, false);

function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0 && files[0].name.endsWith('.zip')) {
        processZipFile(files[0]);
    } else {
        showError('Please upload a ZIP file');
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.zip')) {
        processZipFile(file);
    } else {
        showError('Please select a ZIP file');
    }
}

async function processZipFile(file) {
    showSection('loading');
    
    try {
        const zip = await JSZip.loadAsync(file);
        
        // Find followers and following files
        let followersContent = '';
        let followingContent = '';
        
        // Instagram data structure can vary, so we'll search for the files
        const entries = Object.entries(zip.files);
        
        for (const [path, zipEntry] of entries) {
            if (path.includes('followers') && path.endsWith('.html')) {
                followersContent += await zipEntry.async('string');
            } else if (path.includes('following') && path.endsWith('.html')) {
                followingContent += await zipEntry.async('string');
            }
        }
        
        if (!followersContent || !followingContent) {
            throw new Error('Could not find followers or following data in the ZIP file. Make sure you uploaded your complete Instagram data export.');
        }
        
        // Analyze the data
        analysisResults = analyzeInstagramData(followersContent, followingContent);
        displayResults(analysisResults);
        
    } catch (error) {
        console.error('Error processing file:', error);
        showError(error.message || 'Error processing the ZIP file. Please make sure it\'s a valid Instagram data export.');
    }
}

function extractUsernames(content) {
    // Pattern to match Instagram usernames in URLs
    const pattern = /href="https:\/\/www\.instagram\.com\/([^"\/]+)"/g;
    const usernames = new Set();
    let match;
    
    while ((match = pattern.exec(content)) !== null) {
        // Filter out Instagram's own pages
        if (!['accounts', 'explore', 'direct', 'p'].includes(match[1])) {
            usernames.add(match[1]);
        }
    }
    
    return usernames;
}

function analyzeInstagramData(followersContent, followingContent) {
    const followers = extractUsernames(followersContent);
    const following = extractUsernames(followingContent);
    
    // Find accounts that don't follow back
    const notFollowingBackSet = new Set();
    following.forEach(username => {
        if (!followers.has(username)) {
            notFollowingBackSet.add(username);
        }
    });
    
    // Convert to sorted array
    const notFollowingBackArray = Array.from(notFollowingBackSet).sort((a, b) => 
        a.toLowerCase().localeCompare(b.toLowerCase())
    );
    
    return {
        totalFollowers: followers.size,
        totalFollowing: following.size,
        notFollowingBack: notFollowingBackArray
    };
}

function displayResults(results) {
    // Update statistics
    totalFollowers.textContent = results.totalFollowers.toLocaleString();
    totalFollowing.textContent = results.totalFollowing.toLocaleString();
    notFollowingBack.textContent = results.notFollowingBack.length.toLocaleString();
    
    // Clear previous results
    resultsList.innerHTML = '';
    
    // Display usernames
    if (results.notFollowingBack.length === 0) {
        resultsList.innerHTML = '<p style="text-align: center; color: #888;">Everyone you follow follows you back! 🎉</p>';
    } else {
        results.notFollowingBack.forEach(username => {
            const userItem = document.createElement('div');
            userItem.className = 'user-item';
            userItem.innerHTML = `
                <a href="https://www.instagram.com/${username}" target="_blank" class="username">
                    @${username}
                </a>
            `;
            resultsList.appendChild(userItem);
        });
    }
    
    showSection('results');
}

function exportResults() {
    if (!analysisResults) return;
    
    let content = 'Instagram Follow Analysis\n';
    content += `Date: ${new Date().toLocaleString()}\n\n`;
    content += `Total Followers: ${analysisResults.totalFollowers}\n`;
    content += `Total Following: ${analysisResults.totalFollowing}\n`;
    content += `People who don't follow you back: ${analysisResults.notFollowingBack.length}\n\n`;
    
    if (analysisResults.notFollowingBack.length > 0) {
        content += 'Accounts that don\'t follow you back:\n';
        analysisResults.notFollowingBack.forEach(username => {
            content += `@${username}\n`;
        });
    } else {
        content += 'Everyone you follow follows you back!';
    }
    
    // Create and download file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `instagram_analysis_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

function showSection(section) {
    // Hide all sections
    uploadSection.classList.add('hidden');
    loadingSection.classList.add('hidden');
    resultsSection.classList.add('hidden');
    errorSection.classList.add('hidden');
    
    // Show requested section
    switch (section) {
        case 'upload':
            uploadSection.classList.remove('hidden');
            break;
        case 'loading':
            loadingSection.classList.remove('hidden');
            break;
        case 'results':
            resultsSection.classList.remove('hidden');
            break;
        case 'error':
            errorSection.classList.remove('hidden');
            break;
    }
}

function showError(message) {
    errorMessage.textContent = message;
    showSection('error');
}

function resetAnalysis() {
    analysisResults = null;
    fileInput.value = '';
    showSection('upload');
}

// Initialize
showSection('upload');