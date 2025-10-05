const API_URL = window.location.origin;
let currentUser = null;

// Check auth on load
window.addEventListener('load', async () => {
    try {
        const response = await fetch(`${API_URL}/api/check-auth`, { credentials: 'include' });
        const data = await response.json();
        if (data.authenticated) {
            currentUser = data.user;
            showMainApp();
        } else {
            showAuthModal();
        }
    } catch (error) {
        console.error('Auth check error:', error);
        showAuthModal();
    }
});

function showAuthModal() {
    const authModal = new bootstrap.Modal(document.getElementById('authModal'));
    authModal.show();
    document.getElementById('mainApp').classList.add('d-none');
}

function showMainApp() {
    document.getElementById('mainApp').classList.remove('d-none');
    document.getElementById('userName').textContent = currentUser.name;
    const authModal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
    if (authModal) authModal.hide();
}

function showError(message) {
    const errorDiv = document.getElementById('authError');
    errorDiv.textContent = message;
    errorDiv.classList.remove('d-none');
    setTimeout(() => errorDiv.classList.add('d-none'), 5000);
}

// Auth forms
document.getElementById('showSignup').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginForm').classList.add('d-none');
    document.getElementById('signupForm').classList.remove('d-none');
    document.getElementById('authError').classList.add('d-none');
});

document.getElementById('showLogin').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('signupForm').classList.add('d-none');
    document.getElementById('loginForm').classList.remove('d-none');
    document.getElementById('authError').classList.add('d-none');
});

document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    
    if (!name || !email || !password) {
        showError('All fields are required');
        return;
    }
    
    console.log('Signup attempt:', { name, email });
    
    try {
        const response = await fetch(`${API_URL}/api/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        console.log('Signup response:', data);
        
        if (data.success) {
            currentUser = data.user;
            showMainApp();
        } else {
            showError(data.error || 'Signup failed');
        }
    } catch (error) {
        console.error('Signup error:', error);
        showError('Network error. Please try again.');
    }
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showError('Email and password are required');
        return;
    }
    
    console.log('Login attempt:', { email });
    
    try {
        const response = await fetch(`${API_URL}/api/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        console.log('Login response:', data);
        
        if (data.success) {
            currentUser = data.user;
            showMainApp();
        } else {
            showError(data.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Network error. Please try again.');
    }
});

document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch(`${API_URL}/api/logout`, { method: 'POST', credentials: 'include' });
    currentUser = null;
    location.reload();
});

// Tab navigation
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.tab-pane-modern').forEach(p => p.classList.remove('active'));
        document.getElementById(btn.dataset.tab).classList.add('active');
        
        if (btn.dataset.tab === 'colleges') {
            loadCollegeResumes();
        }
    });
});

// File upload handling
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('resumeFile');
let selectedFile = null;
const originalDropZoneHTML = dropZone.innerHTML;

dropZone.addEventListener('click', () => fileInput.click());

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#6366f1';
    dropZone.style.background = 'rgba(99, 102, 241, 0.1)';
});

dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    if (!selectedFile) {
        dropZone.style.borderColor = '#cbd5e1';
        dropZone.style.background = '#f8fafc';
    }
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        fileInput.files = files;
        selectedFile = files[0];
        updateDropZoneUI(files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        selectedFile = e.target.files[0];
        updateDropZoneUI(e.target.files[0]);
    }
});

