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

// Manual upload elements
const manualUploadLink = document.getElementById('manualUploadLink');
const manualUpload = document.getElementById('manualUpload');
const backToZipLink = document.getElementById('backToZipLink');
const followersFileInput = document.getElementById('followersFileInput');
const followingFileInput = document.getElementById('followingFileInput');
const processManualBtn = document.getElementById('processManualBtn');
const testWithSampleData = document.getElementById('testWithSampleData');

// Global variables
let analysisResults = null;

// Event Listeners
uploadBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);
exportBtn.addEventListener('click', exportResults);
resetBtn.addEventListener('click', resetAnalysis);
retryBtn.addEventListener('click', resetAnalysis);

// Manual upload listeners
manualUploadLink.addEventListener('click', (e) => {
    e.preventDefault();
    const uploadCard = document.querySelector('.upload-card');
    Array.from(uploadCard.children).forEach(child => {
        if (child.id !== 'manualUpload') {
            child.style.display = 'none';
        }
    });
    manualUpload.classList.remove('hidden');
});

backToZipLink.addEventListener('click', (e) => {
    e.preventDefault();
    const uploadCard = document.querySelector('.upload-card');
    Array.from(uploadCard.children).forEach(child => {
        if (child.id !== 'manualUpload') {
            child.style.display = '';
        }
    });
    manualUpload.classList.add('hidden');
});

processManualBtn.addEventListener('click', processManualFiles);

// Sample data for testing
testWithSampleData.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Generate sample HTML data
    const sampleFollowers = `
        <html><body>
        <a href="https://www.instagram.com/user1">user1</a>
        <a href="https://www.instagram.com/user2">user2</a>
        <a href="https://www.instagram.com/user3">user3</a>
        <a href="https://www.instagram.com/mutual1">mutual1</a>
        <a href="https://www.instagram.com/mutual2">mutual2</a>
        </body></html>
    `;
    
    const sampleFollowing = `
        <html><body>
        <a href="https://www.instagram.com/user4">user4</a>
        <a href="https://www.instagram.com/user5">user5</a>
        <a href="https://www.instagram.com/user6">user6</a>
        <a href="https://www.instagram.com/mutual1">mutual1</a>
        <a href="https://www.instagram.com/mutual2">mutual2</a>
        </body></html>
    `;
    
    showSection('loading');
    
    setTimeout(() => {
        try {
            analysisResults = analyzeInstagramData(sampleFollowers, sampleFollowing);
            displayResults(analysisResults);
        } catch (error) {
            showError('Error processing sample data: ' + error.message);
        }
    }, 500);
});

// Process manual file uploads
async function processManualFiles() {
    const followersFile = followersFileInput.files[0];
    const followingFile = followingFileInput.files[0];
    
    if (!followersFile || !followingFile) {
        alert('Please select both followers and following HTML files');
        return;
    }
    
    showSection('loading');
    
    try {
        const followersContent = await followersFile.text();
        const followingContent = await followingFile.text();
        
        console.log(`Followers file: ${followersFile.name} (${followersContent.length} characters)`);
        console.log(`Following file: ${followingFile.name} (${followingContent.length} characters)`);
        
        // Analyze the data
        analysisResults = analyzeInstagramData(followersContent, followingContent);
        displayResults(analysisResults);
        
    } catch (error) {
        console.error('Error processing files:', error);
        if (error.message.includes('No usernames found')) {
            showError(error.message);
        } else {
            showError('Error processing the HTML files. Please make sure they are valid Instagram data export files.');
        }
    }
}

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
        
        // Debug: Log all files in the ZIP
        console.log('Files in ZIP:');
        Object.keys(zip.files).forEach(filename => {
            console.log('- ' + filename);
        });
        
        // Find followers and following files
        let followersContent = '';
        let followingContent = '';
        let followersFiles = [];
        let followingFiles = [];
        
        // Instagram data structure can vary, so we'll search for the files
        const entries = Object.entries(zip.files);
        
        for (const [path, zipEntry] of entries) {
            const lowerPath = path.toLowerCase();
            
            // Look for followers files (might be followers.html, followers_1.html, etc.)
            if (lowerPath.includes('follower') && lowerPath.endsWith('.html') && !lowerPath.includes('following')) {
                followersFiles.push(path);
                const content = await zipEntry.async('string');
                followersContent += content;
                console.log(`Found followers file: ${path} (${content.length} characters)`);
            } 
            // Look for following files
            else if (lowerPath.includes('following') && lowerPath.endsWith('.html')) {
                followingFiles.push(path);
                const content = await zipEntry.async('string');
                followingContent += content;
                console.log(`Found following file: ${path} (${content.length} characters)`);
            }
        }
        
        console.log(`Total followers files found: ${followersFiles.length}`);
        console.log(`Total following files found: ${followingFiles.length}`);
        
        if (!followersContent || !followingContent) {
            let errorMsg = 'Could not find the required files in the ZIP:\n\n';
            
            if (!followersContent) {
                errorMsg += '❌ No followers data found. Looking for files containing "follower" in the name.\n';
            } else {
                errorMsg += '✅ Followers data found.\n';
            }
            
            if (!followingContent) {
                errorMsg += '❌ No following data found. Looking for files containing "following" in the name.\n';
            } else {
                errorMsg += '✅ Following data found.\n';
            }
            
            errorMsg += '\nFiles found in ZIP:\n';
            const htmlFiles = Object.keys(zip.files).filter(f => f.toLowerCase().endsWith('.html'));
            htmlFiles.forEach(f => errorMsg += `• ${f}\n`);
            
            throw new Error(errorMsg);
        }
        
        // Analyze the data
        console.log('Starting analysis...');
        analysisResults = analyzeInstagramData(followersContent, followingContent);
        console.log('Analysis complete:', analysisResults);
        displayResults(analysisResults);
        
    } catch (error) {
        console.error('Error processing file:', error);
        if (error.message.includes('No usernames found')) {
            showError(error.message);
        } else {
            showError(error.message || 'Error processing the ZIP file. Please make sure it\'s a valid Instagram data export.');
        }
    }
}

