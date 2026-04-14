import { useEffect, useRef, useState } from "react";

interface PathwayStep {
  order: number;
  program_id?: number | null;
  program_name: string;
  program_website?: string;
  category: string;
  action: string;
  why: string;
  fit_confidence?: "high" | "medium" | "exploratory";
  prepare?: string;
  timing: "now" | "next_month" | "next_quarter" | "horizon";
  horizon?: boolean;
  ecosystem_insight?: string | null;
  insight_source?: string | null;
}

interface PathwayMeta {
  stage: string;
  nextStage: string;
  provinces: string[];
  need: string;
  programsConsidered: number;
  gapInfo: Record<string, number>;
  deterministicGaps?: string[];
}

interface PathwayData {
  pathway_title: string;
  summary: string;
  steps: PathwayStep[];
  gap_warning: string | null;
  next_stage_note: string | null;
}

export interface StreamedPathwayResult {
  steps: PathwayStep[];
  meta: PathwayMeta | null;
  fullData: { pathway: PathwayData; meta: PathwayMeta } | null;
  isStreaming: boolean;
  isComplete: boolean;
  error: string | null;
}

interface ProfileInput {
  description: string;
  stage: string;
  provinces: string[];
  need: string;
  sector?: string;
}

export function useStreamedPathway(
  profile: ProfileInput | null,
  enabled: boolean = true,
): StreamedPathwayResult {
  const [steps, setSteps] = useState<PathwayStep[]>([]);
  const [meta, setMeta] = useState<PathwayMeta | null>(null);
  const [fullData, setFullData] = useState<{ pathway: PathwayData; meta: PathwayMeta } | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!profile || !enabled) return;

    // Reset state
    setSteps([]);
    setMeta(null);
    setFullData(null);
    setIsStreaming(true);
    setIsComplete(false);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        const res = await fetch("/api/pathway?stream=true", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(profile),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          setError("Failed to connect to pathway API");
          setIsStreaming(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          let currentEvent = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              currentEvent = line.slice(7).trim();
            } else if (line.startsWith("data: ") && currentEvent) {
              const data = line.slice(6);
              try {
                const parsed = JSON.parse(data);

                if (currentEvent === "meta") {
                  setMeta(parsed);
                } else if (currentEvent === "step") {
                  setSteps(prev => [...prev, parsed]);
                } else if (currentEvent === "complete") {
                  setFullData(parsed);
                  setIsComplete(true);
                  setIsStreaming(false);
                } else if (currentEvent === "error") {
                  setError(parsed.error || "Stream error");
                  setIsStreaming(false);
                }
              } catch {}
              currentEvent = "";
            } else if (line === "") {
              currentEvent = "";
            }
          }
        }

        // Stream ended without a complete event
        if (!isComplete) {
          setIsStreaming(false);
          if (steps.length === 0) {
            setError("Pathway generation failed. Please try again.");
          }
        }
      } catch (e: any) {
        if (e.name !== "AbortError") {
          setError("Connection lost. Please try again.");
          setIsStreaming(false);
        }
      }
    })();

    return () => {
      controller.abort();
      abortRef.current = null;
    };
  }, [
    profile?.description,
    profile?.stage,
    profile?.provinces?.join(","),
    profile?.need,
    profile?.sector,
    enabled,
  ]);

  return { steps, meta, fullData, isStreaming, isComplete, error };
}
