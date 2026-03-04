import { GoogleGenerativeAI, Part } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set in environment variables.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// --- Configuration ---
const MODEL_NAME = "gemini-2.5-flash";

// --- Core Functions ---

/**
 * Converts a buffer from an image/receipt into a Part object for Gemini.
 * @param imageBuffer The image data buffer.
 * @param mimeType The MIME type of the image.
 * @returns A Part object for the model.
 */
function fileToGenerativePart(imageBuffer: Buffer, mimeType: string): Part {
  return {
    inlineData: {
      data: imageBuffer.toString("base64"),
      mimeType,
    },
  };
}

/**
 * Uses Gemini 2.5 Flash with Vision to extract structured expense data from an image.
 * @param imageBuffer The raw image buffer (e.g., from LINE webhook).
 * @param mimeType The image's MIME type (e.g., 'image/jpeg').
 * @returns A promise that resolves to the parsed expense data.
 */
export async function extractExpenseDataFromImage(imageBuffer: Buffer, mimeType: string): Promise<{ type: 'income' | 'expense', amount: number, description: string }> {
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });

  const prompt = `Analyze the attached receipt/image. Extract the transaction details ONLY in the specified JSON format.
  If the transaction is clearly income (e.g., salary, deposit), set 'type' to 'income'. Otherwise, set 'type' to 'expense'.
  The 'amount' must be a positive number representing the currency value found.
  The 'description' should be a short summary of the item/service.
  If you cannot determine the amount or type reliably, use 0 for amount and describe the issue in 'description', but strive for accuracy.`;

  const result = await model.generateContent([
    prompt,
    fileToGenerativePart(imageBuffer, mimeType),
  ]);
  const response = result.response;
  const text = response.text();
  const cleanedData = text.replace(/```json|```/g, "").trim();
  try {
    const jsonResult = JSON.parse(cleanedData);

    if (jsonResult.error) {
        throw new Error(jsonResult.error);
    }

    // Lean validation
    if (jsonResult.amount === undefined || jsonResult.type === undefined || jsonResult.description === undefined) {
        throw new Error("Gemini returned JSON missing required fields.");
    }

    return {
        type: jsonResult.type.toLowerCase().includes('income') ? 'income' : 'expense',
        amount: parseFloat(jsonResult.amount),
        description: jsonResult.description.substring(0, 50) // Truncate for lean storage
    };

  } catch (e) {
    console.error("Failed to parse Gemini response or data structure invalid:", e);
    throw new Error(`OCR/NLP Extraction Failed: Could not process response text: ${text}`);
  }
}

/**
 * Uses Gemini 2.5 Flash for NLP to process plain text messages.
 * @param text The text message received from LINE.
 * @returns A promise that resolves to the parsed expense data.
 */
export async function extractExpenseDataFromText(text: string): Promise<{ type: 'income' | 'expense', amount: number, description: string }> {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `Analyze the following text message to determine if it is an income or an expense.
    Extract the transaction details ONLY in the specified JSON format.
    Examples:
    - "จ่ายค่ากาแฟ 150 บาท" -> {"type": "expense", "amount": 150, "description": "Coffee"}
    - "เงินเดือนเข้า 25000" -> {"type": "income", "amount": 25000, "description": "Salary"}
    - "วันนี้อากาศดี" -> {"type": "expense", "amount": 0, "description": "Not a financial transaction"}

    Text to analyze: "${text}"`;

    const result = await model.generateContent([
        prompt,
    ]);

    const response = result.response;
    const textOutput = response.text();
    const cleanedData = textOutput.replace(/```json|```/g, "").trim();

    try {
        const jsonResult = JSON.parse(cleanedData);

        if (jsonResult.error) {
            throw new Error(jsonResult.error);
        }

        if (jsonResult.amount === undefined || jsonResult.type === undefined || jsonResult.description === undefined) {
            throw new Error("Gemini returned JSON missing required fields.");
        }

        if (isNaN(parseFloat(jsonResult.amount))) {
             throw new Error(`Amount '${jsonResult.amount}' is not a valid number.`);
        }

        return {
            type: jsonResult.type.toLowerCase().includes('income') ? 'income' : 'expense',
            amount: parseFloat(jsonResult.amount),
            description: jsonResult.description.substring(0, 50) // Truncate for lean storage
        };

    } catch (e) {
        console.error("Failed to parse Gemini response or data structure invalid:", e);
        // Return a safe fallback to allow the main flow to continue/reply gracefully
        throw new Error(`NLP Extraction Failed: Could not process text reliably. RAW: ${textOutput}`);
    }
}
