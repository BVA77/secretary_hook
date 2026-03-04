import express, { Request, Response, NextFunction } from 'express';
import { WebhookEvent, validateSignature } from '@line/bot-sdk';
import { handleEvent } from './services/lineService';
import 'dotenv/config'; // Load environment variables from .env

// --- Configuration ---
const PORT = parseInt(process.env.PORT as string) || 3000;
const CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET as string;

// --- Initialization ---
const app = express();

// Middleware to verify LINE signature before parsing the body
const lineSignatureMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const signature = req.headers['x-line-signature'] as string;
    const rawBody = (req as any).rawBody; // Set by the next middleware

    if (!signature || !rawBody) {
        console.warn('Missing signature or raw body. Denying access.');
        return res.sendStatus(401);
    }

    try {
        validateSignature(rawBody, CHANNEL_SECRET, signature);
        next();
    } catch (err) {
        console.error('Signature validation failed:', err instanceof Error ? err.message : err);
        res.sendStatus(400); // Bad Request if signature is invalid
    }
};


// Middleware to parse JSON body and capture raw body for signature verification
app.use(express.json({
    limit: '1mb', 
    verify: (req, res, buf) => {
        (req as any).rawBody = buf.toString();
    }
}));

// Apply signature verification middleware ONLY to the webhook route
app.post('/webhook', lineSignatureMiddleware, async (req: Request, res: Response) => {
    const events: WebhookEvent[] = (req.body as { events: WebhookEvent[] }).events;

    if (!events || events.length === 0) {
        return res.sendStatus(200); // No events to process
    }

    try {
        // Process all events sequentially to respect API rate limits and ordering if possible
        for (const event of events) {
            await handleEvent(event);
        }
        res.sendStatus(200);
    } catch (error) {
        console.error('Webhook processing failed:', error);
        res.sendStatus(500);
    }
});

/**
 * Root route for general checks.
 */
app.get('/', (req: Request, res: Response) => {
    res.status(200).send('LINE Expense Bot is running.');
});

export default app;
