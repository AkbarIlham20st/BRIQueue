const axios = require('axios');
// Pastikan dotenv di-load untuk bisa membaca file .env
require('dotenv').config({ path: '../.env' });

async function testExchangeRateApi() {
    console.log('--- Memulai Tes API ExchangeRate ---');
    
    const apiKey = process.env.EXCHANGERATE_API_KEY;
    if (!apiKey) {
        console.error('GAGAL: EXCHANGERATE_API_KEY tidak ditemukan di file .env');
        return;
    }

    // Menggunakan URL yang sama persis dengan yang ada di service sinkronisasi kita
    const apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/IDR`;
    console.log(`Menghubungi URL: ${apiUrl}\n`);

    try {
        const response = await axios.get(apiUrl);

        if (response.data && response.data.result === 'success') {
            console.log('✅ SUKSES: Berhasil mendapatkan respons dari API.');
            console.log('--------------------------------------------------');
            
            // Cetak seluruh object conversion_rates untuk kita lihat
            console.log('Data Mentah (conversion_rates):');
            console.log(response.data.conversion_rates);
            console.log('--------------------------------------------------\n');

            // Sekarang kita coba hitung nilai tukarnya
            console.log('Hasil Perhitungan Nilai Tukar (per 1 mata uang asing):');
            const rates = response.data.conversion_rates;
            const targetCurrencies = ['USD', 'SGD', 'JPY'];

            targetCurrencies.forEach(currency => {
                if (rates[currency]) {
                    const idrPerUnit = 1 / rates[currency];
                    console.log(`- 1 ${currency} = ${idrPerUnit.toFixed(2)} IDR`);
                } else {
                    console.log(`- Mata uang ${currency} tidak ditemukan dalam data.`);
                }
            });

        } else {
            console.error('❌ GAGAL: Respons dari API tidak sukses.');
            console.log('Detail Respons:', response.data);
        }
    } catch (error) {
        console.error('❌ GAGAL KRITIS: Tidak bisa terhubung ke API.');
        console.error('Pesan Error:', error.message);
    }
}

// Jalankan fungsi tes
testExchangeRateApi();