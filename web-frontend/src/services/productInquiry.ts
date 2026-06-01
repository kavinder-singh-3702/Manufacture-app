import { httpClient } from "../lib/http-client";
import type { ProductInquiryInput } from "../types/product";

const create = async (data: ProductInquiryInput) => {
  return httpClient.post<{ success: boolean; message?: string }>("/product-inquiries", data);
};

export const productInquiryService = { create };
