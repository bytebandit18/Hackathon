import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Proxy the request to the Node.js Express backend
        let backendUrl = "http://127.0.0.1:5001/detect";
        let response;
        try {
            response = await fetch(backendUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
        } catch (err) {
            console.warn("Retrying with localhost instead of 127.0.0.1");
            backendUrl = "http://localhost:5001/detect";
            response = await fetch(backendUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Backend error:", response.status, errorText);
            return NextResponse.json(
                { error: `Backend error: ${response.status}`, details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error("Error connecting to detection backend:", error);
        return NextResponse.json(
            { error: "Failed to connect to backend", details: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
