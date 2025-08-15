document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const logoutBtn = document.getElementById('logout-btn');
  
  // Check if we're on login page or dashboard
  if (loginForm) {
    // Login form handler
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
      fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })
      .then(response => response.json())
      .then(data => {
        if (data.error) {
          alert(data.error);
          return;
        }
        
        // Save token to localStorage
        localStorage.setItem('adminToken', data.token);
        
        // Redirect to dashboard
        window.location.href = '/admin/dashboard';
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Login gagal');
      });
    });
  } else if (logoutBtn) {
    // Dashboard functionality
    let adminToken = localStorage.getItem('adminToken');
    
    if (!adminToken) {
      window.location.href = '/admin/login';
      return;
    }
    
    // Logout button handler
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('adminToken');
      window.location.href = '/admin/login';
    });
    
    // Load display contents
    loadDisplayContents();
    
    // Add video form handler
    const addVideoForm = document.getElementById('add-video-form');
    if (addVideoForm) {
      addVideoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const videoUrl = document.getElementById('video-url').value;
        const duration = document.getElementById('video-duration').value;
        const displayOrder = document.getElementById('video-order').value;
        
        fetch('/api/admin/videos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify({ videoUrl, duration, displayOrder }),
        })
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            alert(data.error);
            return;
          }
          
          alert('Video berhasil ditambahkan');
          document.getElementById('video-url').value = '';
          loadDisplayContents();
        })
        .catch(error => {
          console.error('Error:', error);
          alert('Gagal menambahkan video');
        });
      });
    }
    
    // Load currency rates
    loadCurrencyRates();
    
    // Currency form handler
    const currencyForm = document.getElementById('currency-form');
    if (currencyForm) {
      currencyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const rates = Array.from(document.querySelectorAll('.currency-rate')).map(input => ({
          currency_code: input.dataset.currency,
          buy_rate: parseFloat(input.querySelector('.buy-rate').value),
          sell_rate: parseFloat(input.querySelector('.sell-rate').value)
        }));
        
        fetch('/api/admin/currencies', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify({ rates }),
        })
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            alert(data.error);
            return;
          }
          
          alert('Kurs mata uang berhasil diperbarui');
        })
        .catch(error => {
          console.error('Error:', error);
          alert('Gagal memperbarui kurs mata uang');
        });
      });
    }
    
    // Info text form handler
    const infoForm = document.getElementById('info-form');
    if (infoForm) {
      infoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const text = document.getElementById('info-text').value;
        
        fetch('/api/admin/info', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify({ text }),
        })
        .then(response => response.json())
        .then(data => {
          if (data.error) {
            alert(data.error);
            return;
          }
          
          alert('Informasi berhasil diperbarui');
          loadDisplayContents();
        })
        .catch(error => {
          console.error('Error:', error);
          alert('Gagal memperbarui informasi');
        });
      });
    }
  }
  
  function loadDisplayContents() {
    fetch('/api/admin/contents', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        return;
      }
      
      // Update video list
      const videoList = document.getElementById('video-list');
      if (videoList) {
        videoList.innerHTML = '';
        
        data.contents
          .filter(content => content.content_type === 'video')
          .forEach(video => {
            const li = document.createElement('li');
            li.dataset.id = video.id;
            
            li.innerHTML = `
              <div class="video-item">
                <div class="video-info">
                  <span class="video-url">${video.content_value}</span>
                  <span class="video-duration">${video.duration} detik</span>
                  <span class="video-order">Urutan: ${video.display_order}</span>
                </div>
                <button class="btn btn-danger delete-video">Hapus</button>
              </div>
            `;
            
            videoList.appendChild(li);
          });
        
        // Add delete handlers
        document.querySelectorAll('.delete-video').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const contentId = e.target.closest('li').dataset.id;
            
            if (confirm('Apakah Anda yakin ingin menghapus video ini?')) {
              fetch(`/api/admin/contents/${contentId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${adminToken}`
                }
              })
              .then(response => response.json())
              .then(data => {
                if (data.error) {
                  alert(data.error);
                  return;
                }
                
                alert('Video berhasil dihapus');
                loadDisplayContents();
              })
              .catch(error => {
                console.error('Error:', error);
                alert('Gagal menghapus video');
              });
            }
          });
        });
      }
      
      // Update info text if exists
      const infoText = document.getElementById('info-text');
      if (infoText) {
        const infoContent = data.contents.find(c => c.content_type === 'info');
        if (infoContent) {
          infoText.value = infoContent.content_value || '';
        }
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Gagal memuat konten display');
    });
  }
  
  function loadCurrencyRates() {
    fetch('/api/admin/contents', {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        return;
      }
      
      const currencyFields = document.getElementById('currency-fields');
      if (currencyFields) {
        currencyFields.innerHTML = '';
        
        data.currencies.forEach(currency => {
          const currencyDiv = document.createElement('div');
          currencyDiv.className = 'currency-rate';
          currencyDiv.dataset.currency = currency.currency_code;
          
          currencyDiv.innerHTML = `
            <h4>${currency.currency_code}</h4>
            <div class="form-group">
              <label>Beli</label>
              <input type="number" class="buy-rate" step="0.01" value="${currency.buy_rate}" required>
            </div>
            <div class="form-group">
              <label>Jual</label>
              <input type="number" class="sell-rate" step="0.01" value="${currency.sell_rate}" required>
            </div>
          `;
          
          currencyFields.appendChild(currencyDiv);
        });
        
        // Add more currencies button
        const addCurrencyBtn = document.createElement('button');
        addCurrencyBtn.type = 'button';
        addCurrencyBtn.className = 'btn btn-secondary';
        addCurrencyBtn.textContent = 'Tambah Mata Uang';
        addCurrencyBtn.addEventListener('click', addNewCurrencyField);
        
        currencyFields.appendChild(addCurrencyBtn);
      }
    })
    .catch(error => {
      console.error('Error:', error);
      alert('Gagal memuat kurs mata uang');
    });
  }
  
  function addNewCurrencyField() {
    const currencyCode = prompt('Masukkan kode mata uang (3 huruf):', 'USD');
    if (!currencyCode || currencyCode.length !== 3) {
      alert('Kode mata uang harus 3 huruf');
      return;
    }
    
    const currencyFields = document.getElementById('currency-fields');
    const existingCurrency = document.querySelector(`.currency-rate[data-currency="${currencyCode}"]`);
    
    if (existingCurrency) {
      alert('Mata uang ini sudah ada');
      return;
    }
    
    const currencyDiv = document.createElement('div');
    currencyDiv.className = 'currency-rate';
    currencyDiv.dataset.currency = currencyCode;
    
    currencyDiv.innerHTML = `
      <h4>${currencyCode}</h4>
      <div class="form-group">
        <label>Beli</label>
        <input type="number" class="buy-rate" step="0.01" value="0" required>
      </div>
      <div class="form-group">
        <label>Jual</label>
        <input type="number" class="sell-rate" step="0.01" value="0" required>
      </div>
    `;
    
    // Insert before the add button
    const addBtn = currencyFields.querySelector('button');
    currencyFields.insertBefore(currencyDiv, addBtn);
  }
});