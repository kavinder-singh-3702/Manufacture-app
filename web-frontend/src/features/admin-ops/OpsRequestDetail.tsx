"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  adminService,
  type AdminBusinessSetupRequest,
  type AdminServiceRequest,
  type AdminUser,
} from "@/src/services/admin";
import { ApiError } from "@/src/lib/api-error";
import { useToast } from "@/src/components/ui/Toast";
import { tintBg } from "@/src/lib/color";
import {
  PRIORITIES,
  allowedTransitionsFor,
  formatDate,
  humanizeKey,
  priorityBg,
  priorityTone,
  relativeAge,
  slaState,
  statusBg,
  statusTone,
  stringifyValue,
  toStatusLabel,
} from "./opsMeta";
import { OpsWorkflowModal, type OpsWorkflowChange, type OpsWorkflowTarget } from "./OpsWorkflowModal";

type RequestKind = "service" | "business_setup";
type Detail = AdminServiceRequest | AdminBusinessSetupRequest;

type Row = { label: string; value: string };
type Section = { title: string; rows: Row[] };

const isService = (kind: RequestKind, d: Detail): d is AdminServiceRequest => kind === "service";

const buildSections = (kind: RequestKind, d: Detail): Section[] => {
  const sections: Section[] = [];
  const filled = (rows: (Row | null)[]) => rows.filter((r): r is Row => Boolean(r));

  if (isService(kind, d)) {
    const description = d.description?.trim();
    const userNotes = d.notes?.trim();
    if (description || userNotes) {
      sections.push({
        title: "Request",
        rows: filled([
          description ? { label: "Description", value: description } : null,
          userNotes ? { label: "Notes", value: userNotes } : null,
        ]),
      });
    }

    if (d.contact) {
      const c = d.contact;
      sections.push({
        title: "Contact",
        rows: filled([
          c.name ? { label: "Name", value: String(c.name) } : null,
          c.phone ? { label: "Phone", value: String(c.phone) } : null,
          c.email ? { label: "Email", value: String(c.email) } : null,
          c.preferredChannel ? { label: "Preferred via", value: String(c.preferredChannel) } : null,
        ]),
      });
    }

    if (d.location) {
      const l = d.location;
      const addr = [l.line1, l.line2, l.city, l.state, l.postalCode].filter(Boolean).join(", ");
      sections.push({
        title: "Location",
        rows: filled([
          addr ? { label: "Address", value: addr } : null,
          l.country ? { label: "Country", value: String(l.country) } : null,
        ]),
      });
    }

    if (d.schedule) {
      const s = d.schedule;
      sections.push({
        title: "Schedule",
        rows: filled([
          s.startDate ? { label: "Start", value: formatDate(String(s.startDate)) } : null,
          s.endDate ? { label: "End", value: formatDate(String(s.endDate)) } : null,
          s.notes ? { label: "Notes", value: String(s.notes) } : null,
        ]),
      });
    }

    if (d.budget) {
      const b = d.budget;
      const cost = typeof b.estimatedCost === "number" ? `${b.currency || "INR"} ${b.estimatedCost.toLocaleString("en-IN")}` : null;
      sections.push({
        title: "Budget",
        rows: filled([
          cost ? { label: "Estimated", value: cost } : null,
          b.notes ? { label: "Notes", value: String(b.notes) } : null,
        ]),
      });
    }

    const typeDetails = d.machineRepairDetails || d.workerDetails || d.transportDetails || d.advertisementDetails;
    if (typeDetails) {
      const rows = Object.entries(typeDetails)
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => ({ label: humanizeKey(k), value: stringifyValue(v) }));
      if (rows.length) sections.push({ title: `${humanizeKey(d.serviceType)} details`, rows });
    }
  } else {
    sections.push({
      title: "Business",
      rows: filled([
        d.businessType ? { label: "Type", value: d.businessType } : null,
        d.workModel ? { label: "Work model", value: d.workModel } : null,
        d.location ? { label: "Location", value: d.location } : null,
        d.budgetRange ? { label: "Budget range", value: d.budgetRange } : null,
        d.startTimeline ? { label: "Start timeline", value: d.startTimeline } : null,
        d.supportAreas?.length ? { label: "Support areas", value: d.supportAreas.join(", ") } : null,
        d.founderExperience ? { label: "Founder experience", value: d.founderExperience } : null,
        typeof d.teamSize === "number" ? { label: "Team size", value: String(d.teamSize) } : null,
      ]),
    });
    sections.push({
      title: "Contact",
      rows: filled([
        d.contactName ? { label: "Name", value: d.contactName } : null,
        d.contactPhone ? { label: "Phone", value: d.contactPhone } : null,
        d.contactEmail ? { label: "Email", value: d.contactEmail } : null,
        d.preferredContactChannel ? { label: "Preferred via", value: d.preferredContactChannel } : null,
      ]),
    });
    if (d.notes?.trim()) sections.push({ title: "Notes", rows: [{ label: "From requester", value: d.notes.trim() }] });
    if (d.referenceCode) sections.push({ title: "Reference", rows: [{ label: "Code", value: d.referenceCode }] });
  }

  return sections.filter((s) => s.rows.length > 0);
};

