import { useState, useEffect, useRef, useCallback } from 'react';

export interface DetectedObject {
    class: string;
    score: number;
    bbox: [number, number, number, number];
    position?: "left" | "right" | "center";
}

interface UseObjectDetectionProps {
    isNavigating: boolean;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    invokeIntervalMs?: number;
    onDetect?: (objects: DetectedObject[]) => void;
    onDescribeScene?: (description: string) => void;
}

export function useObjectDetection({
    isNavigating,
    videoRef,
    invokeIntervalMs = 500,
    onDetect,
    onDescribeScene,
}: UseObjectDetectionProps) {
    const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
    const isProcessingRef = useRef(false);
    const lastDescriptionTimeRef = useRef(0);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const distanceHistoryRef = useRef<Record<string, number[]>>({});
    const onDetectRef = useRef(onDetect);
    const onDescribeSceneRef = useRef(onDescribeScene);

    useEffect(() => {
        onDetectRef.current = onDetect;
    }, [onDetect]);

    useEffect(() => {
        onDescribeSceneRef.current = onDescribeScene;
    }, [onDescribeScene]);

    useEffect(() => {
        // Create an off-screen canvas if it doesn't exist
        if (!canvasRef.current) {
            canvasRef.current = document.createElement('canvas');
        }
    }, []);

    const processFrame = useCallback(async () => {
        if (!isNavigating || !videoRef.current || isProcessingRef.current) return;

        const video = videoRef.current;
        if (video.readyState < 2 || video.videoWidth === 0) return;

        isProcessingRef.current = true;
        const now = Date.now();

        try {
            const canvas = canvasRef.current;
            if (!canvas) return;

            // Downscale image to speed up drawing, base64 encoding and network transfer
            const scale = Math.min(1, 320 / video.videoWidth);
            const drawWidth = Math.floor(video.videoWidth * scale);
            const drawHeight = Math.floor(video.videoHeight * scale);

            canvas.width = drawWidth;
            canvas.height = drawHeight;

            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (!ctx) return;

            ctx.drawImage(video, 0, 0, drawWidth, drawHeight);

            // Fetch generic AI scene description every 10 seconds (if user callback provided)
            if (onDescribeSceneRef.current && (now - lastDescriptionTimeRef.current > 10000)) {
                lastDescriptionTimeRef.current = now;
                // Run describe in background so it doesn't block the fast object detection loop
                const bgImage = canvas.toDataURL('image/jpeg', 0.6);
                fetch('/api/describe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: bgImage })
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.result && data.result !== "Nothing clear detected.") {
                            if (onDescribeSceneRef.current) {
                                onDescribeSceneRef.current(data.result);
                            }
                        }
                    })
                    .catch(err => console.error("Scene description failed", err));
            }

            // Wall detection heuristic (using the downscaled image)
            // We sample a box in the center of the bottom third of the frame
            const boxWidth = Math.floor(drawWidth / 3);
            const boxHeight = Math.floor(drawHeight / 3);
            const startX = Math.floor((drawWidth / 2) - (boxWidth / 2));
            const startY = Math.floor(drawHeight * 0.6); // bottom part

            let wallPrediction = null;

            try {
                const sampleData = ctx.getImageData(startX, startY, boxWidth, boxHeight);
                const pixels = sampleData.data;
                let sumLuma = 0;
                let sumLumaSq = 0;
                let pixelCount = 0;

                // Check every 4th pixel to make it faster
                for (let i = 0; i < pixels.length; i += 16) {
                    const r = pixels[i];
                    const g = pixels[i + 1];
                    const b = pixels[i + 2];
                    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
                    sumLuma += luma;
                    sumLumaSq += luma * luma;
                    pixelCount++;
                }

                if (pixelCount > 0) {
                    const meanLuma = sumLuma / pixelCount;
                    const variance = (sumLumaSq / pixelCount) - (meanLuma * meanLuma);

                    // If the area is extremely uniform (low variance), we guess there's a flat wall close by
                    // Tightened threshold to 600 to prevent false positive walls on noisy surfaces
                    if (variance < 600) {
                        // Adjust step calculation to be more aggressive when variance is low
                        const estimatedSteps = Math.max(1, Math.floor(variance / 60));

                        // Need to scale the bbox back to the original video dimensions for consistency
                        wallPrediction = {
                            class: 'wall',
                            score: 0.85,
                            bbox: [0, Math.floor(startY / scale), video.videoWidth, Math.floor((drawHeight - startY) / scale)],
                            estimatedDistanceMeters: estimatedSteps * 0.76,
                            estimatedSteps: estimatedSteps,
                            position: "center"
                        };
                    }
                }
            } catch (err) {
                console.error("Variance check failed", err)
            }

            // AI Vision Object Detection via Gemini Proxy
            const backendUrl = `/api/describe`;
            const base64Image = canvas.toDataURL('image/jpeg', 0.6); // Reduced quality for speed

            let predictions: any[] = [];

            try {
                const response = await fetch(backendUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ image: base64Image })
                });

                if (response.ok) {
                    const data = await response.json();
                    const textResult = data.result || "";

                    if (textResult && textResult !== "Nothing clear detected." && !textResult.includes("Error")) {
                        // Gemini returns a comma separated list. 
                        // Synthesize fake bounding boxes so the existing distance tracking works
                        const items = textResult.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);

                        predictions = items.map((item: string, index: number) => {
                            // Distribute items across the screen horizontally
                            const stepX = video.videoWidth / (items.length + 1);
                            const centerX = stepX * (index + 1);

                            // AI doesn't give us exact boxes, so we create a reasonable default box in the center
                            const defaultWidth = video.videoWidth * 0.4;
                            const defaultHeight = video.videoHeight * 0.4;
                            const startXBox = centerX - (defaultWidth / 2);
                            const startYBox = (video.videoHeight / 2) - (defaultHeight / 2);

                            return {
                                class: item.toLowerCase(),
                                score: 0.9, // High confidence since it's from Gemini
                                bbox: [startXBox, startYBox, defaultWidth, defaultHeight]
                            };
                        });
                    }
                }
            } catch (backendErr) {
                console.error("AI Vision request failed:", backendErr);
            }

            // Estimate distances (Since we synthesize boxes, we rely heavily on the wall heuristic or default sizes)
            const AVERAGE_HEIGHTS: Record<string, number> = {
                person: 1.7, chair: 0.9, table: 0.8, desk: 0.8, 'wooden table': 0.8,
                sofa: 0.9, couch: 0.9, bed: 0.6, door: 2.0, window: 1.5,
                laptop: 0.2, computer: 0.4, monitor: 0.4, tv: 0.6, television: 0.6,
                speaker: 0.3, socket: 0.1, 'power socket': 0.1, switch: 0.1,
                phone: 0.15, 'cell phone': 0.15, mobile: 0.15,
                cup: 0.1, bottle: 0.25, glass: 0.15, mug: 0.1,
                car: 1.5, truck: 3.5, bus: 3.0, motorcycle: 1.2, bicycle: 1.0,
                tree: 3.0, plant: 0.5, 'potted plant': 0.5, bush: 1.0,
                bag: 0.5, backpack: 0.5, suitcase: 0.6, box: 0.4,
                cat: 0.3, dog: 0.6, pet: 0.4,
                wall: 2.5, floor: 0.0, ceiling: 3.0
            };

            const focalLength = (video.videoHeight / 2) / 0.466;

            const enhancedPredictions = predictions.map((pred: any) => {
                const [x, , width, height] = pred.bbox;

                // Try to find a matching height key, or default to 0.5m
                let realHeight = 0.5;
                for (const key in AVERAGE_HEIGHTS) {
                    if (pred.class.includes(key)) {
                        realHeight = AVERAGE_HEIGHTS[key];
                        break;
                    }
                }

                const estimatedDistanceMeters = (realHeight * focalLength) / height;

                let rawSteps = Math.max(1, Math.round(estimatedDistanceMeters / 0.76));
                rawSteps = Math.min(rawSteps, 30);

                if (!distanceHistoryRef.current[pred.class]) {
                    distanceHistoryRef.current[pred.class] = [];
                }

                const history = distanceHistoryRef.current[pred.class];
                history.push(rawSteps);
                if (history.length > 3) {
                    history.shift();
                }

                const smoothedSteps = Math.round(history.reduce((a, b) => a + b, 0) / history.length);

                const centerX = x + (width / 2);
                let position: "left" | "right" | "center" = "center";
                if (centerX < video.videoWidth / 3) {
                    position = "right";
                } else if (centerX > video.videoWidth * (2 / 3)) {
                    position = "left";
                }

                return {
                    ...pred,
                    estimatedDistanceMeters: smoothedSteps * 0.76,
                    estimatedSteps: smoothedSteps,
                    position
                };
            });

            if (wallPrediction) {
                if (enhancedPredictions.length < 5) {
                    enhancedPredictions.push(wallPrediction);
                }
            }

            setDetectedObjects(enhancedPredictions);

            if (onDetectRef.current && enhancedPredictions.length > 0) {
                onDetectRef.current(enhancedPredictions);
            }
        } catch (error) {
            console.error('Error in object detection loop:', error);
        } finally {
            // Because Gemini is slower than COCO-SSD, we add a forced delay before processing the next frame
            // This prevents building up a massive backlog of concurrent API calls.
            setTimeout(() => {
                isProcessingRef.current = false;
            }, 1000);
        }
    }, [isNavigating, videoRef]);

    useEffect(() => {
        if (!isNavigating) {
            setDetectedObjects([]);
            return;
        }

        // We use a shorter interval (e.g. 250ms or 500ms) but it will skip if isProcessing is true
        const intervalId = setInterval(processFrame, invokeIntervalMs);

        return () => clearInterval(intervalId);
    }, [isNavigating, invokeIntervalMs, processFrame]);

    return { detectedObjects };
}
