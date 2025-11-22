import { View } from "react-native";
import { ProfileSection } from "../../profile/components/ProfileSection";
import { ProfileField } from "../../profile/components/ProfileField";
import { Company } from "../../../types/company";
import { CompanyEditorSection } from "./types";

type Props = {
  company: Company;
  onEdit: (section: Exclude<CompanyEditorSection, null>) => void;
  formatAddress: (company?: Company | null) => string | null;
  formatCategories: (company?: Company | null) => string;
};

export const CompanySections = ({ company, onEdit, formatAddress, formatCategories }: Props) => (
  <>
    <View style={{ marginBottom: 20 }}>
      <ProfileSection title="Company overview" description="Core identity buyers will see." actionLabel="Edit" onAction={() => onEdit("overview")}>
        <ProfileField label="Display name" value={company.displayName} helperText="Shown across requests and chats." />
        <ProfileField label="Legal name" value={company.legalName} helperText="Used for agreements and invoicing." />
        <ProfileField label="Type" value={company.type ?? "normal"} />
        <ProfileField label="Categories" value={formatCategories(company)} />
        <ProfileField label="Description" value={company.description ?? "Add a short description for buyers."} />
      </ProfileSection>
    </View>

    <View style={{ marginBottom: 20 }}>
      <ProfileSection title="Contact & presence" description="How partners reach your team." actionLabel="Edit" onAction={() => onEdit("contact")}>
        <ProfileField label="Email" value={company.contact?.email} />
        <ProfileField label="Phone" value={company.contact?.phone} />
        <ProfileField label="Website" value={company.contact?.website} />
        <ProfileField label="LinkedIn" value={company.socialLinks?.linkedin} />
        <ProfileField label="Twitter" value={company.socialLinks?.twitter} />
        <ProfileField label="Instagram" value={company.socialLinks?.instagram} />
        <ProfileField label="YouTube" value={company.socialLinks?.youtube} />
      </ProfileSection>
    </View>

    <View style={{ marginBottom: 20 }}>
      <ProfileSection title="Headquarters" description="Primary address for compliance & logistics." actionLabel="Edit" onAction={() => onEdit("address")}>
        <ProfileField label="Address" value={formatAddress(company)} />
        <ProfileField label="City" value={company.headquarters?.city} />
        <ProfileField label="State" value={company.headquarters?.state} />
        <ProfileField label="Postal code" value={company.headquarters?.postalCode} />
        <ProfileField label="Country" value={company.headquarters?.country} />
      </ProfileSection>
    </View>
  </>
);
