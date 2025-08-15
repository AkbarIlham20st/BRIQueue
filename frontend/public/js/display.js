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
      .then(response => response.json())
      .then(data => {
        updateActiveQueues(data.activeQueues);
        updateCurrencyRates(data.currencyRates);
        updateInfoText(data.displayContents);
        setupVideos(data.displayContents);
      })
      .catch(error => {
        console.error('Error loading display data:', error);
      });
  }
  
  // Update active queues display
  function updateActiveQueues(queues) {
    activeQueuesEl.innerHTML = '';
    
    const calledQueues = queues.filter(q => q.status === 'Dipanggil');
    
    if (calledQueues.length === 0) {
      activeQueuesEl.innerHTML = '<div class="no-queue">Tidak ada antrian yang dipanggil</div>';
      return;
    }
    
    calledQueues.forEach(queue => {
      const queueEl = document.createElement('div');
      queueEl.className = 'active-queue';
      
      queueEl.innerHTML = `
        <div class="queue-number">${queue.queue_number}</div>
        <div class="queue-teller">${queue.teller_name}</div>
      `;
      
      activeQueuesEl.appendChild(queueEl);
    });
  }
  
  // Update currency rates
  function updateCurrencyRates(rates) {
    currencyTableBody.innerHTML = '';
    
    rates.forEach(rate => {
      const row = document.createElement('tr');
      
      row.innerHTML = `
        <td>${rate.currency_code}</td>
        <td>${rate.buy_rate.toLocaleString('id-ID')}</td>
        <td>${rate.sell_rate.toLocaleString('id-ID')}</td>
      `;
      
      currencyTableBody.appendChild(row);
    });
  }
  
  // Update info text
  function updateInfoText(contents) {
    const infoContent = contents.find(c => c.content_type === 'info');
    if (infoContent) {
      infoTextEl.textContent = infoContent.content_value;
    } else {
      infoTextEl.textContent = 'Selamat datang di Bank Kami. Terima kasih atas kunjungan Anda.';
    }
  }
  
  // Setup videos
  function setupVideos(contents) {
    // Clear existing videos
    videoContainer.innerHTML = '';
    videoElements = [];
    clearTimeout(videoTimeout);
    
    const videoContents = contents.filter(c => c.content_type === 'video');
    
    if (videoContents.length === 0) {
      // Default video if none configured
      videoContainer.innerHTML = `
        <iframe width="100%" height="100%" src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1&loop=1" 
                frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
      `;
      return;
    }
    
    // Create video elements
    videoContents.forEach((video, index) => {
      let videoEl;
      
      if (video.content_value.includes('youtube.com') || video.content_value.includes('youtu.be')) {
        // YouTube video
        const videoId = video.content_value.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)[1];
        videoEl = document.createElement('iframe');
        videoEl.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}`;
        videoEl.setAttribute('frameborder', '0');
        videoEl.setAttribute('allow', 'autoplay; encrypted-media');
        videoEl.setAttribute('allowfullscreen', '');
      } else {
        // MP4 video
        videoEl = document.createElement('video');
        videoEl.src = video.content_value;
        videoEl.autoplay = true;
        videoEl.muted = true;
        videoEl.loop = false;
      }
      
      videoEl.className = 'display-video';
      videoEl.style.display = index === 0 ? 'block' : 'none';
      videoContainer.appendChild(videoEl);
      
      videoElements.push({
        element: videoEl,
        duration: video.duration * 1000 || 30000 // default to 30 seconds
      });
    });
    
    // Start video rotation
    rotateVideos();
  }
  
  // Rotate videos
  function rotateVideos() {
    if (videoElements.length === 0) return;
    
    // Hide current video
    videoElements.forEach(video => {
      video.element.style.display = 'none';
    });
    
    // Show next video
    currentVideoIndex = (currentVideoIndex + 1) % videoElements.length;
    videoElements[currentVideoIndex].element.style.display = 'block';
    
    // If it's a video element (not iframe), replay it
    if (videoElements[currentVideoIndex].element.tagName.toLowerCase() === 'video') {
      videoElements[currentVideoIndex].element.currentTime = 0;
      videoElements[currentVideoIndex].element.play();
    }
    
    // Schedule next rotation
    videoTimeout = setTimeout(rotateVideos, videoElements[currentVideoIndex].duration);
  }
  
  // Initial load
  loadDisplayData();
  
  // Poll for updates every 5 seconds
  setInterval(loadDisplayData, 5000);
});