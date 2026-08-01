"use client";

/**
 * Full-page chrome for the product form — the create and edit routes differ
 * only in their title, submit label and what `onSubmit` does, so they share
 * this shell instead of each laying out their own page.
 *
 * Deliberately no fixed/sticky footer: the dashboard already has a fixed
 * mobile tab rail at the bottom, and a second floating bar would sit on top
 * of it. The action row simply ends the form instead.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import type { Product } from "@/src/types/product";
import { PageHeader, Card } from "@/src/components/ui/Surface";
import { useProductForm, type ProductFormSubmit } from "../../hooks/useProductForm";
import { ProductFormError, ProductFormFields } from "../ProductFormFields";
import { MyProductsCrumb } from "./shared";

export const ProductFormPage = ({
  title,
  crumb,
  submitLabel,
  cancelHref,
  product,
  onSubmit,
}: {
  title: string;
  crumb: string;
  submitLabel: string;
  cancelHref: string;
  /** Pre-fills the form. Edit mode must not mount this until the product is loaded. */
  product?: Product | null;
  onSubmit: ProductFormSubmit;
}) => {
  const api = useProductForm(product);
  const { error, saving } = api;

  return (
    <motion.form
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      onSubmit={api.handleSubmit(onSubmit)}
      className="mx-auto max-w-3xl"
    >
      <PageHeader
        breadcrumb={<MyProductsCrumb current={crumb} />}
        title={title}
        actions={
          <Link
            href={cancelHref}
            className="hidden rounded-xl px-4 py-2.5 text-sm font-semibold transition-opacity hover:opacity-70 sm:inline-flex"
            style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
          >
            Cancel
          </Link>
        }
      />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card padding="lg" tone="surface">
          <ProductFormFields api={api} existingImages={product?.images} />
        </Card>
      </motion.div>

      {error && <div className="mt-4"><ProductFormError message={error} /></div>}

      {/* Action row — stacks full-width on mobile so it stays thumb-reachable */}
      <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
        <Link
          href={cancelHref}
          className="rounded-xl px-4 py-2.5 text-center text-sm font-semibold transition-opacity hover:opacity-70"
          style={{ border: "1px solid var(--border)", color: "var(--foreground)" }}
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: "var(--accent)", boxShadow: "var(--shadow-accent)" }}
        >
          {saving ? "Saving…" : submitLabel}
        </button>
      </div>
    </motion.form>
  );
};
