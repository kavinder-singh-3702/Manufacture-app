import { httpClient } from "../lib/http-client";
import type { Company, CreateCompanyPayload, SwitchCompanyResponse, UpdateCompanyPayload } from "../types/company";

type RawCompany = Company;

const mapCompany = (company: RawCompany): Company => ({
  id: company?.id ?? "",
  displayName: company?.displayName ?? company?.legalName ?? "Company",
  legalName: company?.legalName,
  type: company?.type,
  categories: company?.categories ?? [],
  status: company?.status,
  complianceStatus: company?.complianceStatus,
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
  const response = await httpClient.get<{ companies: RawCompany[] }>("/companies");
  return { companies: (response.companies ?? []).map(mapCompany) };
};

const create = async (payload: CreateCompanyPayload) => {
  const response = await httpClient.post<{ company: RawCompany }>("/companies", payload);
  return { company: mapCompany(response.company) };
};

const get = async (companyId: string) => {
  const response = await httpClient.get<{ company: RawCompany }>(`/companies/${companyId}`);
  return { company: mapCompany(response.company) };
};

const update = async (companyId: string, payload: UpdateCompanyPayload) => {
  const response = await httpClient.patch<{ company: RawCompany }>(`/companies/${companyId}`, payload);
  return { company: mapCompany(response.company) };
};

const switchActive = async (companyId: string) => {
  const response = await httpClient.post<SwitchCompanyResponse & { company: RawCompany }>(
    `/companies/${companyId}/select`
  );
  return {
    activeCompany: response.activeCompany,
    company: mapCompany(response.company),
  };
};

export const companyService = {
  list,
  create,
  get,
  update,
  switchActive,
};