function updateDropZoneUI(file) {
    const fileSize = (file.size / 1024 / 1024).toFixed(2);
    const fileExt = file.name.split('.').pop().toUpperCase();
    
    dropZone.innerHTML = `
        <div class="file-selected-display">
            <div class="file-icon-large">
                <i class="fas fa-file-${getFileIcon(fileExt)}"></i>
            </div>
            <div class="file-details">
                <h5 class="file-name">${file.name}</h5>
                <p class="file-size">${fileSize} MB • ${fileExt}</p>
            </div>
            <button type="button" class="btn-remove-file" onclick="removeSelectedFile()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    dropZone.style.borderColor = '#10b981';
    dropZone.style.background = 'rgba(16, 185, 129, 0.05)';
}

function getFileIcon(ext) {
    switch(ext.toLowerCase()) {
        case 'pdf': return 'pdf';
        case 'docx':
        case 'doc': return 'word';
        case 'txt': return 'alt';
        default: return 'alt';
    }
}

window.removeSelectedFile = function() {
    selectedFile = null;
    fileInput.value = '';
    dropZone.innerHTML = originalDropZoneHTML;
    dropZone.style.borderColor = '#cbd5e1';
    dropZone.style.background = '#f8fafc';
}

// Upload Resume
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
        alert('Please select a file first!');
        return;
    }
    
    const formData = new FormData();
    formData.append('resume', selectedFile);
    formData.append('college', document.getElementById('resumeCollege').value);
    formData.append('degree', document.getElementById('resumeDegree').value);
    
    document.getElementById('uploadSpinner').classList.remove('d-none');
    
    try {
        const response = await fetch(`${API_URL}/api/upload-resume`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        
        const data = await response.json();
        document.getElementById('uploadSpinner').classList.add('d-none');
        
        if (data.success) {
            document.getElementById('uploadResult').innerHTML = `
                <div class="alert alert-success">
                    <h5><i class="fas fa-check-circle me-2"></i>Resume Uploaded Successfully!</h5>
                    <p><strong>Name:</strong> ${data.data.name}</p>
                    <p><strong>Email:</strong> ${data.data.email || 'Not found'}</p>
                    <p><strong>College:</strong> ${data.data.college || 'Not provided'}</p>
                    <p><strong>Skills:</strong></p>
                    <div>${data.data.skills && data.data.skills.length > 0 ? data.data.skills.map(s => `<span class="skill-badge">${s}</span>`).join('') : '<span class="text-muted">No skills detected</span>'}</div>
                </div>
            `;
            removeSelectedFile();
            document.getElementById('resumeCollege').value = '';
            document.getElementById('resumeDegree').value = '';
        } else {
            document.getElementById('uploadResult').innerHTML = `<div class="alert alert-danger"><strong>Error:</strong> ${data.error || 'Upload failed'}</div>`;
        }
    } catch (error) {
        document.getElementById('uploadSpinner').classList.add('d-none');
        document.getElementById('uploadResult').innerHTML = `<div class="alert alert-danger"><strong>Error:</strong> ${error.message}</div>`;
    }
});

// Search Resumes
document.getElementById('searchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('searchSpinner').classList.remove('d-none');
    
    try {
        const response = await fetch(`${API_URL}/api/search-resumes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                job_description: document.getElementById('jobDescription').value,
                top_k: 5
            })
        });
        
        const data = await response.json();
        document.getElementById('searchSpinner').classList.add('d-none');
        
        if (data.success && data.matches && data.matches.length > 0) {
            document.getElementById('searchResults').innerHTML = data.matches.map((m, i) => `
                <div class="result-card">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <h5 class="mb-0"><i class="fas fa-user me-2"></i>#${i+1} ${m.name}</h5>
                        <span class="badge bg-primary">${(m.match_score * 100).toFixed(1)}%</span>
                    </div>
                    <p class="mb-2"><i class="fas fa-envelope me-2"></i>${m.email || 'N/A'}</p>
                    <p class="mb-2"><strong>Skills:</strong></p>
                    <div>${m.skills && m.skills.length > 0 ? m.skills.map(s => `<span class="skill-badge">${s}</span>`).join('') : '<span class="text-muted">No skills</span>'}</div>
                </div>
            `).join('');
        } else {
            document.getElementById('searchResults').innerHTML = '<div class="alert alert-warning">No matches found</div>';
        }
    } catch (error) {
        document.getElementById('searchSpinner').classList.add('d-none');
        document.getElementById('searchResults').innerHTML = '<div class="alert alert-danger">Error searching</div>';
    }
});

// Post Job
document.getElementById('jobForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('jobSpinner').classList.remove('d-none');
    
    try {
        const response = await fetch(`${API_URL}/api/add-job`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                title: document.getElementById('jobTitle').value,
                company: document.getElementById('jobCompany').value,
                location: document.getElementById('jobLocation').value,
                description: document.getElementById('jobDesc').value,
                requirements: document.getElementById('jobRequirements').value
            })
        });
        
        const data = await response.json();
        document.getElementById('jobSpinner').classList.add('d-none');
        
        if (data.success) {
            document.getElementById('jobResult').innerHTML = '<div class="alert alert-success">Job posted successfully!</div>';
            document.getElementById('jobForm').reset();
        } else {
            document.getElementById('jobResult').innerHTML = `<div class="alert alert-danger">${data.error || 'Failed'}</div>`;
        }
    } catch (error) {
        document.getElementById('jobSpinner').classList.add('d-none');
        document.getElementById('jobResult').innerHTML = '<div class="alert alert-danger">Error posting job</div>';
    }
});

