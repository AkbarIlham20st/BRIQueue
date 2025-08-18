document.addEventListener('DOMContentLoaded', function() {
  // Handle routing
  function handleRoute() {
    const hash = window.location.hash.substr(1) || 'dashboard';
    
    // Hide all sections
    document.querySelectorAll('main > section').forEach(section => {
      section.style.display = 'none';
    });
    
    // Show active section
    const activeSection = document.getElementById(hash);
    if (activeSection) {
      activeSection.style.display = 'block';
      
      // Load data sesuai section
      if (hash === 'videos') {
        loadVideos();
      } else if (hash === 'queues') {
        loadQueues();
      } else if (hash === 'settings') {
        loadSettings();
      }
    }
    
    // Update active menu
    document.querySelectorAll('.sidebar a').forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${hash}`);
    });
  }

  // Load videos data
  async function loadVideos() {
    try {
      const response = await fetch('/admin/api/videos');
      const videos = await response.json();
      
      const container = document.getElementById('videoContainer');
      container.innerHTML = `
        <h3>Upload New Video</h3>
        <input type="file" id="videoFile" accept="video/mp4">
        <button id="uploadBtn">Upload</button>
        
        <h3>Video List</h3>
        <div class="video-grid">
          ${videos.map(video => `
            <div class="video-card">
              <video src="${video.content_value}" controls></video>
              <div class="video-meta">
                <span>Order: ${video.display_order}</span>
                <span>Duration: ${video.duration}s</span>
                <button class="delete-btn" data-id="${video.id}">Delete</button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
      
      // Setup upload handler
      document.getElementById('uploadBtn').addEventListener('click', uploadVideo);
      
      // Setup delete handlers
      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          deleteVideo(this.dataset.id);
        });
      });
    } catch (error) {
      console.error('Failed to load videos:', error);
      document.getElementById('videoContainer').innerHTML = `
        <div class="error-message">
          Failed to load videos. Please try again.
        </div>
      `;
    }
  }

  // Load queues data
  async function loadQueues() {
    try {
      const response = await fetch('/admin/queues');
      if (!response.ok) throw new Error('Failed to load queues');
      
      const html = await response.text();
      document.getElementById('queues').innerHTML = html;
      
      // Initialize queue event listeners
      initQueueEventListeners();
    } catch (error) {
      console.error('Error loading queues:', error);
      document.getElementById('queues').innerHTML = `
        <div class="error-message">
          Failed to load queues. Please try again.
        </div>
      `;
    }
  }

  // Load settings data
  async function loadSettings() {
    try {
      const response = await fetch('/admin/settings');
      if (!response.ok) throw new Error('Failed to load settings');
      
      const html = await response.text();
      document.getElementById('settings').innerHTML = html;
      
      // Initialize settings event listeners
      initSettingsEventListeners();
    } catch (error) {
      console.error('Error loading settings:', error);
      document.getElementById('settings').innerHTML = `
        <div class="error-message">
          Failed to load settings. Please try again.
        </div>
      `;
    }
  }

  // Upload video function
  async function uploadVideo() {
    const fileInput = document.getElementById('videoFile');
    const file = fileInput.files[0];
    
    if (!file) {
      alert('Please select a video file first!');
      return;
    }

    const formData = new FormData();
    formData.append('videoFile', file);

    try {
      const response = await fetch('/admin/api/videos/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Upload failed');
      
      alert('Video uploaded successfully!');
      loadVideos();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + error.message);
    }
  }

  // Delete video function
  async function deleteVideo(id) {
    if (!confirm('Are you sure you want to delete this video?')) return;
    
    try {
      const response = await fetch(`/admin/api/videos/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        loadVideos();
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  }

  // Initialize queue event listeners
  function initQueueEventListeners() {
    // Call queue
    document.querySelectorAll('.btn-call').forEach(btn => {
      btn.addEventListener('click', async function() {
        const queueId = this.dataset.queueId;
        const tellerSelect = document.querySelector(`.teller-select[data-queue-id="${queueId}"]`);
        const tellerId = tellerSelect.value;

        if (!tellerId) {
          alert('Please select a teller');
          return;
        }

        try {
          const response = await fetch('/admin/api/queues/call', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ queueId, tellerId })
          });

          if (response.ok) {
            loadQueues();
          } else {
            alert('Failed to call queue');
          }
        } catch (error) {
          console.error('Error:', error);
          alert('An error occurred');
        }
      });
    });

    // Complete queue
    document.querySelectorAll('.btn-complete').forEach(btn => {
      btn.addEventListener('click', async function() {
        const queueId = this.dataset.queueId;
        
        if (!confirm('Complete this queue?')) return;

        try {
          const response = await fetch('/admin/api/queues/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ queueId })
          });

          if (response.ok) {
            loadQueues();
          } else {
            alert('Failed to complete queue');
          }
        } catch (error) {
          console.error('Error:', error);
          alert('An error occurred');
        }
      });
    });
  }

  // Initialize settings event listeners
  function initSettingsEventListeners() {
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
      changePasswordForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validation
        if (newPassword !== confirmPassword) {
          showMessage('New passwords do not match', 'error');
          return;
        }
        
        if (newPassword.length < 6) {
          showMessage('Password must be at least 6 characters', 'error');
          return;
        }
        
        try {
          const response = await fetch('/admin/settings/change-password', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              currentPassword,
              newPassword
            })
          });
          
          const result = await response.json();
          
          if (response.ok) {
            showMessage('Password changed successfully!', 'success');
            this.reset();
          } else {
            showMessage(result.message || 'Failed to change password', 'error');
          }
        } catch (error) {
          console.error('Error:', error);
          showMessage('An error occurred. Please try again.', 'error');
        }
      });
    }
  }

  // Show message function
  function showMessage(text, type) {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
      messageDiv.textContent = text;
      messageDiv.className = `message ${type}`;
      messageDiv.style.display = 'block';
      
      setTimeout(() => {
        messageDiv.style.display = 'none';
      }, 5000);
    }
  }

  // Event listeners
  window.addEventListener('hashchange', handleRoute);
  handleRoute(); // Initial load
});