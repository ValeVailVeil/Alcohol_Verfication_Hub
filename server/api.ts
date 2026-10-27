import express, { Request, Response } from 'express';
import { analyzeBeverageImages, LabelImageInput } from './geminiService';
import { validateTTBCompliance } from '../src/utils/ttbRules';

export const apiRouter = express.Router();

apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    model: 'gemini-3.5-flash-lite',
  });
});

apiRouter.post('/analyze-beverage', async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  try {
    const { images, beverageName } = req.body as {
      images: Array<{ imageBase64: string; mimeType: string; fileName?: string }>;
      beverageName?: string;
    };

    if (!images || images.length === 0) {
      res.status(400).json({ success: false, error: 'No images provided' });
      return;
    }

    if (!process.env.GEMINI_API_KEY) {
      res.status(503).json({
        success: false,
        error: 'GEMINI_API_KEY is not set. Configure it in Secrets to run Gemini analysis.',
        isKeyMissing: true,
        durationMs: Date.now() - startTime
      });
      return;
    }

    const imageInputs: LabelImageInput[] = images.map(img => ({
      base64Data: img.imageBase64,
      mimeType: img.mimeType || 'image/jpeg',
      fileName: img.fileName
    }));

    // Call Gemini 3.5 Flash Lite
    const { formData, modelUsed } = await analyzeBeverageImages(imageInputs);

    // If Gemini didn't find brand name but we have a beverageName hint, use it as fallback
    if (!formData.brandName && beverageName) {
      formData.brandName = beverageName;
    }

    // Validate against TTB rules
    const compliance = validateTTBCompliance(formData);
    const durationMs = Date.now() - startTime;

    res.json({
      success: true,
      durationMs,
      modelUsed,
      formData,
      compliance
    });
  } catch (err: any) {
    console.error('Error analyzing beverage:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Error analyzing beverage',
      durationMs: Date.now() - startTime
    });
  }
});
