import { FindingItem, LabelFormData, ComplianceStatus, FindingStatus } from '../types/ttb';

export const EXACT_GOV_WARNING_TEXT = 
  "GOVERNMENT WARNING: (1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems.";

export const WINE_STANDARDS_OF_FILL = [
  '50 mL', '100 mL', '187 mL', '250 mL', '355 mL', '375 mL', '500 mL', '700 mL', '750 mL', '1 L', '1.5 L', '3 L'
];

export const SPIRITS_STANDARDS_OF_FILL = [
  '50 mL', '100 mL', '200 mL', '355 mL', '375 mL', '700 mL', '750 mL', '900 mL', '1 L', '1.75 L'
];

export const PROHIBITED_HEALTH_KEYWORDS = [
  'cure', 'remedy', 'medicinal', 'therapeutic', 'prevents cancer', 'health benefit',
  'hangover cure', 'longevity', 'vitality booster', 'detoxifying', 'disease prevention'
];

/**
 * Validates a set of label form data against official TTB BAM & 27 CFR rules.
 */
export function validateTTBCompliance(formData: LabelFormData): {
  overallStatus: ComplianceStatus;
  complianceScore: number;
  findings: FindingItem[];
  summary: string;
} {
  const findings: FindingItem[] = [];

  // 1. Government Warning Statement check (27 CFR Part 16)
  const warningText = (formData.governmentWarningText || '').trim();
  if (!warningText) {
    findings.push({
      id: 'warn-missing',
      category: 'Government Warning',
      rule: 'Mandatory Health Warning Statement',
      status: 'FAIL',
      details: 'Government warning statement is completely missing from the label.',
      regulatoryCitation: '27 CFR § 16.20 & § 16.21',
      recommendation: 'Add the exact 27 CFR Part 16 mandatory health warning statement.'
    });
  } else {
    // Check heading capitalized
    const hasCapitalHeader = warningText.startsWith('GOVERNMENT WARNING:') || warningText.startsWith('GOVERNMENT WARNING :');
    if (!hasCapitalHeader) {
      findings.push({
        id: 'warn-header',
        category: 'Government Warning',
        rule: 'Heading Must Be Capitalized & Distinct',
        status: 'FAIL',
        details: 'The heading must appear as "GOVERNMENT WARNING:" in capital letters and in bold or distinct typeface.',
        regulatoryCitation: '27 CFR § 16.22(a)',
        recommendation: 'Format the header strictly as uppercase "GOVERNMENT WARNING:" in boldface.'
      });
    } else {
      findings.push({
        id: 'warn-header-pass',
        category: 'Government Warning',
        rule: 'Warning Heading Format',
        status: 'PASS',
        details: 'Heading "GOVERNMENT WARNING:" is properly capitalized.',
        regulatoryCitation: '27 CFR § 16.22(a)'
      });
    }

    // Check numbering (1) and (2)
    const hasNumber1 = warningText.includes('(1)');
    const hasNumber2 = warningText.includes('(2)');
    if (!hasNumber1 || !hasNumber2) {
      findings.push({
        id: 'warn-numbering',
        category: 'Government Warning',
        rule: 'Paragraph Numbering (1) and (2)',
        status: 'FAIL',
        details: 'Warning text must include "(1)" before the pregnancy statement and "(2)" before the machinery/health statement.',
        regulatoryCitation: '27 CFR § 16.21',
        recommendation: 'Include "(1)" and "(2)" as required by statute.'
      });
    } else {
      findings.push({
        id: 'warn-numbering-pass',
        category: 'Government Warning',
        rule: 'Warning Numbering',
        status: 'PASS',
        details: 'Clauses (1) and (2) are properly delineated.',
        regulatoryCitation: '27 CFR § 16.21'
      });
    }

    // Check key wording clauses
    const lowerWarning = warningText.toLowerCase();
    const hasPregnancy = lowerWarning.includes('surgeon general') && lowerWarning.includes('pregnancy') && lowerWarning.includes('birth defects');
    const hasMachinery = lowerWarning.includes('drive a car') || lowerWarning.includes('operate machinery');
    const hasHealthProb = lowerWarning.includes('health problems');

    if (!hasPregnancy || !hasMachinery || !hasHealthProb) {
      findings.push({
        id: 'warn-wording',
        category: 'Government Warning',
        rule: 'Statutory Warning Text Accuracy',
        status: 'FAIL',
        details: 'Warning text deviates from statutory language specified in 27 CFR § 16.21.',
        regulatoryCitation: '27 CFR § 16.21',
        recommendation: 'Ensure exact wording: "(1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to drive a car or operate machinery, and may cause health problems."'
      });
    } else {
      findings.push({
        id: 'warn-wording-pass',
        category: 'Government Warning',
        rule: 'Statutory Text Accuracy',
        status: 'PASS',
        details: 'Mandatory warning text contains all statutory phrases and requirements.',
        regulatoryCitation: '27 CFR § 16.21'
      });
    }
  }

  // 2. Brand Name check (27 CFR § 4.33, § 5.142, § 7.142)
  if (!formData.brandName || formData.brandName.trim().length === 0) {
    findings.push({
      id: 'brand-missing',
      category: 'Brand & Class',
      rule: 'Brand Name Presence',
      status: 'FAIL',
      details: 'Brand name is missing from the label data.',
      regulatoryCitation: '27 CFR § 4.33, § 5.142, § 7.142',
      recommendation: 'Ensure the brand name is clearly displayed on the front label.'
    });
  } else {
    findings.push({
      id: 'brand-pass',
      category: 'Brand & Class',
      rule: 'Brand Name Presence',
      status: 'PASS',
      details: `Identified brand name: "${formData.brandName}".`,
      regulatoryCitation: '27 CFR § 4.33, § 5.142, § 7.142'
    });
  }

  // 3. Class & Type Designation
  if (!formData.classTypeDesignation || formData.classTypeDesignation.trim().length === 0) {
    findings.push({
      id: 'class-missing',
      category: 'Brand & Class',
      rule: 'Class and Type Designation',
      status: 'FAIL',
      details: 'Class and type designation (e.g. Cabernet Sauvignon, Bourbon Whiskey, India Pale Ale) is missing.',
      regulatoryCitation: '27 CFR § 4.34, § 5.143, § 7.143',
      recommendation: 'Provide an authorized TTB class and type designation.'
    });
  } else {
    findings.push({
      id: 'class-pass',
      category: 'Brand & Class',
      rule: 'Class and Type Designation',
      status: 'PASS',
      details: `Designation "${formData.classTypeDesignation}" recognized for ${formData.beverageType}.`,
      regulatoryCitation: '27 CFR § 4.34, § 5.143, § 7.143'
    });
  }

  // 4. Alcohol by Volume (ABV) Statement
  const abvVal = (formData.abvValue || '').replace('%', '').trim();
  const abvNum = parseFloat(abvVal);
  const abvFmt = (formData.abvFormat || '').toUpperCase();

  if (!abvVal || isNaN(abvNum) || abvNum <= 0) {
    // For wine between 7-14%, "Table Wine" is an exemption only if designated as such
    const isTableWineExempt = formData.beverageType === 'wine' && 
      formData.classTypeDesignation.toLowerCase().includes('table wine');

    if (isTableWineExempt) {
      findings.push({
        id: 'abv-exempt',
        category: 'Alcohol Content (ABV)',
        rule: 'Alcohol Content Exemption',
        status: 'WARNING',
        details: 'Numerical alcohol content omitted under "Table Wine" designation (7-14% ABV). Numerical ABV is still strongly recommended for export/compliance.',
        regulatoryCitation: '27 CFR § 4.36(a)',
        recommendation: 'Consider adding explicit percentage (e.g. "ALC. 13.5% BY VOL.") for interstate/export clarity.'
      });
    } else {
      findings.push({
        id: 'abv-missing',
        category: 'Alcohol Content (ABV)',
        rule: 'Alcohol Content Statement',
        status: 'FAIL',
        details: 'Alcohol by volume percentage is missing or non-numeric.',
        regulatoryCitation: '27 CFR § 4.36, § 5.65, § 7.65',
        recommendation: 'Include alcohol content in percent by volume.'
      });
    }
  } else {
    // Validate format (BAM guidelines)
    const validFmtPatterns = [
      /ALCOHOL\s+\d+(\.\d+)?%\s+BY\s+VOLUME/i,
      /ALC\.?\s+\d+(\.\d+)?%\s+BY\s+VOL\.?/i,
      /ALC\.?\s+\d+(\.\d+)?%\s*\/\s*VOL\.?/i,
      /\d+(\.\d+)?%\s*ALC\.?\s*\/\s*VOL\.?/i,
      /\d+(\.\d+)?%\s*ALCOHOL\s+BY\s+VOLUME/i
    ];

    const sampleString = `${abvFmt || ''} ${abvVal}%`.trim();
    const isValidFormat = validFmtPatterns.some(p => p.test(sampleString) || p.test(abvFmt));

    if (!isValidFormat && abvFmt) {
      findings.push({
        id: 'abv-format-warn',
        category: 'Alcohol Content (ABV)',
        rule: 'ABV Statement Format (TTB BAM)',
        status: 'WARNING',
        details: `Alcohol format "${abvFmt}" may not comply strictly with standard TTB BAM phrasing (e.g., "ALC. 14.5% BY VOL." or "ALCOHOL 14.5% BY VOLUME"). Avoid "Proof" alone or unapproved abbreviations.`,
        regulatoryCitation: 'TTB BAM Chapter 3 / 27 CFR § 5.65',
        recommendation: 'Use standard phrasing: "ALC. __% BY VOL." or "ALCOHOL __% BY VOLUME".'
      });
    } else {
      findings.push({
        id: 'abv-pass',
        category: 'Alcohol Content (ABV)',
        rule: 'Alcohol Content Format',
        status: 'PASS',
        details: `Alcohol content stated as ${abvVal}% ABV in an authorized format.`,
        regulatoryCitation: '27 CFR § 4.36, § 5.65, § 7.65'
      });
    }
  }

  // 5. Net Contents / Standards of Fill
  const netContents = `${formData.netContentsValue || ''} ${formData.netContentsUnit || ''}`.trim();
  if (!netContents) {
    findings.push({
      id: 'net-missing',
      category: 'Net Contents',
      rule: 'Net Contents Statement',
      status: 'FAIL',
      details: 'Net contents / volume statement is missing.',
      regulatoryCitation: '27 CFR § 4.37, § 5.70, § 7.70',
      recommendation: 'Add clear net contents statement (e.g. "750 mL" or "12 FL. OZ.").'
    });
  } else {
    // Check standards of fill for wine & spirits
    if (formData.beverageType === 'wine') {
      const isStandard = WINE_STANDARDS_OF_FILL.some(s => netContents.toLowerCase().includes(s.toLowerCase().replace(' ', '')) || netContents.toLowerCase().includes(s.toLowerCase()));
      if (!isStandard) {
        findings.push({
          id: 'net-standard-wine',
          category: 'Net Contents',
          rule: 'Wine Standards of Fill (Metric)',
          status: 'WARNING',
          details: `Net content "${netContents}" might not be an authorized standard of fill under 27 CFR § 4.72 (e.g., 50mL, 187mL, 250mL, 355mL, 375mL, 500mL, 750mL, 1L, 1.5L, 3L).`,
          regulatoryCitation: '27 CFR § 4.72',
          recommendation: 'Verify volume aligns with approved metric container sizes.'
        });
      } else {
        findings.push({
          id: 'net-standard-pass',
          category: 'Net Contents',
          rule: 'Authorized Standard of Fill',
          status: 'PASS',
          details: `Net contents (${netContents}) adheres to 27 CFR metric standards of fill.`,
          regulatoryCitation: '27 CFR § 4.72'
        });
      }
    } else if (formData.beverageType === 'spirits') {
      const isStandard = SPIRITS_STANDARDS_OF_FILL.some(s => netContents.toLowerCase().includes(s.toLowerCase().replace(' ', '')) || netContents.toLowerCase().includes(s.toLowerCase()));
      if (!isStandard) {
        findings.push({
          id: 'net-standard-spirits',
          category: 'Net Contents',
          rule: 'Distilled Spirits Standards of Fill',
          status: 'WARNING',
          details: `Net content "${netContents}" should be checked against 27 CFR § 5.203 authorized sizes (50mL, 100mL, 200mL, 355mL, 375mL, 700mL, 750mL, 900mL, 1L, 1.75L).`,
          regulatoryCitation: '27 CFR § 5.203',
          recommendation: 'Confirm size matches approved standards of fill.'
        });
      } else {
        findings.push({
          id: 'net-standard-pass',
          category: 'Net Contents',
          rule: 'Authorized Standard of Fill',
          status: 'PASS',
          details: `Net contents (${netContents}) conforms to 27 CFR § 5.203 standards of fill.`,
          regulatoryCitation: '27 CFR § 5.203'
        });
      }
    } else {
      findings.push({
        id: 'net-malt-pass',
        category: 'Net Contents',
        rule: 'Net Contents Display',
        status: 'PASS',
        details: `Net contents stated as "${netContents}".`,
        regulatoryCitation: '27 CFR § 7.70'
      });
    }
  }

  // 6. Name and Address of Bottler/Producer
  if (!formData.bottlerName || !formData.bottlerAddress) {
    findings.push({
      id: 'bottler-missing',
      category: 'Bottler Statement',
      rule: 'Name and Address of Bottler/Producer',
      status: 'FAIL',
      details: 'Bottler/producer name and geographic address (City, State) are required on the container.',
      regulatoryCitation: '27 CFR § 4.35, § 5.66, § 7.66',
      recommendation: 'Provide complete bottler statement (e.g. "Bottled by ABC Distilling Co., Louisville, KY").'
    });
  } else {
    // Check statement phrasing
    const validStatements = ['bottled by', 'produced and bottled by', 'vinted and bottled by', 'brewed and canned by', 'brewed and bottled by', 'distilled and bottled by', 'imported by'];
    const lowerStmt = (formData.bottlerStatementType || '').toLowerCase();
    const hasQualifier = validStatements.some(s => lowerStmt.includes(s));

    if (!hasQualifier && !formData.bottlerName.toLowerCase().includes('by')) {
      findings.push({
        id: 'bottler-qualifier-warn',
        category: 'Bottler Statement',
        rule: 'Bottler Explanatory Phrase',
        status: 'WARNING',
        details: 'The name and address must be preceded by an explanatory phrase such as "Bottled by", "Produced and Bottled by", or "Brewed by".',
        regulatoryCitation: '27 CFR § 4.35, § 5.66',
        recommendation: 'Add appropriate prefix: "Bottled by", "Distilled by", etc.'
      });
    } else {
      findings.push({
        id: 'bottler-pass',
        category: 'Bottler Statement',
        rule: 'Name and Address of Bottler/Producer',
        status: 'PASS',
        details: `Bottler statement present: ${formData.bottlerStatementType || 'Bottled by'} ${formData.bottlerName}, ${formData.bottlerAddress}.`,
        regulatoryCitation: '27 CFR § 4.35, § 5.66, § 7.66'
      });
    }
  }

  // 7. Sulfite Declaration for Wine
  if (formData.beverageType === 'wine') {
    if (formData.containsSulfites) {
      findings.push({
        id: 'sulfite-pass',
        category: 'Sulfites & Disclosures',
        rule: 'Declaration of Sulfites',
        status: 'PASS',
        details: 'Sulfite disclosure statement ("CONTAINS SULFITES") is present.',
        regulatoryCitation: '27 CFR § 4.32(e)'
      });
    } else {
      findings.push({
        id: 'sulfite-warn',
        category: 'Sulfites & Disclosures',
        rule: 'Declaration of Sulfites',
        status: 'WARNING',
        details: 'Wine containing 10 or more ppm sulfur dioxide requires "CONTAINS SULFITES". If this wine has no added sulfites and naturally contains under 10 ppm, an analysis lab exemption is required.',
        regulatoryCitation: '27 CFR § 4.32(e)',
        recommendation: 'Ensure "CONTAINS SULFITES" is included unless laboratory exemption was granted by TTB.'
      });
    }
  }

  // 8. Prohibited Claims Check (Curative / Health Claims)
  const allText = `${formData.brandName} ${formData.fancifulName || ''} ${formData.notes || ''}`.toLowerCase();
  const prohibitedHits = PROHIBITED_HEALTH_KEYWORDS.filter(k => allText.includes(k));
  if (prohibitedHits.length > 0) {
    findings.push({
      id: 'prohibited-claim',
      category: 'Prohibited Claims',
      rule: 'Prohibited Health & Curative Claims',
      status: 'FAIL',
      details: `Label contains prohibited health/curative terms: "${prohibitedHits.join(', ')}". TTB prohibits statements that claim therapeutic, medicinal, or health-improving effects.`,
      regulatoryCitation: '27 CFR § 4.39, § 5.122, § 7.122',
      recommendation: 'Remove therapeutic or medicinal claims from all label copy.'
    });
  }

  // Calculate Overall Status and Compliance Score
  const fails = findings.filter(f => f.status === 'FAIL');
  const warnings = findings.filter(f => f.status === 'WARNING');
  const passes = findings.filter(f => f.status === 'PASS');

  let overallStatus: ComplianceStatus = 'COMPLIANT';
  if (fails.length > 0) {
    overallStatus = 'NON_COMPLIANT';
  } else if (warnings.length > 0) {
    overallStatus = 'NEEDS_REVIEW';
  }

  // Score calculation:
  // Total potential score = 100
  // Each FAIL docks 25 points
  // Each WARNING docks 10 points
  const rawScore = 100 - (fails.length * 25) - (warnings.length * 10);
  const complianceScore = Math.max(0, Math.min(100, rawScore));

  let summary = '';
  if (overallStatus === 'COMPLIANT') {
    summary = `Label is compliant with all evaluated TTB BAM and 27 CFR mandatory requirements (${passes.length} checks passed). Ready for COLA submission.`;
  } else if (overallStatus === 'NEEDS_REVIEW') {
    summary = `Label passed mandatory baseline checks but has ${warnings.length} advisory item(s) that should be reviewed prior to TTB submission.`;
  } else {
    summary = `Label contains ${fails.length} critical TTB regulatory violation(s) that will trigger a COLA rejection: ${fails.map(f => f.rule).join(', ')}.`;
  }

  return {
    overallStatus,
    complianceScore,
    findings,
    summary
  };
}
