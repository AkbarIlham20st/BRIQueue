const tellerModel = require('../models/tellerModel');
const { textToSpeech } = require('../utils/tts');

exports.callNextQueue = async (req, res) => {
  try {
    const tellerIp = req.ip;
    const teller = await tellerModel.getTellerByIp(tellerIp);
    
    if (!teller) {
      return res.status(403).json({ error: 'IP tidak terdaftar sebagai teller' });
    }

    const queue = await tellerModel.callNextQueue(teller.id);
    
    if (!queue) {
      return res.status(404).json({ message: 'Tidak ada antrian yang menunggu' });
    }

    // Generate audio untuk nomor antrian
    const audioUrl = await textToSpeech(`Nomor antrian ${queue.queue_number} menuju ${teller.name}`);
    
    res.json({
      queue,
      teller,
      audioUrl,
      message: `Nomor antrian ${queue.queue_number} berhasil dipanggil`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.recallLastQueue = async (req, res) => {
  try {
    const tellerIp = req.ip;
    const teller = await tellerModel.getTellerByIp(tellerIp);
    
    if (!teller) {
      return res.status(403).json({ error: 'IP tidak terdaftar sebagai teller' });
    }

    const queue = await tellerModel.recallLastQueue(teller.id);
    
    if (!queue) {
      return res.status(404).json({ message: 'Tidak ada antrian sebelumnya' });
    }

    // Generate audio untuk nomor antrian
    const audioUrl = await textToSpeech(`Nomor antrian ${queue.queue_number} menuju ${teller.name}`);
    
    res.json({
      queue,
      teller,
      audioUrl,
      message: `Nomor antrian ${queue.queue_number} berhasil dipanggil ulang`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.completeQueue = async (req, res) => {
  try {
    const { queueId } = req.params;
    const queue = await tellerModel.completeQueue(queueId);
    
    if (!queue) {
      return res.status(404).json({ message: 'Antrian tidak ditemukan' });
    }
    
    res.json({ 
      message: `Antrian ${queue.queue_number} selesai`,
      queue 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.generateQueue = async (req, res) => {
  try {
    const queueNumber = await tellerModel.generateQueueNumber();
    const queue = await tellerModel.createQueue(queueNumber);
    
    res.json({
      message: 'Nomor antrian berhasil dibuat',
      queue
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getActiveQueues = async (req, res) => {
  try {
    const queues = await tellerModel.getActiveQueues();
    res.json(queues);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};