"use client";

import { Sheet } from "@/src/components/ui/Sheet";
import { Field, FieldInput, FieldTextarea } from "@/src/components/ui/FormField";
import type { ProfileFormState } from "../helpers";

export type ProfileEditorType = "identity" | "professional" | null;

type ProfileEditorSheetProps = {
  editorType: ProfileEditorType;
  onClose: () => void;
  form: ProfileFormState;
  onFieldChange: (key: keyof ProfileFormState, value: string) => void;
  companyDescription: string;
  onCompanyDescriptionChange: (value: string) => void;
  hasActiveCompany: boolean;
  onSave: () => void;
  saving: boolean;
  error?: string;
};

/**
 * One shared editor for both "Personal" and "Professional" fields — mirrors
 * the app's single ProfileEditorModal shell reused for both editor variants
 * (app-frontend/src/screens/profile/components/ProfileEditorModal.tsx): same
 * title/fields-swap, one Save button, inline error, saving spinner. Renders
 * as a bottom sheet on mobile / right panel on desktop via the shared `Sheet`.
 */
export const ProfileEditorSheet = ({
  editorType,
  onClose,
  form,
  onFieldChange,
  companyDescription,
  onCompanyDescriptionChange,
  hasActiveCompany,
  onSave,
  saving,
  error,
}: ProfileEditorSheetProps) => {
  const title = editorType === "identity" ? "Edit personal info" : "Edit professional info";

  return (
    <Sheet open={editorType !== null} onClose={onClose} title={title}>
      <div className="space-y-4">
        {editorType === "identity" && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name">
                <FieldInput value={form.firstName} onChange={(e) => onFieldChange("firstName", e.target.value)} />
              </Field>
              <Field label="Last name">
                <FieldInput value={form.lastName} onChange={(e) => onFieldChange("lastName", e.target.value)} />
              </Field>
            </div>
            <Field label="Display name">
              <FieldInput value={form.displayName} onChange={(e) => onFieldChange("displayName", e.target.value)} />
            </Field>
            <Field label="Address line 1">
              <FieldInput value={form.line1} onChange={(e) => onFieldChange("line1", e.target.value)} />
            </Field>
            <Field label="Address line 2">
              <FieldInput value={form.line2} onChange={(e) => onFieldChange("line2", e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="City">
                <FieldInput value={form.city} onChange={(e) => onFieldChange("city", e.target.value)} />
              </Field>
              <Field label="State">
                <FieldInput value={form.state} onChange={(e) => onFieldChange("state", e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Postal code">
                <FieldInput value={form.postalCode} onChange={(e) => onFieldChange("postalCode", e.target.value)} />
              </Field>
              <Field label="Country">
                <FieldInput value={form.country} onChange={(e) => onFieldChange("country", e.target.value)} />
              </Field>
            </div>
          </>
        )}

        {editorType === "professional" && (
          <>
            <Field label="Company about">
              <FieldTextarea
                rows={4}
                disabled={!hasActiveCompany}
                placeholder={hasActiveCompany ? "Describe your company, mission, and what makes you unique" : "Create a company first to add an overview"}
                value={companyDescription}
                onChange={(e) => onCompanyDescriptionChange(e.target.value)}
              />
            </Field>
            <Field label="Bio">
              <FieldTextarea
                rows={3}
                placeholder="A short description about yourself"
                value={form.bio}
                onChange={(e) => onFieldChange("bio", e.target.value)}
              />
            </Field>
            <Field label="Activity tags">
              <FieldInput
                placeholder="procurement, compliance"
                value={form.activityTags}
                onChange={(e) => onFieldChange("activityTags", e.target.value)}
              />
            </Field>
            <p className="text-xs" style={{ color: "var(--medium-gray)" }}>Separate tags with commas.</p>
          </>
        )}

        {error ? (
          <p className="text-sm font-semibold" style={{ color: "var(--accent)" }}>{error}</p>
        ) : null}

        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="w-full rounded-full py-3 text-sm font-bold text-white transition-opacity disabled:opacity-60"
          style={{ backgroundColor: "var(--primary)", boxShadow: "var(--shadow-primary)" }}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </Sheet>
  );
};