const describeTimelineEntry = (entry: { type: string; entry: Record<string, unknown> }): { title: string; detail?: string } => {
  const e = entry.entry || {};
  if (entry.type === "status") {
    const from = e.from as string | undefined;
    const to = (e.to as string | undefined) ?? (e.status as string | undefined);
    const reason = e.reason as string | undefined;
    if (from && to) return { title: "Status changed", detail: `${toStatusLabel(from)} → ${toStatusLabel(to)}${reason ? ` • ${reason}` : ""}` };
    return { title: "Status updated", detail: reason };
  }
  if (entry.type === "assignment") {
    const assignedTo = e.assignedTo as { displayName?: string; email?: string } | null | undefined;
    const reason = e.reason as string | undefined;
    const to = assignedTo?.displayName || assignedTo?.email || (assignedTo ? "Someone" : "Unassigned");
    return { title: "Assignment changed", detail: `Now: ${to}${reason ? ` • ${reason}` : ""}` };
  }
  if (entry.type === "note") {
    return { title: "Note added", detail: (e.message as string | undefined) || (e.note as string | undefined) };
  }
  return { title: entry.type || "Event" };
};

export const OpsRequestDetail = ({
  id, kind, onClose, onChanged,
}: {
  id: string;
  kind: RequestKind;
  /** Present when rendered inside the desktop Sheet — renders a close (✕) button in the header. */
  onClose?: () => void;
  /** Fired after any successful workflow mutation, so the caller can refresh its list/counts. */
  onChanged?: () => void;
}) => {
  const toast = useToast();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [pendingChange, setPendingChange] = useState<OpsWorkflowChange | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignSearch, setAssignSearch] = useState("");
  const [assignResults, setAssignResults] = useState<AdminUser[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [slaDraft, setSlaDraft] = useState("");
  const [slaEditing, setSlaEditing] = useState(false);
  const initializedSections = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = kind === "service"
        ? await adminService.getServiceRequestById(id)
        : await adminService.getBusinessSetupRequestById(id);
      setDetail(result);
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to load request");
    } finally {
      setLoading(false);
    }
  }, [id, kind]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!detail || initializedSections.current) return;
    initializedSections.current = true;
    const sections = buildSections(kind, detail);
    if (sections[0]) setExpanded(new Set([sections[0].title]));
  }, [detail, kind]);

  useEffect(() => {
    if (!assignOpen) return;
    let cancelled = false;
    setAssignLoading(true);
    adminService.listUsers({ role: "admin", search: assignSearch || undefined, limit: 8 })
      .then((res) => { if (!cancelled) setAssignResults(res.users ?? []); })
      .finally(() => { if (!cancelled) setAssignLoading(false); });
    return () => { cancelled = true; };
  }, [assignOpen, assignSearch]);

  const toggleSection = (title: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title); else next.add(title);
      return next;
    });
  };

  const handleChanged = () => {
    setPendingChange(null);
    setAssignOpen(false);
    setSlaEditing(false);
    load();
    onChanged?.();
  };

  const copyId = () => {
    navigator.clipboard?.writeText(id).then(() => toast.info("Copied", "Request ID copied to clipboard"));
  };

  if (loading) {
    return (
      <div className="space-y-3 p-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl" style={{ backgroundColor: "var(--border)" }} />
        ))}
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center">
        <span className="text-3xl">⚠️</span>
        <p className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{error || "Request not found"}</p>
        <button onClick={load} className="rounded-lg px-3 py-1.5 text-xs font-bold underline" style={{ color: "var(--primary)" }}>Retry</button>
      </div>
    );
  }

  const sections = buildSections(kind, detail);
  const timeline = detail.timeline ?? [];
  const transitions = detail.allowedTransitions?.length
    ? detail.allowedTransitions.map((t) => ({ status: t.status, label: toStatusLabel(t.status), isPrimary: t.isPrimary }))
    : allowedTransitionsFor(kind, detail.status);
  const primary = transitions.find((t) => t.isPrimary) ?? transitions[0];
  const secondaryTransitions = transitions.filter((t) => t !== primary);
  const sla = slaState(detail.slaDueAt, transitions.length === 0);
  const assigneeLabel = detail.assignedTo?.displayName || detail.assignedTo?.email;
  const ownerLabel = detail.createdBy?.displayName || detail.createdBy?.email;
  const target: OpsWorkflowTarget = { id: detail.id, company: detail.company, updatedAt: detail.updatedAt };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="p-5 pb-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg text-base"
              style={{ backgroundColor: "var(--primary-light)" }}>
              {kind === "service" ? "🛠️" : "🚀"}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "var(--medium-gray)" }}>
              {kind === "service" ? "Service request" : "Startup request"}
            </span>
          </div>
          {onClose && (
            <button type="button" onClick={onClose} aria-label="Close"
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-opacity hover:opacity-70"
              style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--medium-gray)" }}>
              ✕
            </button>
          )}
        </div>

        <h2 className="mt-2 text-lg font-bold leading-snug" style={{ color: "var(--foreground)" }}>
          {detail.title || "Untitled request"}
        </h2>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold capitalize"
            style={{ backgroundColor: statusBg(detail.status), color: statusTone(detail.status) }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: statusTone(detail.status) }} />
            {toStatusLabel(detail.status)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold capitalize"
            style={{ backgroundColor: priorityBg(detail.priority), color: priorityTone(detail.priority) }}>
            ⚑ {detail.priority} priority
          </span>
          {sla !== "none" && (
            <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
              style={{ backgroundColor: sla === "breached" ? tintBg("var(--danger-strong)") : tintBg("var(--success)"), color: sla === "breached" ? "var(--danger-strong)" : "var(--success)" }}>
              {sla === "breached" ? "SLA breached" : `Due ${formatDate(detail.slaDueAt)}`}
            </span>
          )}
        </div>

        <div className="mt-3 space-y-1 text-sm" style={{ color: "var(--foreground)" }}>
          {detail.company?.displayName && (
            <p>🏢 <span style={{ color: "var(--medium-gray)" }}>Company</span> {detail.company.displayName}</p>
          )}
          {ownerLabel && <p>👤 <span style={{ color: "var(--medium-gray)" }}>Created by</span> {ownerLabel}</p>}
          <p>🎯 <span style={{ color: "var(--medium-gray)" }}>Assigned to</span> {assigneeLabel || "Unassigned"}</p>
          <p className="flex items-center gap-1.5 text-xs" style={{ color: "var(--medium-gray)" }}>
            {relativeAge(detail.updatedAt)} · updated
            <button type="button" onClick={copyId} className="underline decoration-dotted underline-offset-2 hover:opacity-70">
              Copy ID
            </button>
          </p>
        </div>
      </div>

      {/* Content sections */}
      <div className="mt-4 space-y-2 px-5">
        {sections.map((section) => {
          const isOpen = expanded.has(section.title);
          return (
            <div key={section.title} className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--border)", backgroundColor: "var(--card)" }}>
              <button type="button" onClick={() => toggleSection(section.title)}
                className="flex w-full items-center justify-between px-4 py-3 text-left">
                <span className="text-xs font-bold uppercase tracking-[0.15em]" style={{ color: "var(--medium-gray)" }}>{section.title}</span>
                <span className="text-xs" style={{ color: "var(--medium-gray)" }}>{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && (
                <div className="space-y-2.5 border-t px-4 py-3" style={{ borderColor: "var(--border)" }}>
                  {section.rows.map((row, i) => (
                    <div key={`${row.label}-${i}`}>
                      <p className="text-[11px] font-semibold" style={{ color: "var(--medium-gray)" }}>{row.label}</p>
                      <p className="text-sm" style={{ color: "var(--foreground)" }}>{row.value}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Secondary actions: priority / assign / SLA */}
      <div className="mt-4 space-y-3 px-5">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: "var(--medium-gray)" }}>Priority</p>
          <div className="flex flex-wrap gap-1.5">
            {PRIORITIES.map((p) => (
              <button key={p} type="button" disabled={p === detail.priority}
                onClick={() => setPendingChange({ title: "Change priority", subtitle: `${toStatusLabel(detail.status)} · set priority to "${p}"`, payload: { priority: p } })}
                className="rounded-full px-3 py-1.5 text-xs font-bold capitalize transition-all disabled:opacity-100"
                style={{
                  backgroundColor: p === detail.priority ? priorityBg(p) : "var(--surface)",
                  color: p === detail.priority ? priorityTone(p) : "var(--foreground)",
                  border: p === detail.priority ? `1px solid ${priorityTone(p)}` : "1px solid var(--border)",
                  cursor: p === detail.priority ? "default" : "pointer",
                }}>
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: "var(--medium-gray)" }}>Assignee</p>
            {detail.assignedTo && (
              <button type="button"
                onClick={() => setPendingChange({ title: "Unassign request", subtitle: `Remove ${assigneeLabel} as the assignee`, payload: { assignedTo: null } })}
                className="text-[11px] font-bold underline" style={{ color: "var(--danger-strong)" }}>
                Unassign
              </button>
            )}
          </div>
          {!assignOpen ? (
            <button type="button" onClick={() => setAssignOpen(true)}
              className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}>
              {assigneeLabel ? `${assigneeLabel} · change` : "+ Assign to an admin…"}
            </button>
          ) : (
            <div className="rounded-xl p-2.5" style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}>
              <input value={assignSearch} onChange={(e) => setAssignSearch(e.target.value)} autoFocus
                placeholder="Search admins by name or email…"
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
              <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                {assignLoading ? (
                  <p className="px-1 py-2 text-xs" style={{ color: "var(--medium-gray)" }}>Searching…</p>
                ) : assignResults.length ? assignResults.map((u) => (
                  <button key={u.id} type="button"
                    onClick={() => setPendingChange({ title: "Assign request", subtitle: `Assign to ${u.displayName || u.email}`, payload: { assignedTo: u.id } })}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-opacity hover:opacity-70"
                    style={{ backgroundColor: "var(--background)" }}>
                    <span style={{ color: "var(--foreground)" }}>{u.displayName || u.email}</span>
                    <span className="text-xs" style={{ color: "var(--medium-gray)" }}>{u.email}</span>
                  </button>
                )) : (
                  <p className="px-1 py-2 text-xs" style={{ color: "var(--medium-gray)" }}>No admins match.</p>
                )}
              </div>
              <button type="button" onClick={() => setAssignOpen(false)}
                className="mt-2 text-xs font-bold underline" style={{ color: "var(--medium-gray)" }}>
                Cancel
              </button>
            </div>
          )}
        </div>

        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: "var(--medium-gray)" }}>SLA due date</p>
          {!slaEditing ? (
            <button type="button" onClick={() => { setSlaDraft(detail.slaDueAt ? detail.slaDueAt.slice(0, 16) : ""); setSlaEditing(true); }}
              className="w-full rounded-xl px-3 py-2 text-left text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)", color: "var(--foreground)" }}>
              {detail.slaDueAt ? `${formatDate(detail.slaDueAt)} · change` : "+ Set an SLA due date…"}
            </button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <input type="datetime-local" value={slaDraft} onChange={(e) => setSlaDraft(e.target.value)}
                className="rounded-xl px-3 py-2 text-sm outline-none"
                style={{ backgroundColor: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }} />
              <button type="button"
                onClick={() => setPendingChange({ title: "Update SLA due date", subtitle: slaDraft ? `New due date: ${formatDate(new Date(slaDraft).toISOString())}` : "Clear the SLA due date", payload: { slaDueAt: slaDraft ? new Date(slaDraft).toISOString() : null } })}
                className="rounded-xl px-3 py-2 text-xs font-bold text-white" style={{ backgroundColor: "var(--primary)" }}>
                Save
              </button>
              <button type="button" onClick={() => setSlaEditing(false)}
                className="text-xs font-bold underline" style={{ color: "var(--medium-gray)" }}>
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-4 space-y-2 px-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: "var(--medium-gray)" }}>Timeline</p>
        {timeline.length === 0 ? (
          <p className="rounded-xl py-6 text-center text-xs" style={{ border: "1px dashed var(--border)", color: "var(--medium-gray)" }}>
            Status changes, assignments, and notes will appear here.
          </p>
        ) : (
          <div className="space-y-2">
            {timeline.map((entry, i) => {
              const { title, detail: line } = describeTimelineEntry(entry as { type: string; entry: Record<string, unknown> });
              return (
                <div key={`${entry.at}-${i}`} className="rounded-xl px-3 py-2.5" style={{ backgroundColor: "var(--card)", borderLeft: "3px solid var(--primary)" }}>
                  <p className="text-sm font-bold" style={{ color: "var(--foreground)" }}>{title}</p>
                  {line && <p className="mt-0.5 text-xs" style={{ color: "var(--medium-gray)" }}>{line}</p>}
                  <p className="mt-1 text-[11px] font-semibold" style={{ color: "var(--medium-gray)" }}>{formatDate(entry.at)}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sticky action bar — sticky within whichever scroll container hosts this
          component (the Sheet's own overflow-y-auto body on desktop, or the
          page's document scroll on mobile), so one implementation works for
          both presentations without prop-drilling detail state up into Sheet's
          `footer` slot. */}
      <div className="pb-safe sticky bottom-0 z-10 mt-5 border-t px-5 py-3.5"
        style={{ backgroundColor: "color-mix(in srgb, var(--surface) 96%, transparent)", backdropFilter: "blur(8px)", borderColor: "var(--border)" }}>
        {transitions.length === 0 ? (
          <p className="rounded-xl px-3 py-2.5 text-center text-xs font-semibold" style={{ backgroundColor: "var(--background)", color: "var(--medium-gray)" }}>
            🔒 No further actions — this request is {toStatusLabel(detail.status).toLowerCase()}.
          </p>
        ) : (
          <div className="space-y-2">
            {primary && (
              <button type="button"
                onClick={() => setPendingChange({ title: `Advance to ${primary.label}`, subtitle: `${toStatusLabel(detail.status)} → ${primary.label}`, payload: { status: primary.status } })}
                className="w-full rounded-xl py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--primary)" }}>
                Advance to {primary.label}
              </button>
            )}
            {secondaryTransitions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {secondaryTransitions.map((t) => {
                  const destructive = t.status === "cancelled" || t.status === "rejected";
                  return (
                    <button key={t.status} type="button"
                      onClick={() => setPendingChange({ title: `Set ${t.label}`, subtitle: `${toStatusLabel(detail.status)} → ${t.label}`, destructive, payload: { status: t.status } })}
                      className="flex-1 rounded-xl py-2 text-xs font-bold transition-opacity hover:opacity-70"
                      style={{
                        border: destructive ? "1px solid var(--danger-strong)" : "1px solid var(--border)",
                        color: destructive ? "var(--danger-strong)" : "var(--foreground)",
                        backgroundColor: "var(--surface)",
                      }}>
                      Set {t.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <OpsWorkflowModal target={target} kind={kind} change={pendingChange} onClose={() => setPendingChange(null)} onSuccess={handleChanged} />
    </div>
  );
};
