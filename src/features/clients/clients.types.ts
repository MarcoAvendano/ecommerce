import type { Database } from "../../../types/supabase";

type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];
type CustomerAddressRow = Database["public"]["Tables"]["customer_addresses"]["Row"];

export interface ClientListItem {
  id: CustomerRow["id"];
  fullName: CustomerRow["full_name"];
  email: CustomerRow["email"];
  phone: CustomerRow["phone"];
  documentType: CustomerRow["document_type"];
  documentNumber: CustomerRow["document_number"];
  notes: CustomerRow["notes"];
  createdAt: CustomerRow["created_at"];
  updatedAt: CustomerRow["updated_at"];
}

export interface ClientsListResponse {
  clients: ClientListItem[];
}

export interface CreateClientResponse {
  message: string;
  client: ClientListItem;
}

export interface UpdateClientResponse {
  message: string;
  client: ClientListItem;
}

export interface DeleteClientResponse {
  message: string;
}

export interface ClientAddressItem {
  id: CustomerAddressRow["id"];
  label: CustomerAddressRow["label"];
  line1: CustomerAddressRow["line1"];
  line2: CustomerAddressRow["line2"];
  city: CustomerAddressRow["city"];
  state: CustomerAddressRow["state"];
  postalCode: CustomerAddressRow["postal_code"];
  country: CustomerAddressRow["country"];
  isDefault: CustomerAddressRow["is_default"];
  createdAt: CustomerAddressRow["created_at"];
  updatedAt: CustomerAddressRow["updated_at"];
}

export interface ClientDetailItem extends ClientListItem {
  addresses: ClientAddressItem[];
}

export interface ClientDetailResponse {
  client: ClientDetailItem;
}

export interface CreateClientAddressResponse {
  message: string;
  address: ClientAddressItem;
}

export interface UpdateClientAddressResponse {
  message: string;
  address: ClientAddressItem;
}

export interface DeleteClientAddressResponse {
  message: string;
}
