document.addEventListener('DOMContentLoaded', () => {
  const nextBtn = document.getElementById('next-btn');
  const recallBtn = document.getElementById('recall-btn');
  const completeBtn = document.getElementById('complete-btn');
  const currentQueueNumber = document.getElementById('current-queue-number');
  const currentQueueTime = document.getElementById('current-queue-time');
  const queueList = document.getElementById('queue-list');
  const bellSound = document.getElementById('bell-sound');
  const queueSound = document.getElementById('queue-sound');
  
  let currentQueue = null;
  
  // Dapatkan data teller berdasarkan IP
  fetch('/api/teller/queues')
    .then(response => response.json())
    .then(queues => {
      updateQueueList(queues);
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Tidak dapat terhubung ke server');
    });
  
  // Next button handler
  nextBtn.addEventListener('click', () => {
    fetch('/api/teller/next')
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          alert(data.error);
          return;
        }
        
        currentQueue = data.queue;
        updateCurrentQueueDisplay();
        playQueueSound(data.audioUrl);
        updateQueueList([currentQueue, ...Array.from(queueList.children)
          .map(li => JSON.parse(li.dataset.queue))
          .filter(q => q.id !== currentQueue.id)]);
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Gagal memanggil antrian berikutnya');
      });
  });
  
  // Recall button handler
  recallBtn.addEventListener('click', () => {
    fetch('/api/teller/recall')
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          alert(data.error);
          return;
        }
        
        if (!data.queue) {
          alert('Tidak ada antrian sebelumnya');
          return;
        }
        
        currentQueue = data.queue;
        updateCurrentQueueDisplay();
        playQueueSound(data.audioUrl);
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Gagal memanggil ulang antrian');
      });
  });
  
  // Complete button handler
  completeBtn.addEventListener('click', () => {
    if (!currentQueue) return;
    
    fetch(`/api/teller/complete/${currentQueue.id}`, {
      method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        return;
      }
      
      currentQueue = null;
      updateCurrentQueueDisplay();
      
      // Refresh queue list
      return fetch('/api/teller/queues');
    })
    .then(response => response.json())
    .then(queues => {
      updateQueueList(queues);
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Gagal menyelesaikan antrian');
    });
  });
  
  function updateCurrentQueueDisplay() {
    if (currentQueue) {
      currentQueueNumber.textContent = currentQueue.queue_number;
      
      const calledAt = new Date(currentQueue.called_at);
      currentQueueTime.textContent = calledAt.toLocaleTimeString();
      
      completeBtn.disabled = false;
    } else {
      currentQueueNumber.textContent = '-';
      currentQueueTime.textContent = '-';
      completeBtn.disabled = true;
    }
  }
  
  function updateQueueList(queues) {
    queueList.innerHTML = '';
    
    queues.forEach(queue => {
      const li = document.createElement('li');
      li.dataset.queue = JSON.stringify(queue);
      
      const statusClass = queue.status === 'Dipanggil' ? 'called' : 'waiting';
      
      li.innerHTML = `
        <span class="queue-number ${statusClass}">${queue.queue_number}</span>
        <span class="queue-time">${new Date(queue.created_at).toLocaleTimeString()}</span>
        ${queue.teller_name ? `<span class="teller-name">${queue.teller_name}</span>` : ''}
      `;
      
      queueList.appendChild(li);
    });
  }
  
  function playQueueSound(audioUrl) {
    // Play bell sound
    bellSound.currentTime = 0;
    bellSound.play();
    
    // Play queue number sound after bell
    setTimeout(() => {
      queueSound.src = audioUrl;
      queueSound.play();
    }, 1000);
  }
  
  // Poll for queue updates every 5 seconds
  setInterval(() => {
    fetch('/api/teller/queues')
      .then(response => response.json())
      .then(queues => {
        // Only update if current queue is not being handled
        if (!currentQueue || currentQueue.status === 'Selesai') {
          updateQueueList(queues);
        }
      })
      .catch(error => console.error('Error polling queues:', error));
  }, 5000);
});