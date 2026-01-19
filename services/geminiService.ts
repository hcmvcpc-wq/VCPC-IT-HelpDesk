import { GoogleGenAI } from "@google/genai";

// Initialize AI safely to prevent top-level module errors
const getAIInstance = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("Gemini API Key is missing. AI features will be disabled.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

const ai = getAIInstance();

export const getAITicketResponse = async (title: string, description: string) => {
  if (!ai) return "Cảm ơn bạn. Yêu cầu đã được ghi nhận.";
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `An IT ticket was submitted: 
      Title: ${title}
      Description: ${description}
      
      Provide a brief, professional initial response from IT helpdesk, suggesting possible quick fixes if applicable. Keep it under 100 words.`,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Cảm ơn bạn. Đội ngũ IT sẽ xem xét yêu cầu của bạn sớm nhất có thể.";
  }
};

export const summarizeTickets = async (ticketsJson: string) => {
  if (!ai) return "Tính năng tóm tắt hiện không khả dụng.";
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze these IT helpdesk tickets and provide a high-level executive summary of trends, common issues, and performance: ${ticketsJson}`,
    });
    return response.text;
  } catch (error) {
    return "Không thể tạo tóm tắt lúc này.";
  }
};

export const chatWithAI = async (history: {role: 'user' | 'model', parts: {text: string}[]}[], message: string) => {
  if (!ai) return "Xin lỗi, trợ lý ảo hiện đang ngoại tuyến.";
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [...history, { role: 'user', parts: [{ text: message }] }],
      config: {
        systemInstruction: `You are VCPC IT Assistant, a professional and friendly IT expert. 
        Your goal is to help employees solve technical issues like: 
        - Software installation (Office 365, SAP, Zoom).
        - Hardware troubleshooting (Printers, monitors, slow laptops).
        - Network issues (WiFi, VPN, slow connection).
        - Security best practices (Phishing, strong passwords).
        Keep your answers concise, structured (using bullet points), and in Vietnamese. 
        If an issue is too complex, advise the user to "Gửi yêu cầu hỗ trợ" for a human technician to handle.`,
        temperature: 0.7,
      },
    });
    return response.text;
  } catch (error) {
    console.error("AI Chat Error:", error);
    return "Xin lỗi, tôi gặp chút trục trặc khi kết nối. Bạn có thể thử lại sau hoặc gửi yêu cầu hỗ trợ cho IT nhé!";
  }
};