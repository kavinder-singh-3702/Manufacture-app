"use client";

import { useRouter } from "next/navigation";
import { productService } from "@/src/services/product";
import { useToast } from "@/src/components/ui/Toast";
import { MY_PRODUCTS_HREF, myProductHref } from "../../utils/links";
import { uploadPendingImages } from "../../utils/images";
import { ProductFormPage } from "./ProductFormPage";

export const NewMyProductContainer = () => {
  const router = useRouter();
  const toast = useToast();

  return (
    <ProductFormPage
      title="New product"
      crumb="New product"
      submitLabel="Create product"
      cancelHref={MY_PRODUCTS_HREF}
      onSubmit={async (data, pendingImages) => {
        const product = await productService.create(data);
        // Photos can only be attached once the product has an id, and a failed
        // upload must not read as a failed create — see uploadPendingImages.
        await uploadPendingImages(product._id, pendingImages);
        toast.success("Product created", `"${product.name}" is now in your catalog.`);
        router.push(myProductHref(product._id));
      }}
    />
  );
};
