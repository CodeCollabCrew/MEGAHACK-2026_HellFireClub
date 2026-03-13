"use client";
import { useState, useEffect, useCallback } from "react";
import {
  FileSpreadsheet,
  Upload,
  Mail,
  ChevronRight,
  Loader2,
  Lightbulb,
  Target,
  BarChart3,
  X,
} from "lucide-react";
import { excelApi } from "@/lib/api";

export interface ExcelAttachment {
  _id: string;
  emailId: string;
  attachmentId: string;
  filename: string;
  mimeType: string;
  size?: number;
  emailSubject?: string;
  emailFrom?: string;
  receivedAt?: string;
}

export interface ExcelAnalysisResult {
  summary: string;
  insights: string[];
  recommendations: string[];
  columns: string[];
  rowCount: number;
  preview: Record<string, unknown>[];
}

type SourceTab = "email" | "upload";

export default function ExcelAnalysisPanel() {
  const [sourceTab, setSourceTab] = useState<SourceTab>("email");
  const [attachments, setAttachments] = useState<ExcelAttachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(true);
  const [selectedAttachment, setSelectedAttachment] = useState<ExcelAttachment | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ExcelAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchAttachments = useCallback(async () => {
    setLoadingAttachments(true);
    try {
      const res = await excelApi.getAttachments();
      setAttachments(res.data?.data || []);
    } catch {
      setAttachments([]);
    } finally {
      setLoadingAttachments(false);
    }
  }, []);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const runAnalysis = async () => {
    setError(null);
    setResult(null);
    setAnalyzing(true);

    try {
      if (sourceTab === "upload" && uploadFile) {
        const res = await excelApi.analyzeFile(uploadFile);
        setResult(res.data?.data || null);
      } else if (sourceTab === "email" && selectedAttachment) {
        const res = await excelApi.analyzeFromEmail(
          selectedAttachment.emailId,
          selectedAttachment.attachmentId
        );
        setResult(res.data?.data || null);
      } else {
        setError(sourceTab === "upload" ? "Select a file to upload" : "Select an Excel file from email");
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  const canAnalyze =
    (sourceTab === "email" && selectedAttachment) || (sourceTab === "upload" && uploadFile);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "20px", minHeight: "500px" }} className="email-grid">
      {/* Left: Source selection */}
      <div className="card" style={{ padding: "0", display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 180px)" }}>
        <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)", display: "flex", gap: "8px" }}>
          <button
            onClick={() => { setSourceTab("email"); setSelectedAttachment(null); setResult(null); setError(null); }}
            style={{
              flex: 1, padding: "8px 12px", fontSize: "12px", border: "1px solid var(--border)",
              borderRadius: "3px", cursor: "pointer", background: sourceTab === "email" ? "var(--punch-bg)" : "transparent",
              color: sourceTab === "email" ? "var(--punch)" : "var(--text-2)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
            }}>
            <Mail size={14} /> From Email
          </button>
          <button
            onClick={() => { setSourceTab("upload"); setUploadFile(null); setResult(null); setError(null); }}
            style={{
              flex: 1, padding: "8px 12px", fontSize: "12px", border: "1px solid var(--border)",
              borderRadius: "3px", cursor: "pointer", background: sourceTab === "upload" ? "var(--punch-bg)" : "transparent",
              color: sourceTab === "upload" ? "var(--punch)" : "var(--text-2)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
            }}>
            <Upload size={14} /> Upload
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
          {sourceTab === "email" && (
            <>
              {loadingAttachments ? (
                <div style={{ display: "flex", justifyContent: "center", padding: "40px" }}>
                  <Loader2 size={20} className="anim-spin" style={{ color: "var(--text-3)" }} />
                </div>
              ) : attachments.length === 0 ? (
                <div style={{ padding: "24px", textAlign: "center" }}>
                  <FileSpreadsheet size={32} style={{ color: "var(--text-3)", marginBottom: "12px" }} />
                  <p style={{ fontSize: "13px", color: "var(--text-2)" }}>No Excel files from email</p>
                  <p style={{ fontSize: "11px", color: "var(--text-3)", marginTop: "6px" }}>
                    Connect Gmail & sync to see attachments
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {attachments.map((att) => (
                    <button
                      key={att._id}
                      onClick={() => setSelectedAttachment(att)}
                      style={{
                        display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px",
                        borderRadius: "3px", border: "1px solid var(--border)", cursor: "pointer",
                        background: selectedAttachment?._id === att._id ? "var(--punch-bg)" : "var(--card)",
                        color: "var(--text)", textAlign: "left", width: "100%"
                      }}>
                      <FileSpreadsheet size={16} style={{ color: "var(--punch)", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: "12px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {att.filename}
                        </p>
                        <p style={{ fontSize: "10px", color: "var(--text-3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {att.emailSubject || att.emailFrom}
                        </p>
                      </div>
                      <ChevronRight size={14} style={{ color: "var(--text-3)", flexShrink: 0 }} />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {sourceTab === "upload" && (
            <label
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                padding: "32px", border: "2px dashed var(--border)", borderRadius: "6px",
                cursor: "pointer", background: "var(--surface)", minHeight: "180px",
                borderColor: uploadFile ? "var(--punch)" : "var(--border)"
              }}
            >
              <input
                type="file"
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setUploadFile(f || null);
                  setResult(null);
                  setError(null);
                }}
                style={{ display: "none" }}
              />
              <Upload size={36} style={{ color: uploadFile ? "var(--punch)" : "var(--text-3)", marginBottom: "12px" }} />
              <span style={{ fontSize: "13px", color: "var(--text-2)" }}>
                {uploadFile ? uploadFile.name : "Click to select Excel / CSV"}
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-3)", marginTop: "4px" }}>
                .xlsx, .xls, .csv
              </span>
            </label>
          )}
        </div>

        <div style={{ padding: "14px 16px", borderTop: "1px solid var(--border)" }}>
          <button
            onClick={runAnalysis}
            disabled={!canAnalyze || analyzing}
            className="btn-punch"
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              padding: "10px 16px", fontSize: "13px", opacity: canAnalyze && !analyzing ? 1 : 0.5
            }}
          >
            {analyzing ? <Loader2 size={14} className="anim-spin" /> : <BarChart3 size={14} />}
            {analyzing ? "Analyzing…" : "Analyze with AI"}
          </button>
        </div>
      </div>

      {/* Right: Analysis results */}
      <div className="card" style={{ padding: "0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {!result && !error && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px", color: "var(--text-3)" }}>
            <FileSpreadsheet size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
            <p style={{ fontSize: "14px" }}>Select a file and run analysis</p>
            <p style={{ fontSize: "12px", marginTop: "6px" }}>Get summary, insights & recommendations</p>
          </div>
        )}

        {error && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px" }}>
            <p style={{ fontSize: "14px", color: "var(--red)" }}>{error}</p>
            <button onClick={() => setError(null)} className="btn-outline" style={{ marginTop: "12px", padding: "8px 16px" }}>
              Try again
            </button>
          </div>
        )}

        {result && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "3px", background: "var(--punch-bg)", border: "1px solid var(--punch-bdr)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <BarChart3 size={16} style={{ color: "var(--punch)" }} />
                </div>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>Excel Analysis</p>
                  <p style={{ fontSize: "11px", color: "var(--text-3)" }}>{result.rowCount} rows · {result.columns.length} columns</p>
                </div>
              </div>
              <button onClick={() => setResult(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ padding: "14px 16px", background: "var(--punch-bg)", border: "1px solid var(--punch-bdr)", borderRadius: "4px" }}>
                <p style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "var(--punch)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Summary</p>
                <p style={{ fontSize: "13px", color: "var(--text-2)", lineHeight: 1.6 }}>{result.summary}</p>
              </div>

              {result.insights?.length > 0 && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <Lightbulb size={14} style={{ color: "var(--yellow)" }} />
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)" }}>Key Insights</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "var(--text-2)", lineHeight: 1.7 }}>
                    {result.insights.map((s, i) => (
                      <li key={i} style={{ marginBottom: "6px" }}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.recommendations?.length > 0 && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                    <Target size={14} style={{ color: "var(--green)" }} />
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text)" }}>Recommendations</span>
                  </div>
                  <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "13px", color: "var(--text-2)", lineHeight: 1.7 }}>
                    {result.recommendations.map((s, i) => (
                      <li key={i} style={{ marginBottom: "6px" }}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.preview?.length > 0 && (
                <div>
                  <p style={{ fontFamily: "'Space Mono',monospace", fontSize: "10px", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "10px" }}>Data Preview</p>
                  <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: "4px" }}>
                    <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
                          {result.columns.map((col) => (
                            <th key={col} style={{ padding: "8px 12px", textAlign: "left", fontWeight: 600, color: "var(--text)" }}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.preview.slice(0, 8).map((row, i) => (
                          <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                            {result.columns.map((col) => (
                              <td key={col} style={{ padding: "8px 12px", color: "var(--text-2)" }}>
                                {String(row[col] ?? "")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
