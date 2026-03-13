"use client";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  MessageSquare,
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

export interface SavedExcelAnalysis extends ExcelAnalysisResult {
  _id: string;
  userId: string;
  sourceType: "email" | "upload";
  emailId?: string | null;
  attachmentId?: string | null;
  filename: string;
  mimeType?: string | null;
  size?: number | null;
  createdAt: string;
  updatedAt: string;
}

type SourceTab = "email" | "upload";

const STAGGER_MS = 380;

export default function ExcelAnalysisPanel() {
  const [sourceTab, setSourceTab] = useState<SourceTab>("email");
  const [attachments, setAttachments] = useState<ExcelAttachment[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(true);
  const [selectedAttachment, setSelectedAttachment] = useState<ExcelAttachment | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ExcelAnalysisResult | null>(null);
  const [streamingItems, setStreamingItems] = useState<{
    summary: string;
    insights: string[];
    recommendations: string[];
    stage: "summary" | "insights" | "recommendations" | "done";
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);
  const [hoveredUploadIndex, setHoveredUploadIndex] = useState<number | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [savedAnalyses, setSavedAnalyses] = useState<SavedExcelAnalysis[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

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

  useEffect(() => {
    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        const res = await excelApi.getHistory();
        const list = (res.data?.data || []) as SavedExcelAnalysis[];
        setSavedAnalyses(list);
        if (!result && list.length > 0) {
          // auto-load most recent analysis so refresh par bhi charts dikhen
          const latest = list[0];
          setResult({
            summary: latest.summary,
            insights: latest.insights,
            recommendations: latest.recommendations,
            columns: latest.columns,
            rowCount: latest.rowCount,
            preview: latest.preview,
          });
        }
      } catch {
        // ignore history error in UI
      } finally {
        setLoadingHistory(false);
      }
    };
    loadHistory();
  }, [result]);

  const runAnalysis = useCallback(async () => {
    setError(null);
    setResult(null);
    setStreamingItems(null);
    setAnalyzing(true);
    abortRef.current = false;

    try {
      let res: any;
      if (sourceTab === "upload" && uploadFile) {
        res = await excelApi.analyzeFile(uploadFile);
      } else if (sourceTab === "email" && selectedAttachment) {
        res = await excelApi.analyzeFromEmail(
          selectedAttachment.emailId,
          selectedAttachment.attachmentId
        );
      } else {
        setError(sourceTab === "upload" ? "Select a file to upload" : "Select an Excel file from email");
        setAnalyzing(false);
        return;
      }

      if (abortRef.current) return;
      const data = res.data?.data;
      if (!data) {
        setError("No data received");
        setAnalyzing(false);
        return;
      }

      setResult(data);

      // Progressive chat-style display: summary → insights one-by-one → recommendations one-by-one
      setStreamingItems({
        summary: data.summary || "",
        insights: [],
        recommendations: [],
        stage: "summary",
      });

      const insights = data.insights || [];
      const recommendations = data.recommendations || [];

      for (let i = 0; i < insights.length; i++) {
        if (abortRef.current) break;
        await new Promise((r) => setTimeout(r, STAGGER_MS));
        setStreamingItems((prev) =>
          prev ? { ...prev, insights: insights.slice(0, i + 1), stage: "insights" } : prev
        );
      }

      for (let i = 0; i < recommendations.length; i++) {
        if (abortRef.current) break;
        await new Promise((r) => setTimeout(r, STAGGER_MS));
        setStreamingItems((prev) =>
          prev ? { ...prev, recommendations: recommendations.slice(0, i + 1), stage: "recommendations" } : prev
        );
      }

      if (!abortRef.current) {
        setStreamingItems((prev) => (prev ? { ...prev, stage: "done" } : prev));
      }
    } catch (err: any) {
      if (!abortRef.current) setError(err?.response?.data?.error || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  }, [sourceTab, uploadFile, selectedAttachment]);

  // Auto-analyze when file is selected
  useEffect(() => {
    const canRun = (sourceTab === "email" && selectedAttachment) || (sourceTab === "upload" && uploadFile);
    if (canRun && !analyzing) runAnalysis();
  }, [selectedAttachment?._id, uploadFile?.name, sourceTab, runAnalysis]);

  const canAnalyze =
    (sourceTab === "email" && selectedAttachment) || (sourceTab === "upload" && uploadFile);

  const handleSourceTab = (t: SourceTab) => {
    setSourceTab(t);
    if (t === "email") setUploadFile(null);
    else setSelectedAttachment(null);
  };

  const handleSelectAttachment = (att: ExcelAttachment) => setSelectedAttachment(att);

  const handleFileChange = (f: File | null) => {
    setUploadFile(f);
    setError(null);
    if (f) {
      setUploadedFiles((prev) => {
        const exists = prev.find((file) => file.name === f.name && file.size === f.size);
        if (exists) return prev;
        return [f, ...prev];
      });
    }
  };

  const handleViewUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    window.open(url, "_blank");
  };

  const columnCoverage = useMemo(() => {
    if (!result || !result.columns?.length || !result.preview?.length) return [];
    const total = result.preview.length;
    return result.columns.map((col) => {
      let filled = 0;
      for (const row of result.preview) {
        const v = row[col];
        if (v !== null && v !== undefined && String(v).trim() !== "") filled += 1;
      }
      return {
        column: col,
        filled,
        total,
      };
    });
  }, [result]);

  const categoricalColumns = useMemo(() => {
    if (!result?.preview?.length || !result.columns?.length) return [];
    const rows = result.preview;

    return result.columns
      .map((col) => {
        const values = new Set<string>();
        let nonEmpty = 0;
        for (const row of rows) {
          const raw = row[col];
          if (raw === null || raw === undefined) continue;
          const s = String(raw).trim();
          if (!s) continue;
          nonEmpty += 1;
          values.add(s);
          if (values.size > 30) break;
        }
        return {
          name: col,
          nonEmpty,
          distinct: Array.from(values),
        };
      })
      .filter((c) => c.nonEmpty > 0 && c.distinct.length > 1 && c.distinct.length <= 30);
  }, [result]);

  const filteredRows = useMemo(() => {
    if (!result?.preview) return [];
    return result.preview.filter((row) => {
      for (const [col, value] of Object.entries(filters)) {
        if (value === "All") continue;
        const raw = (row as any)[col];
        const s = raw === null || raw === undefined ? "" : String(raw).trim();
        if (s !== value) return false;
      }
      return true;
    });
  }, [result, filters]);

  const uniqueFilterValues = useMemo(() => {
    const base = categoricalColumns;
    const first = base[0];
    const second = base[1];
    const third = base[2];

    const sortValues = (vals?: string[]) =>
      (vals || []).slice().sort((a, b) => a.localeCompare(b));

    return {
      first,
      second,
      third,
      firstValues: sortValues(first?.distinct),
      secondValues: sortValues(second?.distinct),
      thirdValues: sortValues(third?.distinct),
    };
  }, [categoricalColumns]);

  const buildCounts = (columnName: string) => {
    const map = new Map<string, number>();
    for (const row of filteredRows) {
      const raw = (row as any)[columnName];
      if (raw === null || raw === undefined) continue;
      const s = String(raw).trim();
      if (!s) continue;
      map.set(s, (map.get(s) || 0) + 1);
    }
    const arr = Array.from(map.entries()).map(([label, value]) => ({ label, value }));
    arr.sort((a, b) => b.value - a.value);
    return arr;
  };

  const industryCol = categoricalColumns[0];
  const countryCol = categoricalColumns[1];
  const riskCol = categoricalColumns[2];
  const strategyCol = categoricalColumns[3];
  const customerCol = categoricalColumns[4];

  const industryCounts = useMemo(
    () => (industryCol ? buildCounts(industryCol.name) : []),
    [filteredRows, industryCol?.name]
  );
  const countryCounts = useMemo(
    () => (countryCol ? buildCounts(countryCol.name) : []),
    [filteredRows, countryCol?.name]
  );
  const riskCounts = useMemo(
    () => (riskCol ? buildCounts(riskCol.name) : []),
    [filteredRows, riskCol?.name]
  );
  const strategyCounts = useMemo(
    () => (strategyCol ? buildCounts(strategyCol.name) : []),
    [filteredRows, strategyCol?.name]
  );
  const customerTypeCounts = useMemo(
    () => (customerCol ? buildCounts(customerCol.name) : []),
    [filteredRows, customerCol?.name]
  );

  const buildPie = (counts: { label: string; value: number }[]) => {
    if (!counts.length) return null;
    const total = counts.reduce((sum, c) => sum + c.value, 0);
    if (!total) return null;

    const colors = [
      "#22c55e",
      "#3b82f6",
      "#f97316",
      "#a855f7",
      "#ec4899",
      "#eab308",
      "#0ea5e9",
      "#10b981",
    ];

    let current = 0;
    const segments = counts.map((item, idx) => {
      const start = current;
      const percent = (item.value / total) * 100;
      const end = start + percent;
      current = end;
      return {
        label: item.label,
        value: item.value,
        percent,
        color: colors[idx % colors.length],
        start,
        end,
      };
    });

    const gradient = segments
      .map((seg) => `${seg.color} ${seg.start.toFixed(2)}% ${seg.end.toFixed(2)}%`)
      .join(", ");

    return {
      segments,
      gradient: `conic-gradient(${gradient})`,
      total,
    };
  };

  const industryPie = useMemo(() => buildPie(industryCounts), [industryCounts]);
  const riskPie = useMemo(() => buildPie(riskCounts), [riskCounts]);
  const customerPie = useMemo(() => buildPie(customerTypeCounts), [customerTypeCounts]);

  const heatmap = useMemo(() => {
    if (!filteredRows.length || categoricalColumns.length < 2) return null;
    const rowCol = categoricalColumns[0].name;
    const colCol = categoricalColumns[1].name;

    const rowSet = new Set<string>();
    const colSet = new Set<string>();

    filteredRows.forEach((row) => {
      const rRaw = (row as any)[rowCol];
      const cRaw = (row as any)[colCol];
      const r = rRaw === null || rRaw === undefined ? "" : String(rRaw).trim();
      const c = cRaw === null || cRaw === undefined ? "" : String(cRaw).trim();
      if (r) rowSet.add(r);
      if (c) colSet.add(c);
    });

    const industries = Array.from(rowSet).sort((a, b) => a.localeCompare(b));
    const risks = Array.from(colSet).sort((a, b) => a.localeCompare(b));

    const matrix: number[][] = industries.map(() => risks.map(() => 0));
    let max = 0;

    filteredRows.forEach((row) => {
      const rRaw = (row as any)[rowCol];
      const cRaw = (row as any)[colCol];
      const r = rRaw === null || rRaw === undefined ? "" : String(rRaw).trim();
      const c = cRaw === null || cRaw === undefined ? "" : String(cRaw).trim();
      if (!r || !c) return;
      const iIdx = industries.indexOf(r);
      const rIdx = risks.indexOf(c);
      if (iIdx === -1 || rIdx === -1) return;
      matrix[iIdx][rIdx] += 1;
      if (matrix[iIdx][rIdx] > max) max = matrix[iIdx][rIdx];
    });

    return { rowLabel: rowCol, colLabel: colCol, industries, risks, matrix, max };
  }, [filteredRows, categoricalColumns]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "20px", minHeight: "500px" }} className="email-grid">
      {/* Left: Source selection */}
      <div className="card" style={{ padding: "0", display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 180px)" }}>
        <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--border)", display: "flex", gap: "8px" }}>
          <button
            onClick={() => handleSourceTab("email")}
            style={{
              flex: 1, padding: "8px 12px", fontSize: "12px", border: "1px solid var(--border)",
              borderRadius: "3px", cursor: "pointer", background: sourceTab === "email" ? "var(--punch-bg)" : "transparent",
              color: sourceTab === "email" ? "var(--punch)" : "var(--text-2)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px"
            }}>
            <Mail size={14} /> From Email
          </button>
          <button
            onClick={() => handleSourceTab("upload")}
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
                      onClick={() => handleSelectAttachment(att)}
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
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "32px",
                border: "2px dashed var(--border)",
                borderRadius: "6px",
                cursor: "pointer",
                background: "var(--surface)",
                minHeight: "140px",
                borderColor: uploadFile ? "var(--punch)" : "var(--border)",
              }}
            >
              <input
                type="file"
                accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                style={{ display: "none" }}
              />
              <Upload
                size={36}
                style={{ color: uploadFile ? "var(--punch)" : "var(--text-3)", marginBottom: "12px" }}
              />
              <span style={{ fontSize: "13px", color: "var(--text-2)" }}>
                {uploadFile ? uploadFile.name : "Click to select Excel / CSV"}
              </span>
              <span style={{ fontSize: "11px", color: "var(--text-3)", marginTop: "4px" }}>
                .xlsx, .xls, .csv · auto-analyzes on select
              </span>
            </label>

            {uploadedFiles.length > 0 && (
              <div>
                <p
                  style={{
                    fontSize: "11px",
                    fontFamily: "'Space Mono',monospace",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--text-3)",
                    marginBottom: "6px",
                  }}
                >
                  Recent uploads
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {uploadedFiles.map((file, idx) => (
                    <div
                      key={file.name + idx}
                      onMouseEnter={() => setHoveredUploadIndex(idx)}
                      onMouseLeave={() => setHoveredUploadIndex((prev) => (prev === idx ? null : prev))}
                      style={{ position: "relative" }}
                    >
                      <button
                        onClick={() => handleFileChange(file)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px 10px",
                          borderRadius: "3px",
                          border: "1px solid var(--border)",
                          background:
                            uploadFile && uploadFile.name === file.name && uploadFile.size === file.size
                              ? "var(--punch-bg)"
                              : "var(--card)",
                          cursor: "pointer",
                          textAlign: "left",
                          width: "100%",
                        }}
                      >
                        <FileSpreadsheet size={14} style={{ color: "var(--punch)", flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p
                            style={{
                              fontSize: "12px",
                              fontWeight: 500,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {file.name}
                          </p>
                          <p style={{ fontSize: "10px", color: "var(--text-3)" }}>
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </button>
                      {hoveredUploadIndex === idx && (
                        <button
                          onClick={() => handleViewUpload(file)}
                          style={{
                            position: "absolute",
                            right: "8px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            fontSize: "10px",
                            padding: "2px 6px",
                            borderRadius: "999px",
                            border: "1px solid var(--border)",
                            background: "var(--card)",
                            color: "var(--text-3)",
                            cursor: "pointer",
                          }}
                        >
                          View
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {savedAnalyses.length > 0 && (
              <div style={{ marginTop: "8px" }}>
                <p
                  style={{
                    fontSize: "11px",
                    fontFamily: "'Space Mono',monospace",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--text-3)",
                    marginBottom: "6px",
                  }}
                >
                  Saved analyses
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {savedAnalyses.slice(0, 5).map((sa) => (
                    <button
                      key={sa._id}
                      onClick={() =>
                        setResult({
                          summary: sa.summary,
                          insights: sa.insights,
                          recommendations: sa.recommendations,
                          columns: sa.columns,
                          rowCount: sa.rowCount,
                          preview: sa.preview,
                        })
                      }
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "8px 10px",
                        borderRadius: "3px",
                        border: "1px solid var(--border)",
                        background: "var(--card)",
                        cursor: "pointer",
                        textAlign: "left",
                        width: "100%",
                      }}
                    >
                      <FileSpreadsheet size={14} style={{ color: "var(--text-3)", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: "12px",
                            fontWeight: 500,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {sa.filename}
                        </p>
                        <p style={{ fontSize: "10px", color: "var(--text-3)" }}>
                          {sa.sourceType === "email" ? "From email" : "Uploaded"} ·{" "}
                          {new Date(sa.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
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
            {analyzing ? "Analyzing…" : "Re-analyze"}
          </button>
        </div>
      </div>

      {/* Right: Chat-style results */}
      <div className="card" style={{ padding: "0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {!result && !error && !analyzing && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px", color: "var(--text-3)" }}>
            <FileSpreadsheet size={48} style={{ marginBottom: "16px", opacity: 0.5 }} />
            <p style={{ fontSize: "14px" }}>Select a file — insights appear automatically</p>
            <p style={{ fontSize: "12px", marginTop: "6px" }}>Summary, insights & recommendations stream in</p>
          </div>
        )}

        {analyzing && !streamingItems && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px" }}>
            <Loader2 size={32} className="anim-spin" style={{ color: "var(--punch)", marginBottom: "16px" }} />
            <p style={{ fontSize: "14px", color: "var(--text-2)" }}>Analyzing your data…</p>
          </div>
        )}

        {error && !analyzing && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px" }}>
            <p style={{ fontSize: "14px", color: "var(--red)" }}>{error}</p>
            <button onClick={() => setError(null)} className="btn-outline" style={{ marginTop: "12px", padding: "8px 16px" }}>
              Try again
            </button>
          </div>
        )}

        {(result || streamingItems) && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px", borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "3px", background: "var(--punch-bg)", border: "1px solid var(--punch-bdr)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <MessageSquare size={16} style={{ color: "var(--punch)" }} />
                </div>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>Excel Insights</p>
                  <p style={{ fontSize: "11px", color: "var(--text-3)" }}>
                    {result ? `${result.rowCount} rows · ${result.columns.length} columns` : "Loading…"}
                  </p>
                </div>
              </div>
              <button onClick={() => { setResult(null); setStreamingItems(null); setError(null); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)" }}>
                <X size={18} />
              </button>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
              }}
            >
              {result && (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        padding: "12px 14px",
                        borderRadius: "6px",
                        border: "1px solid var(--border)",
                        background: "var(--surface)",
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "'Space Mono',monospace",
                          fontSize: "10px",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          color: "var(--text-3)",
                          marginBottom: "6px",
                        }}
                      >
                        Rows
                      </p>
                      <p style={{ fontSize: "20px", fontWeight: 600 }}>{result.rowCount}</p>
                    </div>
                    <div
                      style={{
                        padding: "12px 14px",
                        borderRadius: "6px",
                        border: "1px solid var(--border)",
                        background: "var(--surface)",
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "'Space Mono',monospace",
                          fontSize: "10px",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          color: "var(--text-3)",
                          marginBottom: "6px",
                        }}
                      >
                        Columns
                      </p>
                      <p style={{ fontSize: "20px", fontWeight: 600 }}>{result.columns.length}</p>
                    </div>
                    <div
                      style={{
                        padding: "12px 14px",
                        borderRadius: "6px",
                        border: "1px solid var(--border)",
                        background: "var(--surface)",
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "'Space Mono',monospace",
                          fontSize: "10px",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          color: "var(--text-3)",
                          marginBottom: "6px",
                        }}
                      >
                        Previewed rows
                      </p>
                      <p style={{ fontSize: "20px", fontWeight: 600 }}>
                        {Math.min(result.preview?.length || 0, 200)}
                      </p>
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: "6px",
                      border: "1px solid var(--border)",
                      background: "var(--surface)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Space Mono',monospace",
                        fontSize: "10px",
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        color: "var(--text-3)",
                      }}
                    >
                      Filters
                    </span>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        flexWrap: "wrap",
                        justifyContent: "flex-end",
                      }}
                    >
                      {uniqueFilterValues.first && (
                        <select
                          value={filters[uniqueFilterValues.first.name] || "All"}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              [uniqueFilterValues.first!.name]: e.target.value,
                            }))
                          }
                          style={{
                            fontSize: "11px",
                            padding: "4px 8px",
                            borderRadius: "999px",
                            border: "1px solid var(--border)",
                            background: "var(--card)",
                            color: "var(--text)",
                            minWidth: "120px",
                          }}
                        >
                          <option value="All">All {uniqueFilterValues.first.name}</option>
                          {uniqueFilterValues.firstValues.map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </select>
                      )}
                      {uniqueFilterValues.second && (
                        <select
                          value={filters[uniqueFilterValues.second.name] || "All"}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              [uniqueFilterValues.second!.name]: e.target.value,
                            }))
                          }
                          style={{
                            fontSize: "11px",
                            padding: "4px 8px",
                            borderRadius: "999px",
                            border: "1px solid var(--border)",
                            background: "var(--card)",
                            color: "var(--text)",
                            minWidth: "120px",
                          }}
                        >
                          <option value="All">All {uniqueFilterValues.second.name}</option>
                          {uniqueFilterValues.secondValues.map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </select>
                      )}
                      {uniqueFilterValues.third && (
                        <select
                          value={filters[uniqueFilterValues.third.name] || "All"}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              [uniqueFilterValues.third!.name]: e.target.value,
                            }))
                          }
                          style={{
                            fontSize: "11px",
                            padding: "4px 8px",
                            borderRadius: "999px",
                            border: "1px solid var(--border)",
                            background: "var(--card)",
                            color: "var(--text)",
                            minWidth: "120px",
                          }}
                        >
                          <option value="All">All {uniqueFilterValues.third.name}</option>
                          {uniqueFilterValues.thirdValues.map((v) => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                      gap: "14px",
                    }}
                  >
                    {/* Industry Pie Chart */}
                    <div
                      style={{
                        padding: "14px 16px",
                        borderRadius: "6px",
                        border: "1px solid var(--border)",
                        background: "var(--surface)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "var(--text)",
                          }}
                        >
                          {industryCol ? `${industryCol.name} pie chart` : "Pie chart"}
                        </span>
                      </div>
                      {industryPie ? (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(0, 120px) minmax(0, 1fr)",
                            gap: "10px",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              width: "110px",
                              height: "110px",
                              borderRadius: "999px",
                              backgroundImage: industryPie.gradient,
                              position: "relative",
                              margin: "0 auto",
                            }}
                          >
                            <div
                              style={{
                                position: "absolute",
                                inset: "18px",
                                borderRadius: "999px",
                                background: "var(--surface)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexDirection: "column",
                                gap: "2px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "10px",
                                  color: "var(--text-3)",
                                }}
                              >
                                Total
                              </span>
                              <span
                                style={{
                                  fontSize: "16px",
                                  fontWeight: 600,
                                }}
                              >
                                {industryPie.total}
                              </span>
                            </div>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                              maxHeight: "110px",
                              overflowY: "auto",
                            }}
                          >
                            {industryPie.segments.map((seg) => (
                              <div
                                key={seg.label}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  fontSize: "11px",
                                  color: "var(--text-3)",
                                  gap: "8px",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                                  <div
                                    style={{
                                      width: "8px",
                                      height: "8px",
                                      borderRadius: "999px",
                                      background: seg.color,
                                      flexShrink: 0,
                                    }}
                                  />
                                  <span
                                    style={{
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                    title={seg.label}
                                  >
                                    {seg.label}
                                  </span>
                                </div>
                                <span>
                                  {seg.value} · {seg.percent.toFixed(0)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: "11px", color: "var(--text-3)" }}>
                          Not enough Industry data to chart.
                        </span>
                      )}
                    </div>

                    {/* Country Bar Chart */}
                    <div
                      style={{
                        padding: "14px 16px",
                        borderRadius: "6px",
                        border: "1px solid var(--border)",
                        background: "var(--surface)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "var(--text)",
                          }}
                        >
                          {countryCol ? `${countryCol.name} bar chart` : "Bar chart"}
                        </span>
                      </div>
                      {countryCounts.length === 0 ? (
                        <span style={{ fontSize: "11px", color: "var(--text-3)" }}>
                          Not enough Country data to chart.
                        </span>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "6px",
                            maxHeight: "150px",
                            overflowY: "auto",
                          }}
                        >
                          {countryCounts.map((item, idx) => {
                            const max = countryCounts[0]?.value || 1;
                            const width = `${(item.value / max) * 100}%`;
                            return (
                              <div key={item.label + idx} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    fontSize: "11px",
                                    color: "var(--text-3)",
                                  }}
                                >
                                  <span
                                    style={{
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      maxWidth: "70%",
                                    }}
                                    title={item.label}
                                  >
                                    {item.label}
                                  </span>
                                  <span>{item.value}</span>
                                </div>
                                <div
                                  style={{
                                    width: "100%",
                                    height: "7px",
                                    borderRadius: "999px",
                                    background: "var(--border)",
                                    overflow: "hidden",
                                  }}
                                >
                                  <div
                                    style={{
                                      width,
                                      height: "100%",
                                      borderRadius: "999px",
                                      background:
                                        "linear-gradient(90deg, rgba(59,130,246,0.9) 0%, rgba(56,189,248,0.95) 100%)",
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Risk Donut Chart */}
                    <div
                      style={{
                        padding: "14px 16px",
                        borderRadius: "6px",
                        border: "1px solid var(--border)",
                        background: "var(--surface)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "var(--text)",
                          }}
                        >
                          {riskCol ? `${riskCol.name} donut chart` : "Donut chart"}
                        </span>
                      </div>
                      {riskPie ? (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(0, 120px) minmax(0, 1fr)",
                            gap: "10px",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              width: "110px",
                              height: "110px",
                              borderRadius: "999px",
                              backgroundImage: riskPie.gradient,
                              position: "relative",
                              margin: "0 auto",
                            }}
                          >
                            <div
                              style={{
                                position: "absolute",
                                inset: "18px",
                                borderRadius: "999px",
                                background: "var(--surface)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexDirection: "column",
                                gap: "2px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "10px",
                                  color: "var(--text-3)",
                                }}
                              >
                                Total
                              </span>
                              <span
                                style={{
                                  fontSize: "16px",
                                  fontWeight: 600,
                                }}
                              >
                                {riskPie.total}
                              </span>
                            </div>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                              maxHeight: "110px",
                              overflowY: "auto",
                            }}
                          >
                            {riskPie.segments.map((seg) => (
                              <div
                                key={seg.label}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  fontSize: "11px",
                                  color: "var(--text-3)",
                                  gap: "8px",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                                  <div
                                    style={{
                                      width: "8px",
                                      height: "8px",
                                      borderRadius: "999px",
                                      background: seg.color,
                                      flexShrink: 0,
                                    }}
                                  />
                                  <span
                                    style={{
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                    title={seg.label}
                                  >
                                    {seg.label}
                                  </span>
                                </div>
                                <span>
                                  {seg.value} · {seg.percent.toFixed(0)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: "11px", color: "var(--text-3)" }}>
                          Not enough Risk Level data to chart.
                        </span>
                      )}
                    </div>

                    {/* Strategy Column Chart */}
                    <div
                      style={{
                        padding: "14px 16px",
                        borderRadius: "6px",
                        border: "1px solid var(--border)",
                        background: "var(--surface)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "var(--text)",
                          }}
                        >
                          {strategyCol ? `${strategyCol.name} column chart` : "Column chart"}
                        </span>
                      </div>
                      {strategyCounts.length === 0 ? (
                        <span style={{ fontSize: "11px", color: "var(--text-3)" }}>
                          Not enough Strategy data to chart.
                        </span>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "flex-end",
                            gap: "6px",
                            height: "150px",
                            paddingTop: "6px",
                          }}
                        >
                          {strategyCounts.slice(0, 10).map((item, idx) => {
                            const max = strategyCounts[0]?.value || 1;
                            const height = `${(item.value / max) * 100}%`;
                            return (
                              <div
                                key={item.label + idx}
                                style={{
                                  flex: 1,
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <div
                                  style={{
                                    width: "100%",
                                    flexGrow: 1,
                                    display: "flex",
                                    alignItems: "flex-end",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: "100%",
                                      height,
                                      borderRadius: "4px 4px 0 0",
                                      background:
                                        "linear-gradient(180deg, rgba(249,115,22,0.95) 0%, rgba(234,179,8,0.95) 100%)",
                                    }}
                                  />
                                </div>
                                <span style={{ fontSize: "10px", color: "var(--text-3)" }}>{item.value}</span>
                                <span
                                  style={{
                                    fontSize: "9px",
                                    color: "var(--text-3)",
                                    maxWidth: "100%",
                                    textAlign: "center",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                  title={item.label}
                                >
                                  {item.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Customer Type Pie Chart */}
                    <div
                      style={{
                        padding: "14px 16px",
                        borderRadius: "6px",
                        border: "1px solid var(--border)",
                        background: "var(--surface)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "var(--text)",
                          }}
                        >
                          {customerCol ? `${customerCol.name} pie chart` : "Pie chart"}
                        </span>
                      </div>
                      {customerPie ? (
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(0, 120px) minmax(0, 1fr)",
                            gap: "10px",
                            alignItems: "center",
                          }}
                        >
                          <div
                            style={{
                              width: "110px",
                              height: "110px",
                              borderRadius: "999px",
                              backgroundImage: customerPie.gradient,
                              position: "relative",
                              margin: "0 auto",
                            }}
                          >
                            <div
                              style={{
                                position: "absolute",
                                inset: "18px",
                                borderRadius: "999px",
                                background: "var(--surface)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexDirection: "column",
                                gap: "2px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "10px",
                                  color: "var(--text-3)",
                                }}
                              >
                                Total
                              </span>
                              <span
                                style={{
                                  fontSize: "16px",
                                  fontWeight: 600,
                                }}
                              >
                                {customerPie.total}
                              </span>
                            </div>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                              maxHeight: "110px",
                              overflowY: "auto",
                            }}
                          >
                            {customerPie.segments.map((seg) => (
                              <div
                                key={seg.label}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  fontSize: "11px",
                                  color: "var(--text-3)",
                                  gap: "8px",
                                }}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                                  <div
                                    style={{
                                      width: "8px",
                                      height: "8px",
                                      borderRadius: "999px",
                                      background: seg.color,
                                      flexShrink: 0,
                                    }}
                                  />
                                  <span
                                    style={{
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                    }}
                                    title={seg.label}
                                  >
                                    {seg.label}
                                  </span>
                                </div>
                                <span>
                                  {seg.value} · {seg.percent.toFixed(0)}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: "11px", color: "var(--text-3)" }}>
                          Not enough Customer Type data to chart.
                        </span>
                      )}
                    </div>
                  </div>

                  {heatmap && (
                    <div
                      style={{
                        padding: "14px 16px",
                        borderRadius: "6px",
                        border: "1px solid var(--border)",
                        background: "var(--surface)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: "var(--text)",
                          }}
                        >
                          Industry × Risk heat map
                        </span>
                        <span style={{ fontSize: "10px", color: "var(--text-3)" }}>Cell color = count</span>
                      </div>
                      <div style={{ overflowX: "auto" }}>
                        <table
                          style={{
                            borderCollapse: "collapse",
                            width: "100%",
                            fontSize: "11px",
                          }}
                        >
                          <thead>
                            <tr>
                              <th
                                style={{
                                  padding: "6px 8px",
                                  textAlign: "left",
                                  color: "var(--text-3)",
                                  fontWeight: 500,
                                }}
                              >
                                Industry \ Risk
                              </th>
                              {heatmap.risks.map((risk) => (
                                <th
                                  key={risk}
                                  style={{
                                    padding: "6px 8px",
                                    textAlign: "center",
                                    color: "var(--text-3)",
                                    fontWeight: 500,
                                  }}
                                >
                                  {risk}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {heatmap.industries.map((industry, iIdx) => (
                              <tr key={industry}>
                                <td
                                  style={{
                                    padding: "6px 8px",
                                    color: "var(--text-2)",
                                    borderTop: "1px solid var(--border)",
                                  }}
                                >
                                  {industry}
                                </td>
                                {heatmap.risks.map((risk, rIdx) => {
                                  const value = heatmap.matrix[iIdx][rIdx];
                                  const ratio = heatmap.max ? value / heatmap.max : 0;
                                  const bg = `rgba(34,197,94,${0.12 + ratio * 0.55})`;
                                  return (
                                    <td
                                      key={risk}
                                      style={{
                                        padding: "6px 8px",
                                        textAlign: "center",
                                        borderTop: "1px solid var(--border)",
                                        background: value ? bg : "transparent",
                                        color: value ? "var(--text)" : "var(--text-3)",
                                      }}
                                    >
                                      {value || "-"}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
