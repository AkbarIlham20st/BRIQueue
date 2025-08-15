const displayModel = require('../models/displayModel');

exports.getDisplayData = async (req, res) => {
  try {
    const displayData = await displayModel.getCurrentDisplayData();
    res.json(displayData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};