import { WebhookEvent, Client, ImageEventMessage } from '@line/bot-sdk';
import { saveExpense } from './supabaseService';
import { extractExpenseDataFromImage, extractExpenseDataFromText } from './geminiService';
import axios from 'axios';
import { ParsedExpense } from '../types'; // Import from central types

// --- Configuration ---

const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN as string,
  channelSecret: process.env.LINE_CHANNEL_SECRET as string,
};

if (!lineConfig.channelAccessToken || !lineConfig.channelSecret) {
    throw new Error('LINE_CHANNEL_ACCESS_TOKEN or LINE_CHANNEL_SECRET is not set.');
}

const bot = new Client(lineConfig);


// --- Utility for getting image content from LINE ---

/**
 * Fetches image content from a LINE server URL using the Access Token.
 * @param imageUrl The URL provided in the message content.
 * @returns A promise resolving to an object containing buffer and mime type.
 */
async function fetchImageContent(imageUrl: string): Promise<{ buffer: Buffer, mimeType: string }> {
    try {
        const response = await axios({
            method: 'GET',
            url: imageUrl,
            responseType: 'arraybuffer',
            headers: {
                'Authorization': `Bearer ${lineConfig.channelAccessToken}`
            }
        });

        // LINE image content-type is often 'image/jpeg' or 'image/png'
        const contentType = response.headers['content-type'] || 'image/jpeg';
        return {
            buffer: Buffer.from(response.data),
            mimeType: contentType,
        };
    } catch (error) {
        console.error("Error fetching image content from LINE:", error);
        throw new Error("Failed to download image from LINE server.");
    }
}


// --- Main Webhook Handler ---

/**
 * Processes an incoming LINE webhook event.
 * @param event The LINE webhook event.
 */
export async function handleEvent(event: WebhookEvent): Promise<void> {
    if (event.type !== 'message' || event.message.type !== 'text' && event.message.type !== 'image') {
        // Ignore non-message events or events that are not text/image
        return;
    }

    const lineUserId = event.source.userId;
    if (!lineUserId) return;

    let parsedData: Omit<ParsedExpense, 'lineUserId' | 'imageUrl'>;
    let replyMessage: string;

    try {
        if (event.message.type === 'text') {
            // 1. Process text message via NLP
            const textContent = event.message.text;
            const result = await extractExpenseDataFromText(textContent);
            parsedData = { ...result, type: result.type };
            replyMessage = `✅ ข้อความถูกประมวลผล: Type: ${parsedData.type}, Amount: ${parsedData.amount.toFixed(2)}, Desc: ${parsedData.description}${parsedData.transactionDate ? `, Date: ${parsedData.transactionDate}` : ''}`;

        } else if (event.message.type === 'image') {
            // 2. Process image message via OCR
            // Note: originalContentUrl is available for images sent directly in chat
            let imageUrl: string | undefined;
            const message = event.message as ImageEventMessage;
            if (message.contentProvider.type === 'line') {
                imageUrl = `https://api-data.line.me/v2/bot/message/${message.id}/content`;
            } else if (message.contentProvider.type === 'external') {
                imageUrl = message.contentProvider.originalContentUrl;
            }

            if (!imageUrl) {
                // Fallback for images sent via rich menu or other methods that might use preview, but we need original
                await bot.replyMessage(event.replyToken, { type: 'text', text: "ไม่สามารถดึง URL รูปภาพต้นฉบับได้." });
                return;
            }

            const { buffer, mimeType } = await fetchImageContent(imageUrl);
            const result = await extractExpenseDataFromImage(buffer, mimeType);
            
            // Image processing includes saving to Supabase directly
            const savedExpense = await saveExpense({
                line_user_id: lineUserId,
                type: result.type,
                amount: result.amount,
                description: result.description,
                image_url: imageUrl,
                transaction_date: result.transactionDate
            });

            replyMessage = `🖼️ บันทึกจากรูปภาพสำเร็จ! (ID: ${savedExpense.id})\nType: ${savedExpense.type}, Amount: ${savedExpense.amount.toFixed(2)}, Desc: ${savedExpense.description}${savedExpense.transaction_date ? `, Date: ${savedExpense.transaction_date}` : ''}`;
            await bot.replyMessage(event.replyToken, { type: 'text', text: replyMessage });
            return; // Exit early as image processing includes saving and replying
        } else {
            // Ignore sticker, location, etc.
            await bot.replyMessage(event.replyToken, { type: 'text', text: "รับทราบการรับข้อความประเภทนี้แล้ว แต่ฉันสนใจเฉพาะข้อความ/รูปภาพที่เป็นรายการรับจ่ายเท่านั้นครับ" });
            return;
        }

        // 3. Save extracted data from text (If not an image, which replies immediately)
        const savedExpense = await saveExpense({
            line_user_id: lineUserId,
            type: parsedData.type,
            amount: parsedData.amount,
            description: parsedData.description,
            image_url: null,
            transaction_date: parsedData.transactionDate
        });

        // 4. Reply to user for text messages
        await bot.replyMessage(event.replyToken, { type: 'text', text: replyMessage + `\n\n💾 บันทึกเข้าระบบสำเร็จ! (ID: ${savedExpense.id})` });

    } catch (error) {
        console.error('Event Handling Error:', error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during processing.";
        
        // Try to reply with an error message
        try {
            await bot.replyMessage(event.replyToken, { type: 'text', text: `❌ เกิดข้อผิดพลาด: ${errorMessage.substring(0, 150)}` });
        } catch (replyError) {
            console.error("Failed to send error reply:", replyError);
        }
    }
}