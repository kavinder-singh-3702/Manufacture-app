import { productService } from "@/src/services/product";
import type { PendingImage } from "../components/ProductImageUploader";

/**
 * Uploads the form's pending images after the product row itself exists.
 * Sequential on purpose — the backend writes them onto the same product
 * document, so parallel uploads race each other's image array.
 *
 * Failures are swallowed: the product was already created/saved, so a failed
 * photo must not present itself to the seller as a failed save.
 */
export const uploadPendingImages = async (productId: string, images: PendingImage[]): Promise<void> => {
  for (const img of images) {
    try {
      const base64 = img.dataUrl.includes(",") ? img.dataUrl.split(",")[1] : img.dataUrl;
      await productService.uploadImage(productId, {
        fileName: img.file.name,
        mimeType: img.file.type || "image/jpeg",
        content: base64 ?? "",
      });
    } catch { /* non-fatal — see doc comment */ }
  }
};
