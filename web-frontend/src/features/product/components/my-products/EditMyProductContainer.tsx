"use client";

import { useRouter } from "next/navigation";
import { productService } from "@/src/services/product";
import { useToast } from "@/src/components/ui/Toast";
import { useProductResource } from "../../hooks/useProductResource";
import { myProductHref } from "../../utils/links";
import { uploadPendingImages } from "../../utils/images";
import { ProductFormPage } from "./ProductFormPage";
import { MyProductLoadError, MyProductSkeleton } from "./shared";

export const EditMyProductContainer = ({ productId }: { productId: string }) => {
  const router = useRouter();
  const toast = useToast();
  const { product, loading, error, notFound, reload } = useProductResource(productId);

  if (loading) return <MyProductSkeleton />;
  // ProductFormPage seeds its state from `product` on mount, so it must not
  // render before the fetch resolves — otherwise it would open blank.
  if (!product) return <MyProductLoadError notFound={notFound} message={error} onRetry={reload} />;

  const detailHref = myProductHref(product._id);

  return (
    <ProductFormPage
      title="Edit product"
      crumb={product.name}
      submitLabel="Save changes"
      cancelHref={detailHref}
      product={product}
      onSubmit={async (data, pendingImages) => {
        await productService.update(product._id, data);
        await uploadPendingImages(product._id, pendingImages);
        toast.success("Product saved", "Your changes have been applied.");
        router.push(detailHref);
      }}
    />
  );
};
