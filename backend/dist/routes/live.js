import { GoogleGenAI, Type } from '@google/genai';
import { env } from '../config/env.js';
const ai = new GoogleGenAI({
    apiKey: env.GEMINI_API_KEY,
});
export async function liveCallRoutes(app) {
    // @ts-ignore - The fastify websocket type might not be fully recognized without augmenting
    app.get('/stream', { websocket: true }, (connection, req) => {
        let lastGeminiCallTime = 0;
        connection.socket.on('message', async (message) => {
            try {
                const payloadStr = message.toString();
                const dataJson = JSON.parse(payloadStr);
                const fullTranscript = dataJson.full_transcript || '';
                if (fullTranscript.trim().length < 5)
                    return;
                const currentTime = Date.now();
                // Throttle to 5 seconds
                if (currentTime - lastGeminiCallTime < 5000)
                    return;
                lastGeminiCallTime = currentTime;
                const prompt = `
You are an expert technical interviewer evaluating a live interview.
The following is the running transcript of the interview so far:
"${fullTranscript}"

Provide a real-time JSON response with the following strictly formatted fields:
{
  "current_score": <integer from 0 to 100 representing the candidate's current performance score>,
  "guidance": [
    "Summary: <1-sentence analysis of the candidate's answer>",
    "Feedback: <1-sentence instruction on what the candidate did well or poorly>",
    "Action: <1-sentence instruction on what the interviewer should ask next>"
  ],
  "risk_detected": <boolean indicating if the candidate is completely stuck and needs a strong hint>
}
`;
                const responseSchema = {
                    type: Type.OBJECT,
                    properties: {
                        current_score: { type: Type.INTEGER },
                        guidance: { type: Type.ARRAY, items: { type: Type.STRING } },
                        risk_detected: { type: Type.BOOLEAN },
                    },
                    required: ["current_score", "guidance", "risk_detected"],
                };
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash', // Using flash as it's faster for live transcription
                    contents: prompt,
                    config: {
                        responseMimeType: 'application/json',
                        responseSchema: responseSchema,
                    }
                });
                const responseText = response.text;
                if (!responseText)
                    throw new Error("No response from Gemini");
                const aiData = JSON.parse(responseText);
                const outgoingPayload = {
                    score: aiData.current_score || 50,
                    guidance: aiData.guidance || [],
                    risk_detected: aiData.risk_detected || false
                };
                connection.socket.send(JSON.stringify(outgoingPayload));
            }
            catch (error) {
                console.error("Live Gemini Error:", error);
                const errorPayload = {
                    score: 50,
                    guidance: ["Error analyzing context."],
                    risk_detected: false
                };
                connection.socket.send(JSON.stringify(errorPayload));
            }
        });
        connection.socket.on('close', () => {
            console.log('Live Call WebSocket disconnected');
        });
    });
}
//# sourceMappingURL=live.js.map