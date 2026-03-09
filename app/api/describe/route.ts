import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
    try {
        const { image, mode = 'describe' } = await req.json();

        if (!image) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: "GEMINI_API_KEY is not configured" }, { status: 500 });
        }

        const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // Extract MIME type and base64 data
        let mimeType = "image/jpeg";
        let base64Data = image;

        if (image.includes(',')) {
            const parts = image.split(',');
            base64Data = parts[1];
            // Match data:image/png;base64 etc
            const match = parts[0].match(/data:(image\/[^;]+);/);
            if (match) {
                mimeType = match[1];
            }
        }

        const prompt = mode === 'detect'
            ? `You are an object detection system for a visually impaired user. Look at this image and return a JSON array of up to 6 objects visible in the scene. Only include solid, real objects (e.g. person, chair, table, door, wall, laptop, bottle). Do NOT include lights, lamps, or ceiling fixtures. For each object include: "class" (a short lowercase label like "person"), "score" (confidence 0.0-1.0), and "bbox" ([ymin, xmin, ymax, xmax] normalized 0-1000). Return ONLY a raw JSON array, no markdown, no code blocks.`
            : `You are an accessibility assistant for a visually impaired user navigating indoors. In one concise comma-separated list (under 15 words), name the main objects, furniture, or obstacles visible. Do not include lights or ceiling fixtures. If nothing is clear, reply: Nothing clear detected.`;

        // Pass the image directly using the inlineData format expected by the Gemini API
        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType: mimeType
            }
        };

        const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

        const response = await model.generateContent([
            prompt,
            imagePart
        ]);

        const text = response.response.text() ?? "Nothing clear detected.";

        return NextResponse.json({ result: text });

    } catch (error: any) {
        const errMsg = String(error?.message || error?.statusText || error || '');
        console.error("[/api/describe] Error:", errMsg, "\nFull Error:", error);

        if (/rate.?limit|quota|429/i.test(errMsg) || error?.status === 429 || error?.code === 429) {
            return NextResponse.json({ error: "Rate limit exceeded", details: errMsg }, { status: 429 });
        }

        return NextResponse.json(
            { error: "Failed to process image", details: errMsg },
            { status: 500 }
        );
    }
}
