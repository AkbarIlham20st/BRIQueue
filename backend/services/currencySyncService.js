const axios = require('axios');
const db = require('../config/db');
require('dotenv').config({ path: '../../.env' });

const syncCurrencyRates = async () => {
    console.log('[SYNC] Memulai sinkronisasi kurs mata uang...');

    try {
        const apiKey = process.env.EXCHANGERATE_API_KEY;
        if (!apiKey) {
            console.error('[SYNC-ERROR] EXCHANGERATE_API_KEY tidak ditemukan di file .env');
            return;
        }

        const response = await axios.get(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/IDR`);

        if (response.data && response.data.result === 'success') {
            const rates = response.data.conversion_rates;
            
            // Definisikan mata uang yang Anda inginkan (misalnya 3 ini)
            const targetCurrencies = ['USD', 'SGD', 'JPY'];

            for (const currency of targetCurrencies) {
                if (rates[currency]) {
                    const idrPerUnit = 1 / rates[currency];
                    const buyRate = idrPerUnit * 0.98;
                    const sellRate = idrPerUnit * 1.02;

                    // ✅ MENGGUNAKAN PERINTAH UPSERT (INSERT ON CONFLICT UPDATE)
                    const upsertQuery = `
                        INSERT INTO currency_rates (currency_code, buy_rate, sell_rate, updated_at)
                        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
                        ON CONFLICT (currency_code) 
                        DO UPDATE SET
                            buy_rate = EXCLUDED.buy_rate,
                            sell_rate = EXCLUDED.sell_rate,
                            updated_at = CURRENT_TIMESTAMP;
                    `;

                    await db.query(upsertQuery, [currency, buyRate.toFixed(2), sellRate.toFixed(2)]);
                }
            }
            console.log('[SYNC] Sinkronisasi kurs mata uang berhasil diselesaikan.');
        } else {
            console.error('[SYNC-ERROR] Respons dari API eksternal tidak valid.');
        }
    } catch (error) {
        console.error('[SYNC-ERROR] Gagal melakukan sinkronisasi:', error.message);
    }
};

module.exports = { syncCurrencyRates };