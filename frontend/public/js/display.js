document.addEventListener('DOMContentLoaded', () => {
  const activeQueuesEl = document.getElementById('active-queues');
  const currencyTableBody = document.querySelector('#currency-table tbody');
  const infoTextEl = document.getElementById('info-text');
  const videoContainer = document.getElementById('video-container');
  const currentTimeEl = document.getElementById('current-time');
  
  let currentVideoIndex = 0;
  let videoElements = [];
  let videoTimeout;
  
  // Update current time
  function updateCurrentTime() {
    const now = new Date();
    currentTimeEl.textContent = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }) + ' ' + now.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
  
  setInterval(updateCurrentTime, 1000);
  updateCurrentTime();
  
  // Load display data
  function loadDisplayData() {
    fetch('/api/display')
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then(data => {
        updateActiveQueues(data.activeQueues);
        updateCurrencyRates(data.currencyRates);
        updateInfoText(data.displayContents);
        setupVideos(data.displayContents);
      })
      .catch(error => {
        console.error('Error loading display data:', error);
        // Fallback content if API fails
        showFallbackContent();
      });
  }
  
  // Show fallback content when API fails
  function showFallbackContent() {
    activeQueuesEl.innerHTML = '<div class="no-queue">Sistem antrian sedang offline</div>';
    currencyTableBody.innerHTML = `
      <tr><td colspan="3">Data kurs tidak tersedia</td></tr>
    `;
    infoTextEl.textContent = 'Selamat datang di Bank Kami. Mohon maaf atas ketidaknyamanan ini.';
    
    // Fallback video
    if (videoElements.length === 0) {
      videoContainer.innerHTML = `
        <video class="display-video" autoplay muted loop>
          <source src="/uploads/videos/video1.mp4" type="video/mp4">
          Browser Anda tidak mendukung pemutaran video.
        </video>
      `;
    }
  }
  
  // Update active queues display
  function updateActiveQueues(queues) {
    if (!queues || queues.length === 0) {
      activeQueuesEl.innerHTML = '<div class="no-queue">Tidak ada antrian yang dipanggil</div>';
      return;
    }
    
    activeQueuesEl.innerHTML = '';
    
    queues.forEach(queue => {
      const queueEl = document.createElement('div');
      queueEl.className = 'active-queue';
      
      queueEl.innerHTML = `
        <div class="queue-number">${queue.queue_number}</div>
        <div class="queue-teller">${queue.teller_name || 'Teller'}</div>
        <div class="queue-counter">Loket ${queue.counter_number || ''}</div>
      `;
      
      activeQueuesEl.appendChild(queueEl);
    });
  }
  
  // Update currency rates
  function updateCurrencyRates(rates) {
    currencyTableBody.innerHTML = '';
    
    if (!rates || rates.length === 0) {
      currencyTableBody.innerHTML = '<tr><td colspan="3">Data kurs sedang diperbarui</td></tr>';
      return;
    }
    
    rates.forEach(rate => {
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td>${rate.currency_code}</td>
        <td>${rate.buy_rate?.toLocaleString('id-ID') || '-'}</td>
        <td>${rate.sell_rate?.toLocaleString('id-ID') || '-'}</td>
      `;
      
      currencyTableBody.appendChild(row);
    });
  }
  
  // Update info text
  function updateInfoText(contents) {
    if (!contents || contents.length === 0) {
      infoTextEl.textContent = 'Selamat datang di Bank Kami. Terima kasih atas kunjungan Anda.';
      return;
    }
    
    const infoContent = contents.find(c => c.content_type === 'info');
    infoTextEl.textContent = infoContent?.content_value || 
      'Selamat datang di Bank Kami. Terima kasih atas kunjungan Anda.';
  }
  
  // Setup videos from database
  function setupVideos(contents) {
    // Clear existing videos and timeouts
    videoContainer.innerHTML = '';
    videoElements = [];
    clearTimeout(videoTimeout);
    
    // Filter and sort video contents
    const videoContents = (contents || [])
      .filter(c => c.content_type === 'video' && c.is_active)
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
    
    if (videoContents.length === 0) {
      showDefaultVideo();
      return;
    }
    
    // Create video elements
    videoContents.forEach((video, index) => {
      const videoEl = document.createElement('video');
      videoEl.className = 'display-video';
      videoEl.src = video.content_value;
      videoEl.autoplay = index === 0;
      videoEl.muted = true;
      videoEl.loop = false;
      videoEl.style.display = index === 0 ? 'block' : 'none';
      
      videoEl.addEventListener('loadedmetadata', () => {
        console.log(`Video loaded: ${video.content_value} (Duration: ${video.duration}s)`);
      });
      
      videoEl.addEventListener('error', (e) => {
        console.error('Error loading video:', video.content_value, e);
      });
      
      videoContainer.appendChild(videoEl);
      
      videoElements.push({
        element: videoEl,
        duration: (video.duration || 30) * 1000 // Convert to milliseconds
      });
    });
    
    // Start video rotation if we have videos
    if (videoElements.length > 0) {
      rotateVideos();
    } else {
      showDefaultVideo();
    }
  }
  
  // Show default video when no videos configured
  function showDefaultVideo() {
    videoContainer.innerHTML = `
      <video class="display-video" autoplay muted loop>
        <source src="/videos/default.mp4" type="video/mp4">
        Browser Anda tidak mendukung pemutaran video.
      </video>
    `;
  }
  
  // Rotate videos based on duration from database
  function rotateVideos() {
    if (videoElements.length === 0) return;
    
    // Hide current video
    videoElements.forEach(video => {
      video.element.style.display = 'none';
      video.element.pause();
    });
    
    // Move to next video (with loop)
    currentVideoIndex = (currentVideoIndex + 1) % videoElements.length;
    const currentVideo = videoElements[currentVideoIndex];
    
    // Show and play next video
    currentVideo.element.style.display = 'block';
    currentVideo.element.currentTime = 0;
    
    const playPromise = currentVideo.element.play();
    
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error('Video play failed:', error);
        // Skip to next video if playback fails
        videoTimeout = setTimeout(rotateVideos, 1000);
      });
    }
    
    // Schedule next rotation based on duration from database
    videoTimeout = setTimeout(rotateVideos, currentVideo.duration);
  }
  
  // Initial load
  loadDisplayData();
  
  // Poll for updates every 5 seconds
  setInterval(loadDisplayData, 5000);
  
  // Handle visibility change to pause/resume videos
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Page is hidden, pause videos
      clearTimeout(videoTimeout);
      videoElements.forEach(video => {
        video.element.pause();
      });
    } else {
      // Page is visible again, resume playback
      if (videoElements.length > 0 && videoElements[currentVideoIndex]) {
        videoElements[currentVideoIndex].element.play()
          .then(() => {
            // Restart rotation timer
            const elapsed = Date.now() - lastRotationTime;
            const remaining = Math.max(0, videoElements[currentVideoIndex].duration - elapsed);
            videoTimeout = setTimeout(rotateVideos, remaining);
          })
          .catch(error => {
            console.error('Resume playback failed:', error);
            rotateVideos(); // Force rotate if resume fails
          });
      }
    }
  });
  
  // Track last rotation time for resume
  let lastRotationTime = Date.now();
});