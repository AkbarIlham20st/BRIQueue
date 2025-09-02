const axios = require('axios');
const db = require('../config/db');
require('dotenv').config({ path: '../../.env' });

const syncCurrencyRates = async () => {
    console.log('\n--- [DEBUG SYNC] Memulai Proses Sinkronisasi Kurs ---');
    try {
        const apiKey = process.env.EXCHANGERATE_API_KEY;
        if (!apiKey) {
            console.error('[DEBUG SYNC-ERROR] API Key tidak ditemukan!');
            return;
        }

        const apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/IDR`;
        console.log(`[DEBUG SYNC] Menghubungi API di: ${apiUrl}`);

        const response = await axios.get(apiUrl);

        if (response.data && response.data.result === 'success') {
            console.log('[DEBUG SYNC] Berhasil mendapatkan data dari API.');
            const rates = response.data.conversion_rates;
            
            const targetCurrencies = ['USD', 'SGD', 'JPY'];
            console.log('[DEBUG SYNC] Mata uang target:', targetCurrencies);

            for (const currency of targetCurrencies) {
                if (rates[currency]) {
                    const idrPerUnit = 1 / rates[currency];
                    const buyRate = idrPerUnit * 0.98;
                    const sellRate = idrPerUnit * 1.02;

                    console.log(`[DEBUG SYNC] -> ${currency}: Jual=${sellRate.toFixed(2)}, Beli=${buyRate.toFixed(2)}`);

                    await db.query(
                        'UPDATE currency_rates SET buy_rate = $1, sell_rate = $2, updated_at = CURRENT_TIMESTAMP WHERE currency_code = $3',
                        [buyRate.toFixed(2), sellRate.toFixed(2), currency]
                    );
                } else {
                    console.log(`[DEBUG SYNC-WARN] Mata uang ${currency} tidak ditemukan di respons API.`);
                }
            }
            console.log('[DEBUG SYNC] Proses selesai.');
        } else {
            console.error('[DEBUG SYNC-ERROR] Respons API tidak sukses:', response.data);
        }
    } catch (error) {
        console.error('[DEBUG SYNC-FATAL] Terjadi error saat sinkronisasi:', error.message);
    }
};

module.exports = { syncCurrencyRates };