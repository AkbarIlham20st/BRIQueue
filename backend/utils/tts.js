const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const client = new textToSpeech.TextToSpeechClient();

module.exports.textToSpeech = async (text) => {
  const request = {
    input: { text },
    voice: { languageCode: 'id-ID', ssmlGender: 'FEMALE' },
    audioConfig: { audioEncoding: 'MP3' },
  };

  const [response] = await client.synthesizeSpeech(request);
  
  const fileName = `${uuidv4()}.mp3`;
  const filePath = path.join(__dirname, '../../frontend/public/sounds', fileName);
  
  fs.writeFileSync(filePath, response.audioContent, 'binary');
  
  return `/sounds/${fileName}`;
};