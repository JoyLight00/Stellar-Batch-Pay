"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/file-upload";
import { parsePaymentFile, getBatchSummary } from "@/lib/stellar";
import type { ParsedPaymentFile } from "@/lib/stellar/types";
import {
  Send,
  Info,
  Lightbulb,
  Check,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function NewBatchPaymentPage() {
  const [step, setStep] = useState(1);
  const [selectedNetwork, setSelectedNetwork] = useState<"testnet" | "mainnet">("testnet");
  const [file, setFile] = useState<File | null>(null);
  const [fileFormat, setFileFormat] = useState<"json" | "csv" | null>(null);
  const [validationResult, setValidationResult] = useState<ParsedPaymentFile | null>(null);
  const [validationError, setValidationError] = useState("");
  const [summary, setSummary] = useState<{
    recipientCount: number;
    validCount: number;
    invalidCount: number;
    totalAmount: string;
    assetBreakdown: Record<string, number>;
  } | null>(null);

  const handleFileSelect = async (selectedFile: File, format: "json" | "csv") => {
    setFile(selectedFile);
    setFileFormat(format);

    try {
      const content = await selectedFile.text();
      const parsed = parsePaymentFile(content, format);
      setValidationResult(parsed);
      setValidationError("");
      
      // Calculate summary using enhanced getBatchSummary
      const instructions = parsed.rows.map(r => r.instruction);
      const batchSummary = getBatchSummary(instructions);
      setSummary(batchSummary);
      
      toast.success("File parsed and validated successfully");
      setStep(2);
    } catch (error) {
      console.error("Failed to parse file:", error);
      setValidationResult(null);
      setSummary(null);
      setValidationError(error instanceof Error ? error.message : "Failed to parse payment file");
      toast.error(error instanceof Error ? error.message : "Failed to parse payment file");
    }
  };

  const estimatedFees = summary ? (summary.validCount * 0.0001).toFixed(4) : "0.0000";

  const steps = [
    { id: 1, name: "Upload" },
    { id: 2, name: "Validate" },
    { id: 3, name: "Review" },
    { id: 4, name: "Submit" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/dashboard" className="text-slate-400 hover:text-white">
          Dashboard
        </Link>
        <span className="text-slate-600">›</span>
        <span className="text-emerald-500">New Batch Payment</span>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          New Batch Payment
        </h1>
        <p className="text-slate-400">
          Upload a payment file and send multiple crypto transactions securely.
        </p>
      </div>

      {/* Stepper */}
      <div className="mb-8 pt-4">
        <div className="flex items-center justify-between relative max-w-2xl mx-auto">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-800 -z-10" />
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-500 -z-10 transition-all duration-300" style={{ width: `${((step - 1) / 3) * 100}%` }} />
          {steps.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-2 bg-[#0B0F1A] px-2 md:px-4">
              <button
                disabled={step < s.id && (s.id > 1 && (!file || !summary))}
                onClick={() => {
                   if (s.id === 1) setStep(1);
                   if (s.id === 2 && summary) setStep(2);
                   if (s.id === 3 && summary && summary.invalidCount === 0) setStep(3);
                   if (s.id === 4 && summary && summary.invalidCount === 0) setStep(4);
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors border-2 outline-hidden disabled:cursor-not-allowed ${
                  step > s.id 
                    ? 'bg-emerald-500 border-emerald-500 text-white cursor-pointer hover:bg-emerald-600' 
                    : step === s.id
                      ? 'bg-[#0B0F1A] border-emerald-500 text-emerald-500'
                      : 'bg-[#0B0F1A] border-slate-700 text-slate-500'
                }`}
              >
                {step > s.id ? <Check className="w-4 h-4" /> : s.id}
              </button>
              <span className={`text-xs font-medium hidden sm:block ${step >= s.id ? 'text-emerald-500' : 'text-slate-500'}`}>{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-xl text-white">
                  Upload Payment File
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUpload onFileSelect={handleFileSelect} />
                {file && (
                  <div className="mt-4 text-sm text-slate-400">
                    Selected:
                    <span className="text-white font-medium"> {file.name}</span>
                    {fileFormat && (
                      <span className="ml-2 text-emerald-500">
                        ({fileFormat.toUpperCase()})
                      </span>
                    )}
                  </div>
                )}
                {validationError && (
                  <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                    {validationError}
                  </div>
                )}
              </CardContent>
            </Card>
            <div className="flex justify-end pt-4">
              <Button 
                onClick={() => setStep(2)} 
                disabled={!file || !summary}
                className="bg-emerald-500 hover:bg-emerald-600 text-white w-full sm:w-auto px-8"
              >
                Continue to Validation
              </Button>
            </div>
          </div>
          <div className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  <CardTitle className="text-lg text-white">Tips</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-slate-400">
                    Use valid Stellar wallet addresses
                  </p>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-slate-400">Verify amounts and asset types</p>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <p className="text-slate-400">Test with small amounts first</p>
                </div>
                <button className="text-emerald-500 hover:text-emerald-400 text-sm flex items-center gap-1 mt-2">
                  <BookOpen className="w-3 h-3" />
                  View Documentation
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Step 2: Validate */}
      {step === 2 && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {validationResult && (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-xl text-white">
                  Validation Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4">
                    <p className="text-sm text-slate-400">Rows Parsed</p>
                    <p className="mt-1 text-2xl font-bold text-white">
                      {summary?.recipientCount || 0}
                    </p>
                  </div>
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
                    <p className="text-sm text-emerald-200">Valid Rows</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-400">
                      {summary?.validCount || 0}
                    </p>
                  </div>
                  <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
                    <p className="text-sm text-red-200">Invalid Rows</p>
                    <p className="mt-1 text-2xl font-bold text-red-400">
                      {summary?.invalidCount || 0}
                    </p>
                  </div>
                </div>

                <div className="overflow-hidden rounded-lg border border-slate-800">
                  <div className="overflow-x-auto overflow-y-auto max-h-96">
                    <table className="w-full text-sm min-w-[600px] md:min-w-full">
                      <thead className="sticky top-0 bg-slate-950 z-10">
                        <tr className="text-slate-300">
                          <th className="px-4 py-3 text-left font-medium w-12">
                            Row
                          </th>
                          <th className="px-4 py-3 text-left font-medium">
                            Address
                          </th>
                          <th className="px-4 py-3 text-right font-medium">
                            Amount
                          </th>
                          <th className="px-4 py-3 text-left font-medium">
                            Asset
                          </th>
                          <th className="px-4 py-3 text-center font-medium">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left font-medium">
                            Error
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {validationResult.rows.map((row) => (
                          <tr
                            key={`${row.rowNumber}-${row.instruction.address}-${row.instruction.amount}`}
                            className="border-t border-slate-800 bg-slate-950/30 text-slate-200"
                          >
                            <td className="px-4 py-3 font-mono text-xs text-slate-400">
                              {row.rowNumber}
                            </td>
                            <td
                              className="px-4 py-3 font-mono text-xs max-w-[150px] md:max-w-[240px] truncate"
                              title={row.instruction.address}
                            >
                              {row.instruction.address ? (
                                <>
                                  <span className="hidden md:inline">{row.instruction.address}</span>
                                  <span className="md:hidden">{row.instruction.address.slice(0, 8)}...{row.instruction.address.slice(-4)}</span>
                                </>
                              ) : (
                                <span className="text-red-400 italic font-sans text-[11px]">Missing address</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-xs">
                              {row.instruction.amount || "-"}
                            </td>
                            <td className="px-4 py-3 font-mono text-xs">
                              {row.instruction.asset || "-"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${row.valid
                                    ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
                                    : "bg-red-500/15 text-red-300 border border-red-500/20"
                                  }`}
                                title={
                                  row.valid
                                    ? `Row ${row.rowNumber} is valid`
                                    : `Row ${row.rowNumber}: ${row.error}`
                                }
                              >
                                {row.valid ? "Valid" : "Invalid"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-red-300/80 max-w-[150px] md:max-w-none truncate md:whitespace-normal">
                              {row.error
                                ? row.error
                                : <span className="text-slate-500 italic text-[11px]">No issues</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          <div className="flex justify-between items-center pt-4 border-t border-slate-800/50">
            <Button variant="outline" onClick={() => setStep(1)} className="border-slate-700 text-slate-300 bg-transparent hover:bg-slate-800 hover:text-white px-8">
              Back
            </Button>
            {summary && summary.invalidCount > 0 ? (
              <Button 
                variant="destructive"
                onClick={() => setStep(1)}
              >
                Resolve Validation Errors to Continue
              </Button>
            ) : (
              <Button onClick={() => setStep(3)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-8">
                Continue to Review
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-xl text-white">
                  Network Selection
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedNetwork("testnet")}
                    className={`relative p-6 rounded-lg border-2 transition-all text-left ${selectedNetwork === "testnet"
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-slate-700 bg-slate-950/50 hover:border-slate-600"
                      }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-white font-semibold text-lg">
                        Testnet
                      </h3>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedNetwork === "testnet"
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-slate-600"
                          }`}
                      >
                        {selectedNetwork === "testnet" && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                    <p className="text-slate-400 text-sm">
                      Practice mode - No real funds
                    </p>
                  </button>

                  <button
                    onClick={() => setSelectedNetwork("mainnet")}
                    className={`relative p-6 rounded-lg border-2 transition-all text-left ${selectedNetwork === "mainnet"
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-slate-700 bg-slate-950/50 hover:border-slate-600"
                      }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-white font-semibold text-lg">
                        Mainnet
                      </h3>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedNetwork === "mainnet"
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-slate-600"
                          }`}
                      >
                        {selectedNetwork === "mainnet" && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                      <p className="text-yellow-500 text-sm">Real transactions</p>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-xl text-white">
                  Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total Recipients</span>
                  <span className="text-white font-semibold text-lg">
                    {summary ? summary.recipientCount : "0"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Valid Payments</span>
                  <span className="text-emerald-500 font-semibold text-lg">
                    {summary ? summary.validCount : "0"}
                  </span>
                </div>
                {summary && summary.invalidCount > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Invalid Payments</span>
                    <span className="text-red-500 font-semibold text-lg">
                      {summary.invalidCount}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="col-span-1 lg:col-span-3">
             <div className="flex justify-between items-center pt-4 border-t border-slate-800/50">
                <Button variant="outline" onClick={() => setStep(2)} className="border-slate-700 text-slate-300 bg-transparent hover:bg-slate-800 hover:text-white px-8">
                  Back
                </Button>
                <Button onClick={() => setStep(4)} className="bg-emerald-500 hover:bg-emerald-600 text-white px-8">
                  Proceed to Submit
                </Button>
             </div>
          </div>
        </div>
      )}

      {/* Step 4: Submit */}
      {step === 4 && (
        <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="bg-slate-900/50 border-slate-800 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
            <CardHeader className="pt-10">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                <Send className="w-10 h-10 text-emerald-500 ml-1" />
              </div>
              <CardTitle className="text-2xl text-white">Ready to Fire</CardTitle>
              <p className="text-slate-400 mt-2 max-w-sm mx-auto">
                Review your final details before broadcasting the batch on the {selectedNetwork === "mainnet" ? "Mainnet" : "Testnet"}.
              </p>
            </CardHeader>
            <CardContent className="space-y-6 px-10 pb-10">
              <div className="bg-slate-950/80 rounded-xl p-6 border border-slate-800/80 text-left">
                <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
                  <span className="text-slate-400 font-medium">Network</span>
                  <span className="text-white capitalize font-semibold">{selectedNetwork}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
                  <span className="text-slate-400 font-medium">Recipients</span>
                  <span className="text-white font-semibold">{summary?.validCount} Addresses</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
                  <span className="text-slate-400 font-medium">Network Fees</span>
                  <span className="text-white font-mono text-sm">{estimatedFees} XLM</span>
                </div>
                <div className="flex justify-between items-center py-4">
                  <span className="text-slate-400 font-medium text-lg">Total Payout</span>
                  <span className="text-emerald-400 font-bold text-2xl">
                    {summary ? parseFloat(summary.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 }) : "0.00"}{" "}
                    {summary && Object.keys(summary.assetBreakdown).length === 1 
                      ? Object.keys(summary.assetBreakdown)[0] 
                      : "XLM"}
                  </span>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-left flex items-start gap-3">
                 <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                 <div>
                   <h4 className="text-sm font-semibold text-yellow-500">Irreversible Action</h4>
                   <p className="text-xs text-yellow-500/80 mt-1 leading-relaxed">
                     Once submitted, blockchain transactions cannot be cancelled or reversed. Please ensure all wallet addresses and amounts are correct.
                   </p>
                 </div>
              </div>

              <div className="flex justify-between pt-4 items-center">
                <Button variant="ghost" onClick={() => setStep(3)} className="text-slate-400 hover:text-white hover:bg-slate-800">
                  Cancel
                </Button>
                <Button 
                  className="h-12 px-8 bg-emerald-500 hover:bg-emerald-600 text-white text-base font-semibold shadow-lg shadow-emerald-500/20 rounded-xl w-full sm:w-auto"
                >
                  Confirm & Send Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
