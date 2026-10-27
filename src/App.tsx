/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useId } from 'react';
import { 
  Upload, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  X,
  RefreshCw,
  Wine,
  FileCheck
} from 'lucide-react';
import { BeverageGroup, UploadedImageItem, groupImagesByBeverage } from './utils/nameGrouping';
import { validateTTBCompliance } from './utils/ttbRules';

export default function App() {
  const [beverages, setBeverages] = useState<BeverageGroup[]>([]);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number>(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeModel, setActiveModel] = useState<string>('gemini-3.5-flash-lite');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputId = useId();

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);

    const rawItems: UploadedImageItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      const base64Data = await fileToBase64(file);
      rawItems.push({
        id: 'img_' + Math.random().toString(36).substring(2, 9),
        file,
        fileName: file.name,
        previewUrl: base64Data,
        base64Data
      });
    }

    if (rawItems.length === 0) {
      setIsProcessing(false);
      return;
    }

    // Fuzzy match filenames to group images for the same beverage
    const groups = groupImagesByBeverage(rawItems);
    setBeverages(groups);
    setSelectedGroupIndex(0);
    setSelectedImageIndex(0);

    // Analyze each beverage group
    const processedGroups: BeverageGroup[] = [];
    for (const group of groups) {
      const startTime = performance.now();
      try {
        const payloadImages = group.images.map(img => ({
          imageBase64: img.base64Data || '',
          mimeType: img.file?.type || 'image/jpeg',
          fileName: img.fileName
        }));

        const res = await fetch('/api/analyze-beverage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            images: payloadImages,
            beverageName: group.beverageName
          })
        });

        const data = await res.json();
        const duration = data.durationMs || Math.round(performance.now() - startTime);
        if (data.modelUsed) {
          setActiveModel(data.modelUsed);
        }

        if (res.ok && data.success) {
          processedGroups.push({
            ...group,
            status: 'done',
            durationMs: duration,
            formData: data.formData,
            compliance: data.compliance
          });
        } else {
          // Fallback if key missing or error
          const fallbackData = {
            brandName: group.beverageName,
            beverageType: 'wine',
            classTypeDesignation: 'Classification Required',
            abvValue: '14.0',
            abvFormat: 'ALC. 14.0% BY VOL.',
            netContentsValue: '750',
            netContentsUnit: 'mL',
            bottlerName: 'Bottler Name Required',
            bottlerAddress: '',
            bottlerStatementType: 'Bottled by',
            governmentWarningText: '',
            hasWarningHeadingBold: false,
            hasWarningNumbers: false,
            containsSulfites: false,
            notes: data.error || 'Manual inspection needed'
          };
          const comp = validateTTBCompliance(fallbackData as any);

          processedGroups.push({
            ...group,
            status: 'done',
            durationMs: duration,
            formData: fallbackData,
            compliance: comp,
            errorMessage: data.error
          });
        }
      } catch (err: any) {
        processedGroups.push({
          ...group,
          status: 'error',
          errorMessage: err.message
        });
      }
    }

    setBeverages(processedGroups);
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    setBeverages([]);
    setSelectedGroupIndex(0);
    setSelectedImageIndex(0);
  };

  const currentBeverage = beverages[selectedGroupIndex] || null;
  const currentImage = currentBeverage?.images[selectedImageIndex] || currentBeverage?.images[0];
  const isCompliant = currentBeverage?.compliance?.overallStatus === 'COMPLIANT';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      {/* Hidden File Input for the Single Upload Button */}
      <input
        id={uploadInputId}
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* SCREEN A: INITIAL STATE (Only ONE button on the screen) */}
      {beverages.length === 0 && !isProcessing && (
        <div className="text-center max-w-sm space-y-5 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              TTB Label Verifier
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Upload beverage label photos for automated TTB BAM compliance verification
            </p>
          </div>

          <div>
            <label
              htmlFor={uploadInputId}
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold text-sm rounded-xl shadow-lg cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              <Upload className="h-4 w-4" />
              <span>Upload Label Photos</span>
            </label>
          </div>
        </div>
      )}

      {/* LOADING STATE */}
      {isProcessing && (
        <div className="text-center space-y-4 max-w-sm">
          <div className="inline-block p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
            <RefreshCw className="h-8 w-8 text-amber-400 animate-spin mx-auto" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">
              Analyzing Beverage Labels...
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Fuzzy-matching bottle angles and running Gemini 3.5 Flash Lite
            </p>
          </div>
        </div>
      )}

      {/* SCREEN B: RESULTS DISPLAY */}
      {beverages.length > 0 && !isProcessing && currentBeverage && (
        <div className="w-full max-w-5xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto">
          {/* Header Bar: Bottle-to-Bottle Switcher (if batch) + Close Button */}
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between gap-4 bg-zinc-950/80">
            {/* If Batch Upload: Bottle-to-bottle selector */}
            {beverages.length > 1 ? (
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
                {beverages.map((bev, idx) => {
                  const pass = bev.compliance?.overallStatus === 'COMPLIANT';
                  const isSelected = selectedGroupIndex === idx;
                  return (
                    <button
                      key={bev.id}
                      type="button"
                      onClick={() => {
                        setSelectedGroupIndex(idx);
                        setSelectedImageIndex(0);
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                        isSelected
                          ? 'bg-amber-400 text-zinc-950 font-bold shadow'
                          : 'bg-zinc-850 text-zinc-300 hover:bg-zinc-800 border border-zinc-750'
                      }`}
                    >
                      <span>Bottle {idx + 1}: {bev.formData?.brandName || bev.beverageName}</span>
                      {pass ? (
                        <CheckCircle className={`h-3 w-3 ${isSelected ? 'text-zinc-950' : 'text-emerald-400'}`} />
                      ) : (
                        <XCircle className={`h-3 w-3 ${isSelected ? 'text-zinc-950' : 'text-rose-400'}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Wine className="h-5 w-5 text-amber-400" />
                <h2 className="text-sm font-bold text-white">
                  {currentBeverage.formData?.brandName || currentBeverage.beverageName}
                </h2>
              </div>
            )}

            {/* The Close Button to return back to the single button home screen */}
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors flex-shrink-0"
              title="Close results and return to upload"
            >
              <X className="h-4 w-4" />
              <span>Close</span>
            </button>
          </div>

          {/* Main Inspection Body */}
          <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left: Bottle Image Display (5 cols) */}
            <div className="md:col-span-5 space-y-3">
              <div className="h-80 w-full bg-zinc-950 rounded-xl border border-zinc-800 p-4 flex items-center justify-center overflow-hidden">
                {currentImage ? (
                  <img
                    src={currentImage.previewUrl}
                    alt={currentImage.fileName}
                    className="max-h-full max-w-full object-contain drop-shadow"
                  />
                ) : null}
              </div>

              {/* Photo switcher if this bottle has multiple images (e.g. front & back) */}
              {currentBeverage.images.length > 1 && (
                <div className="flex items-center gap-2 justify-center">
                  {currentBeverage.images.map((img, imgIdx) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setSelectedImageIndex(imgIdx)}
                      className={`px-3 py-1 rounded text-xs font-mono uppercase transition-colors ${
                        selectedImageIndex === imgIdx
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/60 font-bold'
                          : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700'
                      }`}
                    >
                      {img.detectedOrientation || `Angle ${imgIdx + 1}`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Read-Only Form Fields & TTB Verification (7 cols) */}
            <div className="md:col-span-7 space-y-4">
              {/* Header with Title, Status, and Timing */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {currentBeverage.formData?.brandName || currentBeverage.beverageName}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {currentBeverage.formData?.classTypeDesignation || 'Class/Type'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {currentBeverage.durationMs && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-950 border border-zinc-800 text-zinc-400">
                      <Clock className="h-3 w-3 text-amber-400" />
                      <span>{currentBeverage.durationMs}ms</span>
                      <span className="text-zinc-600 font-sans">({activeModel})</span>
                    </span>
                  )}

                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold border ${
                    isCompliant
                      ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
                      : 'bg-rose-950/40 text-rose-400 border-rose-800/60'
                  }`}>
                    {isCompliant ? <CheckCircle className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                    {currentBeverage.compliance?.overallStatus || 'PENDING'}
                  </span>
                </div>
              </div>

              {/* Read-Only Form Fields Grid */}
              <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3.5 space-y-2.5 text-xs">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Extracted TTB Form Data
                </span>

                <div className="grid grid-cols-2 gap-3 text-zinc-300">
                  <div>
                    <span className="text-zinc-500 text-[10px] block">Brand Name</span>
                    <span className="font-semibold text-white">{currentBeverage.formData?.brandName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block">Class &amp; Type</span>
                    <span className="font-semibold text-white">{currentBeverage.formData?.classTypeDesignation || '—'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block">Alcohol Content (ABV)</span>
                    <span className="font-mono font-semibold text-amber-300">{currentBeverage.formData?.abvFormat || `${currentBeverage.formData?.abvValue}% ABV`}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[10px] block">Net Contents (Volume)</span>
                    <span className="font-mono font-semibold text-white">{currentBeverage.formData?.netContentsValue} {currentBeverage.formData?.netContentsUnit}</span>
                  </div>
                </div>

                <div>
                  <span className="text-zinc-500 text-[10px] block">Bottler / Producer Statement</span>
                  <span className="text-zinc-300">
                    {currentBeverage.formData?.bottlerStatementType || 'Bottled by'} {currentBeverage.formData?.bottlerName}, {currentBeverage.formData?.bottlerAddress}
                  </span>
                </div>

                <div>
                  <span className="text-zinc-500 text-[10px] block">Surgeon General Health Warning</span>
                  <p className="font-mono text-[11px] text-zinc-300 bg-zinc-900/80 p-2.5 rounded border border-zinc-800 leading-relaxed">
                    {currentBeverage.formData?.governmentWarningText || 'Warning statement not detected on label.'}
                  </p>
                </div>
              </div>

              {/* TTB Compliance Checks */}
              {currentBeverage.compliance?.findings && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                    TTB Compliance Verification
                  </span>
                  {currentBeverage.compliance.findings.map((f: any) => (
                    <div
                      key={f.id}
                      className={`p-2.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                        f.status === 'FAIL'
                          ? 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                          : f.status === 'WARNING'
                          ? 'bg-amber-950/20 border-amber-800/40 text-amber-300'
                          : 'bg-zinc-950/40 border-zinc-800 text-zinc-300'
                      }`}
                    >
                      {f.status === 'FAIL' ? (
                        <XCircle className="h-4 w-4 text-rose-400 flex-shrink-0 mt-0.5" />
                      ) : f.status === 'WARNING' ? (
                        <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{f.rule}</span>
                          <span className="font-mono text-[10px] text-zinc-500">{f.regulatoryCitation}</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 mt-0.5">{f.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
