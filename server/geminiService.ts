import { GoogleGenAI } from '@google/genai';
import { LabelFormData } from '../src/types/ttb';

const getGenAIClient = () => {
  return new GoogleGenAI();
};

const SYSTEM_INSTRUCTION = `You are a certified TTB alcoholic beverage label inspector.
Extract the mandatory TTB specifications from the provided label image(s) (front, back, neck, or can views).
Consolidate information across all provided images for this beverage.

Extract:
- beverageType: "wine" | "spirits" | "malt_beverage" | "unknown"
- brandName: Brand name
- classTypeDesignation: TTB class/type (e.g. Cabernet Sauvignon, Bourbon Whiskey, India Pale Ale)
- abvValue: Numeric percentage (e.g. "14.5")
- abvFormat: Raw text as printed (e.g. "ALC. 14.5% BY VOL.")
- netContentsValue: Numeric volume (e.g. "750", "16")
- netContentsUnit: Unit (e.g. "mL", "FL. OZ.")
- bottlerName: Bottler or producer name
- bottlerAddress: City and state/country
- bottlerStatementType: Statement prefix (e.g. "Bottled by", "Produced and bottled by")
- governmentWarningText: Exact text of government warning if found on any label
- hasWarningHeadingBold: boolean (is GOVERNMENT WARNING: capitalized & bold)
- hasWarningNumbers: boolean (includes clauses (1) and (2))
- containsSulfites: boolean (contains sulfites statement present)
- countryOfOrigin: Country of origin if stated`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    beverageType: { type: "string", enum: ["wine", "spirits", "malt_beverage", "unknown"] },
    brandName: { type: "string" },
    fancifulName: { type: "string" },
    classTypeDesignation: { type: "string" },
    abvValue: { type: "string" },
    abvFormat: { type: "string" },
    netContentsValue: { type: "string" },
    netContentsUnit: { type: "string" },
    bottlerName: { type: "string" },
    bottlerAddress: { type: "string" },
    bottlerStatementType: { type: "string" },
    governmentWarningText: { type: "string" },
    hasWarningHeadingBold: { type: "boolean" },
    hasWarningNumbers: { type: "boolean" },
    containsSulfites: { type: "boolean" },
    countryOfOrigin: { type: "string" },
    notes: { type: "string" }
  },
  required: [
    "beverageType", "brandName", "classTypeDesignation", "abvValue",
    "abvFormat", "netContentsValue", "netContentsUnit", "bottlerName",
    "bottlerAddress", "governmentWarningText", "hasWarningHeadingBold",
    "hasWarningNumbers", "containsSulfites"
  ]
};

export interface LabelImageInput {
  base64Data: string;
  mimeType: string;
  fileName?: string;
}

export async function analyzeBeverageImages(images: LabelImageInput[]): Promise<{ formData: LabelFormData; modelUsed: string }> {
  const ai = getGenAIClient();

  const parts: any[] = [
    { text: "Analyze these label image(s) for a single alcoholic beverage. Consolidate front and back labels to extract complete TTB compliance specs." }
  ];

  for (const img of images) {
    let clean = img.base64Data;
    let mime = img.mimeType || 'image/jpeg';
    if (clean.includes(';base64,')) {
      const split = clean.split(';base64,');
      clean = split[1];
      const match = split[0].match(/data:(.*?);/);
      if (match && match[1]) mime = match[1];
    }

    parts.push({
      inlineData: {
        data: clean,
        mimeType: mime
      }
    });
  }

  // Target Gemini 3.5 Flash Lite as requested, with fallback to 3.1 Flash Lite if not found
  const modelsToTry = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  let responseText = '';
  let modelUsed = modelsToTry[0];

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts
          }
        ],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA
        }
      });
      responseText = response.text || '{}';
      modelUsed = model;
      break;
    } catch (err: any) {
      const errMsg = (err?.message || '').toLowerCase();
      if (err?.status === 404 || errMsg.includes('404') || errMsg.includes('not found')) {
        console.warn(`Model ${model} not available, trying next fallback...`);
        continue;
      }
      throw err;
    }
  }

  let parsed: any;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    const match = responseText.match(/\{[\s\S]*\}/);
    parsed = match ? JSON.parse(match[0]) : {};
  }

  const formData: LabelFormData = {
    brandName: parsed.brandName || '',
    fancifulName: parsed.fancifulName || '',
    beverageType: parsed.beverageType || 'unknown',
    classTypeDesignation: parsed.classTypeDesignation || '',
    abvValue: String(parsed.abvValue || ''),
    abvFormat: parsed.abvFormat || '',
    netContentsValue: String(parsed.netContentsValue || ''),
    netContentsUnit: parsed.netContentsUnit || '',
    bottlerName: parsed.bottlerName || '',
    bottlerAddress: parsed.bottlerAddress || '',
    bottlerStatementType: parsed.bottlerStatementType || 'Bottled by',
    governmentWarningText: parsed.governmentWarningText || '',
    hasWarningHeadingBold: Boolean(parsed.hasWarningHeadingBold),
    hasWarningNumbers: Boolean(parsed.hasWarningNumbers),
    containsSulfites: Boolean(parsed.containsSulfites),
    countryOfOrigin: parsed.countryOfOrigin || '',
    notes: parsed.notes || ''
  };

  return { formData, modelUsed };
}
