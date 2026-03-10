export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  status: string;
}

export interface BusinessSettings {
  id: string;
  name: string;
  logo_url: string | null;
}

export interface InventoryLocation {
  id: string;
  name: string;
  code: string;
  location_type: string;
  is_active: boolean;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  created_at: string;
}

// API response types
export interface ProfileResponse {
  profile: UserProfile | null;
}

export interface BusinessResponse {
  business: BusinessSettings | null;
}

export interface LocationsResponse {
  locations: InventoryLocation[];
}

export interface LocationResponse {
  location: InventoryLocation;
}

export interface PaymentMethodsResponse {
  paymentMethods: PaymentMethod[];
}

export interface PaymentMethodResponse {
  paymentMethod: PaymentMethod;
}

export interface AvatarUploadResponse {
  message: string;
  avatarUrl: string;
}

export interface LogoUploadResponse {
  message: string;
  logoUrl: string;
}
