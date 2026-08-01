"use client";

/**
 * Confirm → delete → toast, in one place. Both the "My Products" list and the
 * owner detail page delete products; without this they'd each hand-roll the
 * same confirm copy and the same error handling.
 */

import { useCallback, useState } from "react";
import { productService } from "@/src/services/product";
import { ApiError } from "@/src/lib/api-error";
import type { Product } from "@/src/types/product";
import { useConfirm } from "@/src/components/ui/ConfirmDialog";
import { useToast } from "@/src/components/ui/Toast";

type DeletableProduct = Pick<Product, "_id" | "name">;

export const useDeleteProduct = () => {
  const confirm = useConfirm();
  const toast = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  /** Resolves true only when the product was actually deleted. */
  const requestDelete = useCallback(
    async (product: DeletableProduct, onDeleted?: () => void | Promise<void>): Promise<boolean> => {
      const confirmed = await confirm({
        title: `Delete "${product.name}"?`,
        message: "This removes the product from your catalog and from marketplace search. It can't be undone.",
        confirmLabel: "Delete product",
        destructive: true,
      });
      if (!confirmed) return false;

      try {
        setDeletingId(product._id);
        await productService.remove(product._id);
        toast.success("Product deleted", `"${product.name}" is no longer in your catalog.`);
        await onDeleted?.();
        return true;
      } catch (err) {
        toast.error(
          "Couldn't delete product",
          err instanceof ApiError || err instanceof Error ? err.message : "Please try again."
        );
        return false;
      } finally {
        setDeletingId(null);
      }
    },
    [confirm, toast]
  );

  return { requestDelete, deletingId };
};
