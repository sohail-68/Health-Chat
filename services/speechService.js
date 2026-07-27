const speech = require('@google-cloud/speech');
const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const path = require('path');

class SpeechService {
  constructor() {
    this.speechClient = new speech.SpeechClient();
    this.ttsClient = new textToSpeech.TextToSpeechClient();
  }
  
  // Convert audio to text (Speech-to-Text)
  async speechToText(audioFilePath) {
    try {
      const audioBytes = fs.readFileSync(audioFilePath).toString('base64');
      
      const request = {
        audio: { content: audioBytes },
        config: {
          encoding: 'WEBM_OPUS',
          sampleRateHertz: 48000,
          languageCode: 'hi-IN',
          alternativeLanguageCodes: ['en-IN'],
          enableAutomaticPunctuation: true,
        },
      };
      
      const [response] = await this.speechClient.recognize(request);
      const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');
      
      return transcription || "Kuch sunai nahi diya";
      
    } catch (error) {
      console.error('STT Error:', error);
      return null;
    }
  }
  
  // Convert text to audio (Text-to-Speech)
  async textToSpeech(text, language = 'hi-IN') {
    try {
      const request = {
        input: { text: text },
        voice: {
          languageCode: language,
          name: language === 'hi-IN' ? 'hi-IN-Standard-A' : 'en-IN-Standard-A',
          ssmlGender: 'FEMALE',
        },
        audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0 },
      };
      
      const [response] = await this.ttsClient.synthesizeSpeech(request);
      
      const filename = `response_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`;
      const filepath = path.join(__dirname, '..', 'uploads', 'audio', filename);
      
      fs.writeFileSync(filepath, response.audioContent, 'binary');
      
      return {
        success: true,
        audioUrl: `/uploads/audio/${filename}`,
        filepath: filepath
      };
      
    } catch (error) {
      console.error('TTS Error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new SpeechService();