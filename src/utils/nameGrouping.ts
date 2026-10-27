export interface UploadedImageItem {
  id: string;
  file?: File;
  fileName: string;
  previewUrl: string;
  base64Data?: string;
  detectedOrientation?: string;
}

export interface BeverageGroup {
  id: string;
  beverageName: string;
  stem: string;
  images: UploadedImageItem[];
  status: 'pending' | 'processing' | 'done' | 'error';
  errorMessage?: string;
  durationMs?: number;
  formData?: any;
  compliance?: any;
}

const ORIENTATION_KEYWORDS = [
  'front', 'back', 'rear', 'neck', 'side', 'top', 'bottom',
  'face', 'left', 'right', 'can', 'bottle', 'label', 'labels',
  'shot', 'angle', 'wrap', '360', 'pkg', 'package', 'box',
  'view', 'photo', 'img', 'image'
];

/**
 * Normalizes a filename to a canonical beverage stem.
 * e.g. "silver_peak_cabernet_front_2021.jpg" -> "silver peak cabernet 2021"
 */
export function extractBeverageStem(filename: string): { stem: string; orientation?: string } {
  // Strip extension
  let name = filename.replace(/\.[a-zA-Z0-9]+$/, '').toLowerCase();

  // Replace delimiters with space
  name = name.replace(/[_\-.]+/g, ' ');

  // Identify orientation keywords
  const words = name.split(/\s+/).filter(Boolean);
  let detectedOrientation: string | undefined;

  const filteredWords = words.filter(word => {
    const isKeyword = ORIENTATION_KEYWORDS.includes(word);
    if (isKeyword && !detectedOrientation) {
      detectedOrientation = word;
    }
    return !isKeyword;
  });

  const stem = filteredWords.join(' ').trim() || name.trim();
  return { stem, orientation: detectedOrientation };
}

/**
 * String similarity ratio (Dice's coefficient on bigrams)
 */
function getSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  if (!str1 || !str2) return 0;
  if (str1.includes(str2) || str2.includes(str1)) return 0.85;

  const s1 = str1.replace(/\s+/g, '');
  const s2 = str2.replace(/\s+/g, '');
  if (s1.length < 2 || s2.length < 2) return s1 === s2 ? 1 : 0;

  const bigrams = new Map<string, number>();
  for (let i = 0; i < s1.length - 1; i++) {
    const bigram = s1.substring(i, i + 2);
    bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
  }

  let intersection = 0;
  for (let i = 0; i < s2.length - 1; i++) {
    const bigram = s2.substring(i, i + 2);
    const count = bigrams.get(bigram) || 0;
    if (count > 0) {
      bigrams.set(bigram, count - 1);
      intersection++;
    }
  }

  return (2.0 * intersection) / ((s1.length - 1) + (s2.length - 1));
}

function titleCase(str: string): string {
  return str
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Groups incoming image items by beverage name using fuzzy matching.
 */
export function groupImagesByBeverage(images: UploadedImageItem[]): BeverageGroup[] {
  const groups: BeverageGroup[] = [];

  for (const img of images) {
    const { stem, orientation } = extractBeverageStem(img.fileName);
    img.detectedOrientation = orientation;

    // Look for existing group with high similarity (threshold 0.70)
    let matchedGroup = groups.find(g => getSimilarity(g.stem, stem) >= 0.70);

    if (matchedGroup) {
      matchedGroup.images.push(img);
    } else {
      groups.push({
        id: 'bev_' + Math.random().toString(36).substring(2, 9),
        beverageName: titleCase(stem) || 'Beverage Product',
        stem,
        images: [img],
        status: 'pending'
      });
    }
  }

  return groups;
}
