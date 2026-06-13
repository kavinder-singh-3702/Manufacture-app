import { httpClient } from "../lib/http-client";

export type ContactMessageInput = {
  name: string;
  email: string;
  company?: string;
  topic?: string;
  message: string;
};

export type CreateContactResponse = {
  ok: boolean;
  message: string;
  contactMessageId: string;
};

const create = (input: ContactMessageInput) =>
  httpClient.post<CreateContactResponse>("/contact", input);

export const contactService = { create };
