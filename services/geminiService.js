const { GoogleGenerativeAI } = require("@google/generative-ai");
const groq = require("../config/gemini");
const { Ollama } = require("ollama");
const axios = require("axios");
const Tesseract = require("tesseract.js");
const sharp = require("sharp");
// Optional
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);



class AIService {
 
  async getHealthResponse(userMessage, patientInfo, chatHistory = []) {
    try {
      console.log("🎯 GroqService.getHealthResponse called");

      const prompt = `
Tum ek medical AI assistant ho.

Patient Info:
- Age: ${patientInfo?.age || "Not given"}
- Allergies: ${patientInfo?.allergies?.join(", ") || "None"}
- Chronic diseases: ${patientInfo?.chronicDiseases?.join(", ") || "None"}

Previous conversation:
${chatHistory
  .map((c) => `${c.sender}: ${c.content}`)
  .join("\n")}

Patient ka sawaal:
${userMessage}

Rules:
1. Hinglish mein jawab do.
2. Empathetic raho.
3. Serious symptoms ho to doctor consult karne ki salah do.
4. Medicines prescribe mat karo.
`;

      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error("❌ Groq Error:", error);
      return "Maaf kijiye, AI service temporarily unavailable hai.";
    }
  }



async analyzeReportImage(imageBase64, userQuestion) {
  try {
    // Remove data:image/...;base64, prefix if present
    const cleanBase64 = imageBase64.replace(
      /^data:image\/[a-zA-Z0-9.+-]+;base64,/,
      ""
    );

    const response = await axios.post(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        model: "meta/llama-3.2-11b-vision-instruct",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  userQuestion ||
                  "Describe this image in detail."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${cleanBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 512,
        temperature: 0.7,
        stream: false,
      },
      {
        headers: {
          Authorization: "Bearer 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",
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        timeout: 120000,
      }
    );

    return (
      response.data?.choices?.[0]?.message?.content ||
      "No response received from NVIDIA Vision model."
    );
  } catch (err) {
    console.error(
      "NVIDIA Vision Error:",
      err.response?.data || err.message
    );

    return "Image analyze karne me error aayi.";
  }
}
}

module.exports = new AIService();