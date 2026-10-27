export type BeverageCategory = 'wine' | 'spirits' | 'malt_beverage' | 'unknown';

export type ComplianceStatus = 'COMPLIANT' | 'NON_COMPLIANT' | 'NEEDS_REVIEW';

export type FindingStatus = 'PASS' | 'FAIL' | 'WARNING' | 'INFO';

export interface FindingItem {
  id: string;
  category: 'Government Warning' | 'Brand & Class' | 'Alcohol Content (ABV)' | 'Net Contents' | 'Bottler Statement' | 'Sulfites & Disclosures' | 'Prohibited Claims';
  rule: string;
  status: FindingStatus;
  details: string;
  regulatoryCitation: string;
  recommendation?: string;
}

export interface LabelFormData {
  brandName: string;
  fancifulName?: string;
  beverageType: BeverageCategory;
  classTypeDesignation: string;
  abvValue: string;
  abvFormat: string;
  netContentsValue: string;
  netContentsUnit: string;
  bottlerName: string;
  bottlerAddress: string;
  bottlerStatementType: string; // e.g. "Produced and Bottled by", "Bottled by", "Brewed and Packed by"
  governmentWarningText: string;
  hasWarningHeadingBold: boolean;
  hasWarningNumbers: boolean;
  containsSulfites: boolean;
  countryOfOrigin: string;
  ageStatement?: string;
  stateOfDistillation?: string;
  coloringsAdditives?: string;
  notes?: string;
}

export interface LabelAnalysisResult {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  uploadedAt: string;
  status: 'queued' | 'analyzing' | 'completed' | 'error';
  errorMessage?: string;
  overallStatus: ComplianceStatus;
  complianceScore: number; // 0 - 100
  summary: string;
  formData: LabelFormData;
  findings: FindingItem[];
  rawOcrText?: string;
  executionTimeMs?: number;
}

export interface BatchStats {
  total: number;
  completed: number;
  compliant: number;
  nonCompliant: number;
  needsReview: number;
  processing: number;
  averageScore: number;
}