function extractUsernames(content) {
    // Pattern to match Instagram usernames in URLs
    const pattern = /href="https:\/\/www\.instagram\.com\/([^"\/]+)"/g;
    const usernames = new Set();
    let match;
    let matchCount = 0;
    
    // Also log first few matches for debugging
    const firstMatches = [];
    
    while ((match = pattern.exec(content)) !== null) {
        matchCount++;
        // Filter out Instagram's own pages and invalid usernames
        const username = match[1];
        
        // Instagram username validation (letters, numbers, periods, underscores)
        const isValidUsername = /^[a-zA-Z0-9._]+$/.test(username);
        
        if (!['accounts', 'explore', 'direct', 'p', 'reels', 'stories'].includes(username) && 
            username.length > 0 && 
            username.length <= 30 && // Instagram username max length
            !username.includes('?') &&
            isValidUsername) {
            usernames.add(username);
            if (firstMatches.length < 5) {
                firstMatches.push(username);
            }
        }
    }
    
    console.log(`Found ${matchCount} total Instagram links, extracted ${usernames.size} unique usernames`);
    console.log(`First few usernames found: ${firstMatches.join(', ')}`);
    
    return usernames;
}

function analyzeInstagramData(followersContent, followingContent) {
    console.log('Analyzing data...');
    console.log(`Followers content length: ${followersContent.length}`);
    console.log(`Following content length: ${followingContent.length}`);
    
    // Check if content looks like Instagram data
    if (!followersContent.includes('instagram.com') || !followingContent.includes('instagram.com')) {
        throw new Error('The files don\'t appear to be Instagram data export files. Please make sure you selected the correct HTML files.');
    }
    
    const followers = extractUsernames(followersContent);
    const following = extractUsernames(followingContent);
    
    console.log(`Total followers: ${followers.size}`);
    console.log(`Total following: ${following.size}`);
    
    if (followers.size === 0 || following.size === 0) {
        throw new Error('No usernames found in the data. Please make sure you\'re using the correct Instagram data export files.');
    }
    
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
            // Add timeout to prevent infinite loading
            setTimeout(() => {
                if (!loadingSection.classList.contains('hidden')) {
                    showError('Processing is taking too long. Please try again or use the manual upload option.');
                }
            }, 30000); // 30 second timeout
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
    errorMessage.innerHTML = message + '<br><br>You can also try <a href="#" onclick="document.getElementById(\'manualUploadLink\').click(); showSection(\'upload\'); return false;">uploading individual HTML files</a> instead.';
    showSection('error');
}

function resetAnalysis() {
    analysisResults = null;
    fileInput.value = '';
    followersFileInput.value = '';
    followingFileInput.value = '';
    const uploadCard = document.querySelector('.upload-card');
    Array.from(uploadCard.children).forEach(child => {
        if (child.id !== 'manualUpload') {
            child.style.display = '';
        }
    });
    manualUpload.classList.add('hidden');
    showSection('upload');
}

// Initialize
showSection('upload');

// Add console message for debugging
console.log('Instagram Analyzer loaded. If you encounter issues:');
console.log('1. Open Developer Console (F12) to see debug messages');
console.log('2. Try using the "Upload individual HTML files" option');
console.log('3. Make sure your Instagram data export is recent and complete');

// Check if JSZip is loaded
if (typeof JSZip === 'undefined') {
    console.error('JSZip library not loaded! ZIP file processing will not work.');
    showError('Error: Required library not loaded. Please refresh the page or use the manual file upload option.');
}

// Common issues helper
console.log('\nCommon issues and solutions:');
console.log('- "Could not find files": Instagram data structure may have changed. Try manual upload.');
console.log('- "No usernames found": The HTML files might be empty or have a different format.');
console.log('- Live preview issues: The site works best when opened as a local file or hosted on a server.');
console.log('- CORS errors: If testing locally, use a local server or the manual upload option.');