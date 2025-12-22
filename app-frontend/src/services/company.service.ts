import { apiClient } from "./apiClient";
import type {
  Company,
  CreateCompanyPayload,
  SwitchCompanyResponse,
  UpdateCompanyPayload,
  UploadCompanyFilePayload,
} from "../types/company";
import { UploadedFile } from "../types/uploads";

type RawCompany = Company;

const mapCompany = (company: RawCompany): Company => ({
  id: company?.id ?? "",
  displayName: company?.displayName ?? company?.legalName ?? "Company",
  legalName: company?.legalName,
  type: company?.type ?? "normal",
  categories: company?.categories ?? [],
  status: company?.status ?? "pending-verification",
  complianceStatus: company?.complianceStatus ?? "pending",
  createdAt: company?.createdAt,
  updatedAt: company?.updatedAt,
  slug: company?.slug,
  description: company?.description,
  foundedAt: company?.foundedAt,
  sizeBucket: company?.sizeBucket,
  logoUrl: company?.logoUrl,
  coverImageUrl: company?.coverImageUrl,
  contact: company?.contact,
  headquarters: company?.headquarters,
  locations: company?.locations ?? [],
  socialLinks: company?.socialLinks,
  documents: company?.documents,
});

const list = async () => {
  const response = await apiClient.get<{ companies: RawCompany[] }>("/companies");
  return { companies: (response.companies ?? []).map(mapCompany) };
};

const create = async (payload: CreateCompanyPayload) => {
  const response = await apiClient.post<{ company: RawCompany }>("/companies", payload);
  return { company: mapCompany(response.company) };
};

const get = async (companyId: string) => {
  const response = await apiClient.get<{ company: RawCompany }>(`/companies/${companyId}`);
  return { company: mapCompany(response.company) };
};

const update = async (companyId: string, payload: UpdateCompanyPayload) => {
  const response = await apiClient.patch<{ company: RawCompany }>(`/companies/${companyId}`, payload);
  return { company: mapCompany(response.company) };
};

const switchActive = async (companyId: string) => {
  const response = await apiClient.post<SwitchCompanyResponse & { company: RawCompany }>(`/companies/${companyId}/select`);
  return {
    activeCompany: response.activeCompany,
    company: mapCompany(response.company),
  };
};

const uploadFile = async (companyId: string, payload: UploadCompanyFilePayload) => {
  const fetchRes = await fetch(payload.uri);
  const blob = await fetchRes.blob();

  const form = new FormData();
  form.append("file", blob, payload.fileName);
  if (payload.purpose) {
    form.append("purpose", payload.purpose);
  }

  const response = await apiClient.post<{ file: UploadedFile; company: RawCompany; purpose: string }>(
    `/companies/${companyId}/uploads`,
    form
  );
  return {
    file: response.file,
    company: mapCompany(response.company),
    purpose: response.purpose,
  };
};

export const companyService = {
  list,
  create,
  get,
  update,
  switchActive,
  uploadFile,
};
