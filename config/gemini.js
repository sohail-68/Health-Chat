
// const { GoogleGenerativeAI } = require('@google/generative-ai');
// require("dotenv").config();
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// console.log(process.env.GEMINI_API_KEY,"helll");
// // server/config/gemini.js


// // ✅ SWITCH TO THIS MODEL - Higher free tier limits
// const getTextModel = () => {
//   return genAI.getGenerativeModel({ 
//     model: "gemini-2.0-flash-lite", // Lite version has better free quota
//     generationConfig: {
//       temperature: 0.7,
//       maxOutputTokens: 1000,
//     }
//   });
// };

// const getVisionModel = () => {
//   return genAI.getGenerativeModel({ 
//     model: "gemini-2.0-flash-lite", // Lite supports vision too
//     generationConfig: {
//       temperature: 0.7,
//       maxOutputTokens: 1000,
//     }
//   });
// };

// module.exports = { getTextModel, getVisionModel };


// async function test() {
//   try {
//     const model = genAI.getGenerativeModel({
//       model: "gemini-2.0-flash-lite",
//     });

//     const result = await model.generateContent("Hello");
//     const response = await result.response;

//     console.log(response.text());
//   } catch (err) {
//     console.error(err);
//   }
// }

// test();
// module.exports = { getTextModel, getVisionModel };

require("dotenv").config();

const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

module.exports = groq;