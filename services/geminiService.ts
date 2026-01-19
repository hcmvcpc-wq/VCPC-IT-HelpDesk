
import { GoogleGenAI } from "@google/genai";

// Always use named parameter for apiKey and obtain it directly from process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAITicketResponse = async (title: string, description: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `An IT ticket was submitted: 
      Title: ${title}
      Description: ${description}
      
      Provide a brief, professional initial response from IT helpdesk, suggesting possible quick fixes if applicable. Keep it under 100 words.`,
    });
    // Use the .text property directly
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Thank you for your ticket. Our IT team has been notified and will review your request shortly.";
  }
};

export const summarizeTickets = async (ticketsJson: string) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze these IT helpdesk tickets and provide a high-level executive summary of trends, common issues, and performance: ${ticketsJson}`,
    });
    // Use the .text property directly
    return response.text;
  } catch (error) {
    return "Summary generation currently unavailable.";
  }
};

export const chatWithAI = async (history: {role: 'user' | 'model', parts: {text: string}[]}[], message: string) => {
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
    // Use the .text property directly
    return response.text;
  } catch (error) {
    console.error("AI Chat Error:", error);
    return "Xin lỗi, tôi gặp chút trục trặc khi kết nối. Bạn có thể thử lại sau hoặc gửi yêu cầu hỗ trợ cho IT nhé!";
  }
};
