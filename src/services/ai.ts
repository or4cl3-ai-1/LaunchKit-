import { GoogleGenAI, Type } from "@google/genai";
import { BusinessIdea, UploadedFile } from "../types";
import mammoth from "mammoth";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, initialDelay = 2000): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const isQuotaError = error?.message?.includes('quota') || 
                          error?.status === 'RESOURCE_EXHAUSTED' || 
                          error?.code === 429;
      
      if (isQuotaError && i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.warn(`Quota exceeded. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export async function parseIdea(rawText: string, files: UploadedFile[] = []): Promise<Partial<BusinessIdea>> {
  return withRetry(async () => {
    const parts: any[] = [];
    
    const prompt = `Analyze the provided business idea, notes, or documents and answer the following 5 questions to define the core business logic.
    
    1. The Problem: What pain point are you solving?
    2. The Solution: What is your product or service?
    3. Target Audience: Who exactly is buying this?
    4. Pricing Strategy: How will you make money?
    5. Marketing Channels: How will you find your first 100 customers?
    
    If any of these details are not explicitly stated in the provided text or documents, you MUST infer, propose, or generate a highly logical and strategic answer based on the context of the business. DO NOT leave any field empty. Provide a complete, actionable business profile.`;

    let combinedText = `Raw Idea/Notes:\n${rawText}\n\n`;

    for (const file of files) {
      const base64Data = file.data.split(',')[1] || file.data;
      
      if (file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        try {
          const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)).buffer;
          const result = await mammoth.extractRawText({ arrayBuffer: buffer });
          combinedText += `\n--- Content from file: ${file.name} ---\n${result.value}\n`;
        } catch (err) {
          console.error(`Failed to extract text from .docx file ${file.name}:`, err);
        }
      } else if (file.mimeType.startsWith('text/') || file.mimeType === 'application/json' || file.mimeType === 'text/csv') {
        try {
          const text = atob(base64Data);
          combinedText += `\n--- Content from file: ${file.name} ---\n${text}\n`;
        } catch (err) {
          console.error(`Failed to decode text file ${file.name}:`, err);
        }
      } else if (['application/pdf', 'image/png', 'image/jpeg', 'image/webp'].includes(file.mimeType)) {
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: file.mimeType,
          }
        });
      }
    }

    parts.unshift({ text: `${prompt}\n\n${combinedText}` });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Use flash for fast parsing
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            problem: { type: Type.STRING, description: "The problem the business solves" },
            solution: { type: Type.STRING, description: "The proposed solution or product" },
            targetAudience: { type: Type.STRING, description: "Who the product is for" },
            pricingStrategy: { type: Type.STRING, description: "How the business will make money" },
            marketingChannels: { type: Type.STRING, description: "How they will acquire customers" },
          },
        },
      },
    });

    const text = response.text;
    if (!text) return {};
    return JSON.parse(text);
  }).catch(error => {
    console.error("Error parsing idea:", error);
    return {};
  });
}

export async function generateDeliverableContent(
  idea: BusinessIdea,
  vibe: string,
  category: string,
  title: string,
  feedback?: { rating: number; comment: string }
): Promise<string> {
  return withRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Switching to Flash to reduce Pro quota pressure and handle 429s better
      contents: `You are LaunchKit, an expert AI strategic partner.
      Generate a professional, high-fidelity business asset for a startup.
      
      Startup Details:
      - Problem: ${idea.problem}
      - Solution: ${idea.solution}
      - Target Audience: ${idea.targetAudience}
      - Pricing: ${idea.pricingStrategy}
      - Marketing: ${idea.marketingChannels}
      
      Brand Vibe: ${vibe}
      
      Asset Category: ${category}
      Asset Title: ${title}
      
      ${category.includes('Logo') ? `
      CRITICAL INSTRUCTION: You are generating a LOGO for this startup.
      1. Output ONLY a valid, high-quality SVG code.
      2. The SVG should be responsive (use viewBox, not fixed width/height).
      3. Use colors and shapes that match the Brand Vibe (${vibe}).
      4. The logo should be professional, modern, and represent the solution: ${idea.solution}.
      5. Do not include any text outside the <svg> tags.
      6. Ensure the SVG is clean and well-structured.
      ` : `
      Instructions:
      1. Write the content in Markdown format.
      2. Ensure the tone matches the requested Brand Vibe (${vibe}).
      3. Make it highly professional, actionable, and ready for investors or immediate use.
      4. Include specific, realistic examples, numbers, or strategies where applicable.
      5. Do not include generic filler text. Be concise and impactful.
      6. Structure with clear headings, bullet points, and bold text for readability.
      `}
      
      ${feedback ? `
      PREVIOUS FEEDBACK TO INCORPORATE:
      - User Rating: ${feedback.rating}/5
      - User Comment: "${feedback.comment}"
      
      CRITICAL INSTRUCTION: You are regenerating this asset based on the user's feedback above. You MUST address their specific comments and improve the asset accordingly.
      ` : ''}
      `,
    });

    return response.text || "Failed to generate content.";
  }).catch((error: any) => {
    console.error("Error generating deliverable:", error);
    // If it's a quota error, throw it so the caller can handle it
    if (error?.message?.includes('quota') || error?.status === 'RESOURCE_EXHAUSTED' || error?.code === 429) {
      throw new Error('QUOTA_EXCEEDED');
    }
    return "An error occurred while generating this asset.";
  });
}
  
  export async function runMarketingAgentsStream(
    idea: BusinessIdea,
    vibe: string,
    onChunk: (text: string) => void
  ): Promise<void> {
    try {
      const responseStream = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview", // Flash is better for streaming terminal logs
        contents: `You are a fully autonomous AI-powered multi-agent marketing and advertising system.
        Your goal is to execute a launch promotion and acquire the first 100 customers at $0 out-of-pocket cost.
        
        Startup Details:
        - Problem: ${idea.problem}
        - Solution: ${idea.solution}
        - Target Audience: ${idea.targetAudience}
        - Pricing: ${idea.pricingStrategy}
        - Marketing: ${idea.marketingChannels}
        
        Brand Vibe: ${vibe}
        
        Simulate the following agents working together in real-time:
        1. [Growth Hacker Agent]: Identifies high-leverage, 0-cost channels (Reddit, IndieHackers, specific Facebook groups, cold email scraping).
        2. [Copywriter Agent]: Drafts the exact, ready-to-copy-paste posts, DMs, and emails tailored to the Vibe.
        3. [Community Manager Agent]: Creates the engagement strategy and response scripts.
  
        Format your output as a live terminal log of these agents executing their tasks. 
        Use formatting like:
        > [Agent Name] initializing...
        > [Agent Name] executing task...
        
        Provide the ACTUAL copy and scripts they generate. Make it highly actionable and specific to the startup details.
        Do not stop until a complete 0-cost 100-customer acquisition plan with all necessary copy is generated.`,
      });
  
      for await (const chunk of responseStream) {
        if (chunk.text) {
          onChunk(chunk.text);
        }
      }
    } catch (error: any) {
      console.error("Error running marketing agents:", error);
      if (error?.message?.includes('quota') || error?.status === 'RESOURCE_EXHAUSTED' || error?.code === 429) {
        onChunk("\n\n[SYSTEM ERROR]: Gemini API Quota Exceeded. Please wait a minute and try again.");
      } else {
        onChunk("\n\n[SYSTEM ERROR]: Agent execution failed. Please check your connection and try again.");
      }
    }
  }
