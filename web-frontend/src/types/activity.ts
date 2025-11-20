export type ActivityEvent = {
  id: string;
  user?: string;
  company?: string;
  companyName?: string;
  action: string;
  category?: string;
  label: string;
  description?: string;
  meta?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
};

export type ActivityListResponse = {
  activities: ActivityEvent[];
};
