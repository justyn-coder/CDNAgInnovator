import { useState } from "react";
import { cn } from "../lib/cn";

export type DatePreset = "all" | "this_week" | "this_month" | "next_3_months" | "this_year" | "custom";

export interface DateRange {
  from: string | undefined;
  to: string | undefined;
}

const PRESET_LABELS: Record<DatePreset, string> = {
  all: "All Dates",
  this_week: "This week",
  this_month: "This month",
  next_3_months: "Next 3 months",
  this_year: "This year",
  custom: "Custom range",
};

function computeRange(preset: DatePreset): DateRange {
  if (preset === "all") return { from: undefined, to: undefined };

  const now = new Date();
  const from = now.toISOString().split("T")[0];

  if (preset === "this_week") {
    const end = new Date(now);
    end.setDate(end.getDate() + (7 - end.getDay()));
    return { from, to: end.toISOString().split("T")[0] };
  }
  if (preset === "this_month") {
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from, to: end.toISOString().split("T")[0] };
  }
  if (preset === "next_3_months") {
    const end = new Date(now);
    end.setMonth(end.getMonth() + 3);
    return { from, to: end.toISOString().split("T")[0] };
  }
  if (preset === "this_year") {
    return { from, to: `${now.getFullYear()}-12-31` };
  }
  return { from: undefined, to: undefined };
}

export default function DateFilter({
  onChange,
}: {
  onChange: (range: DateRange, preset: DatePreset) => void;
}) {
  const [preset, setPreset] = useState<DatePreset>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  function handlePreset(value: DatePreset) {
    setPreset(value);
    if (value === "custom") {
      onChange({ from: customFrom || undefined, to: customTo || undefined }, value);
    } else {
      onChange(computeRange(value), value);
    }
  }

  function handleCustomChange(from: string, to: string) {
    setCustomFrom(from);
    setCustomTo(to);
    onChange({ from: from || undefined, to: to || undefined }, "custom");
  }

  return (
    <div className="flex gap-2 items-center flex-wrap">
      <select
        value={preset}
        onChange={e => handlePreset(e.target.value as DatePreset)}
        className="px-3 py-2 rounded-sm border-[1.5px] border-border text-[0.78rem] bg-bg text-text font-sans"
      >
        {(Object.keys(PRESET_LABELS) as DatePreset[]).map(key => (
          <option key={key} value={key}>{PRESET_LABELS[key]}</option>
        ))}
      </select>
      {preset === "custom" && (
        <>
          <input
            type="date"
            value={customFrom}
            onChange={e => handleCustomChange(e.target.value, customTo)}
            className="px-2 py-1.5 rounded-sm border-[1.5px] border-border text-[0.72rem] bg-bg text-text font-sans"
          />
          <span className="text-[0.72rem] text-text-tertiary">to</span>
          <input
            type="date"
            value={customTo}
            onChange={e => handleCustomChange(customFrom, e.target.value)}
            className="px-2 py-1.5 rounded-sm border-[1.5px] border-border text-[0.72rem] bg-bg text-text font-sans"
          />
        </>
      )}
    </div>
  );
}

// Badge helpers for ProgramCard
export function getDateBadge(p: {
  eventStartDate?: string | null;
  eventEndDate?: string | null;
  applicationDeadline?: string | null;
}): { text: string; style: "soon" | "deadline" | "event" } | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // "Happening soon" / "In X days" badge
  if (p.eventStartDate) {
    const start = new Date(p.eventStartDate + "T00:00:00");
    const end = p.eventEndDate ? new Date(p.eventEndDate + "T00:00:00") : start;
    const daysUntil = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil >= 0 && daysUntil <= 30 && end >= today) {
      if (daysUntil === 0) return { text: "Happening today", style: "soon" };
      if (daysUntil <= 14) return { text: `In ${daysUntil} day${daysUntil === 1 ? "" : "s"}`, style: "soon" };
      return { text: "Happening soon", style: "soon" };
    }
  }

  // "Deadline in X days" badge
  if (p.applicationDeadline) {
    const deadline = new Date(p.applicationDeadline + "T00:00:00");
    const daysUntil = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil >= 0 && daysUntil <= 14) {
      if (daysUntil === 0) return { text: "Deadline today", style: "deadline" };
      return { text: `Deadline in ${daysUntil} day${daysUntil === 1 ? "" : "s"}`, style: "deadline" };
    }
  }

  return null;
}

export function DateBadge({ badge }: { badge: { text: string; style: "soon" | "deadline" | "event" } }) {
  return (
    <span className={cn(
      "text-[0.6rem] font-bold px-2 py-[2px] rounded-full border",
      badge.style === "soon" && "bg-[#fef3c7] text-[#92400e] border-[#fde68a]",
      badge.style === "deadline" && "bg-[#fee2e2] text-[#991b1b] border-[#fecaca]",
      badge.style === "event" && "bg-[#dbeafe] text-[#1e40af] border-[#bfdbfe]",
    )}>
      {badge.text}
    </span>
  );
}