// Match Jobs
document.getElementById('matchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    document.getElementById('matchSpinner').classList.remove('d-none');
    
    try {
        const response = await fetch(`${API_URL}/api/match-jobs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                resume_text: document.getElementById('resumeText').value
            })
        });
        
        const data = await response.json();
        document.getElementById('matchSpinner').classList.add('d-none');
        
        if (data.success && data.jobs && data.jobs.length > 0) {
            document.getElementById('matchResults').innerHTML = data.jobs.map((j, i) => `
                <div class="result-card">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <h5 class="mb-0"><i class="fas fa-briefcase me-2"></i>#${i+1} ${j.title}</h5>
                        <span class="badge bg-success">${(j.match_score * 100).toFixed(1)}%</span>
                    </div>
                    <p class="mb-2"><i class="fas fa-building me-2"></i>${j.company}</p>
                    <p class="mb-2"><i class="fas fa-map-marker-alt me-2"></i>${j.location}</p>
                </div>
            `).join('');
        } else {
            document.getElementById('matchResults').innerHTML = '<div class="alert alert-warning">No jobs found</div>';
        }
    } catch (error) {
        document.getElementById('matchSpinner').classList.add('d-none');
        document.getElementById('matchResults').innerHTML = '<div class="alert alert-danger">Error matching jobs</div>';
    }
});

// Load College Resumes
async function loadCollegeResumes() {
    try {
        const response = await fetch(`${API_URL}/api/get-college-resumes`, { credentials: 'include' });
        const data = await response.json();
        
        if (data.success && data.resumes && data.resumes.length > 0) {
            document.getElementById('studentsList').innerHTML = `
                <h5 class="mb-3">College Student Resumes</h5>
                ${data.resumes.map(r => `
                    <div class="result-card mb-3">
                        <h5><i class="fas fa-user-graduate me-2"></i>${r.name}</h5>
                        <p><strong>College:</strong> ${r.college}</p>
                        <p><strong>Degree:</strong> ${r.degree}</p>
                        <p><strong>Email:</strong> ${r.email || 'N/A'}</p>
                        <p><strong>Skills:</strong></p>
                        <div>${r.skills && r.skills.length > 0 ? r.skills.map(s => `<span class="skill-badge">${s}</span>`).join('') : 'None'}</div>
                    </div>
                `).join('')}
            `;
        } else {
            document.getElementById('studentsList').innerHTML = '<div class="alert alert-info">No college resumes yet. Upload resumes with college information!</div>';
        }
    } catch (error) {
        document.getElementById('studentsList').innerHTML = '<div class="alert alert-danger">Error loading resumes</div>';
    }
}

// Chatbot
document.getElementById('chatbotToggle').addEventListener('click', () => {
    document.getElementById('chatbotWindow').classList.toggle('d-none');
});

document.getElementById('chatbotClose').addEventListener('click', () => {
    document.getElementById('chatbotWindow').classList.add('d-none');
});

document.querySelectorAll('.option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const option = btn.dataset.option;
        const responses = {
            upload: 'Go to Upload Resume tab, enter college/degree, select file, and click Upload.',
            search: 'Enter job description in Search Resumes tab to find matching candidates.',
            score: 'Scores range 0-100%. Higher = better match. 70%+ = excellent.',
            contact: 'Fill form below:'
        };
        
        if (option === 'contact') {
            document.getElementById('contactForm').style.display = 'block';
            document.querySelector('.quick-options').style.display = 'none';
        } else {
            const msg = document.createElement('div');
            msg.className = 'chat-message bot-message';
            msg.innerHTML = `<p><strong>Bot:</strong> ${responses[option]}</p>`;
            document.getElementById('chatbotBody').appendChild(msg);
        }
    });
});

document.getElementById('adminContactForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    try {
        const response = await fetch(`${API_URL}/api/contact-admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                name: document.getElementById('contactName').value,
                email: document.getElementById('contactEmail').value,
                phone: document.getElementById('contactPhone').value,
                message: document.getElementById('contactMessage').value
            })
        });
        
        if (response.ok) {
            alert('Message sent!');
            document.getElementById('adminContactForm').reset();
            document.getElementById('contactForm').style.display = 'none';
            document.querySelector('.quick-options').style.display = 'flex';
        }
    } catch (error) {
        alert('Error sending message');
    }
});

console.log('ResumeRAG loaded!');