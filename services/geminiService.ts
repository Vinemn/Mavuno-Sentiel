// Fix: Implement real Gemini API call and add fallback to mock data.
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import type { Diagnosis } from '../types';

/**
 * Diagnoses a plant disease using Gemini from an uploaded image.
 * @param {object} imageData - The image data for diagnosis.
 * @param {string} imageData.data - The base64 encoded image data.
 * @param {string} imageData.mimeType - The MIME type of the image.
 * @param {string} [userQuery] - Optional text query from the user.
 * @returns {Promise<Diagnosis>} A promise that resolves with the diagnosis result.
 */
export const diagnosePlantDisease = async (
    imageData: { data: string; mimeType: string },
    userQuery?: string
): Promise<Diagnosis> => {
  console.log(`Diagnosing with Gemini for uploaded image.`);

  // If API_KEY is not set, throw an error as we cannot proceed.
  if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set. Diagnosis with uploaded images is not available.");
    // Throw a generic error that the UI can catch and show a friendly message for.
    throw new Error('API service is not configured.');
  }

  try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const imagePart = {
          inlineData: {
              mimeType: imageData.mimeType,
              data: imageData.data,
          },
      };

      let promptText = `Diagnose the pest or disease in this image of a plant.`;
      if (userQuery && userQuery.trim().length > 0) {
        promptText += ` The farmer also noted the following: "${userQuery}"`;
      }
      
      const textPart = { text: promptText };

      const response: GenerateContentResponse = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: { parts: [imagePart, textPart] },
          config: {
              systemInstruction: `You are an expert agronomist for African smallholder farmers. You will be given an image of a plant and asked to diagnose it. Provide the common name of the plant (crop), common name of the disease or pest, scientific name, confidence level (0.0 to 1.0), a summary of key visual cues for identification, and a list of up to 3 specific visual features (cues) it identified in the image (e.g., 'window-paning', 'frass'). Respond ONLY with a JSON object.`,
              responseMimeType: "application/json",
              responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                      crop: { type: Type.STRING, description: "Common name of the plant, e.g., 'Maize'." },
                      label: { type: Type.STRING, description: "Common name of the disease or pest." },
                      confidence: { type: Type.NUMBER, description: "Confidence level of the diagnosis, from 0.0 to 1.0." },
                      explanation: { type: Type.STRING, description: "A summary of key visual cues for identification." },
                      pestName: { type: Type.STRING, description: "Scientific name of the pest or disease." },
                      cues: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of specific visual features the model identified." }
                  },
                  required: ["crop", "label", "confidence", "explanation", "pestName", "cues"]
              }
          }
      });
      
      if (!response.text || response.text.trim() === '') {
          throw new Error("Received empty response from Gemini API.");
      }

      // FIX: trim whitespace from JSON string before parsing
      const diagnosisResult: Diagnosis = JSON.parse(response.text.trim());
      return diagnosisResult;

  } catch (error) {
      // Log specific error for developers
      if (error instanceof SyntaxError) {
          console.error("Failed to parse Gemini API response as JSON.", error);
      } else {
          console.error("Error calling Gemini API. The request could not be completed.", error);
      }
      // Re-throw a new, generic error to be handled by the UI.
      // This prevents leaking details of the original error.
      throw new Error('An error occurred while communicating with the AI model.');
  }
};

/**
 * Generates text from a prompt using the Gemini model.
 * @param {string} prompt - The user's prompt.
 * @param {string} systemInstruction - The system instruction for the model.
 * @returns {Promise<string>} A promise that resolves with the generated text.
 */
export const generateText = async (prompt: string, systemInstruction: string): Promise<string> => {
    if (!process.env.API_KEY) {
        console.error("API_KEY environment variable not set.");
        throw new Error('API service is not configured.');
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
            },
        });
        
        if (!response.text || response.text.trim() === '') {
          throw new Error("Received empty response from Gemini API.");
        }

        return response.text.trim();

    } catch (error) {
        console.error("Error calling Gemini API for text generation.", error);
        throw new Error('An error occurred while communicating with the AI model.');
    }
};


/**
 * Generates speech from text using the Gemini TTS model.
 * @param {string} text - The text to convert to speech.
 * @param {string} lang - The language code for the speech.
 * @returns {Promise<string>} A promise that resolves with the base64 encoded audio data.
 */
export const generateSpeech = async (text: string): Promise<string> => {
    if (!process.env.API_KEY) {
        console.error("API_KEY environment variable not set.");
        // Throw a generic error.
        throw new Error('API service is not configured.');
    }
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        // Using a consistent, clear voice for the guide
                        prebuiltVoiceConfig: { voiceName: 'Zephyr' },
                    },
                },
            },
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data received from API.");
        }
        return base64Audio;

    } catch (error) {
        console.error("Error calling Gemini TTS API.", error);
        // Re-throw a new, generic error.
        throw new Error('An error occurred while generating speech.');
    }
};