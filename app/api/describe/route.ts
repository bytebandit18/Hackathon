import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
    try {
        const { image } = await req.json();

        if (!image) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "GEMINI_API_KEY is not configured in the environment." }, { status: 500 });
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const base64Data = image.includes(',') ? image.split(',')[1] : image;

        const prompt = `
You are an accessibility assistant helping a visually impaired user navigate an indoor environment.
Describe the main objects visible in this image in a very concise, comma-separated list.
Focus on obstacles, furniture, architectural features, and everyday items (e.g., "laptop, speaker, wooden table, window on the right, open door").
Do not write full sentences. Do not use conversational filler. Just list the objects and their general position if relevant.
Keep it under 15 words if possible.
If the image is completely blurry or you cannot distinguish anything, respond with "Nothing clear detected".
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [
                prompt,
                {
                    inlineData: {
                        data: base64Data,
                        mimeType: "image/jpeg"
                    }
                }
            ]
        });

        const text = response.text || "Nothing clear detected.";

        return NextResponse.json({ result: text });
    } catch (error) {
        console.error("Error describing environment:", error);
        return NextResponse.json({ error: "Failed to describe environment" }, { status: 500 });
    }
}
