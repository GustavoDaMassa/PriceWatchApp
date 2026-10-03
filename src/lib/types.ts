export type ProductSource = 0 | 1 | 2;

export interface AuthResponse {
  token: string;
  email: string;
  name: string;
  isEmailVerified: boolean;
}

export interface TrackedProduct {
  id: string;
  name: string;
  url: string;
  imageUrl?: string | null;
  source: ProductSource;
  targetPrice: number;
  currentPrice: number;
  lowestPrice: number;
  isActive: boolean;
  productId?: string | null;
}

export interface OfferResponse {
  subscriptionId: string;
  productId: string;
  offerId: string;
  name: string;
  url: string;
  imageUrl?: string | null;
  source: ProductSource;
  targetPrice: number;
  currentPrice: number;
  lowestPrice: number;
  isActive: boolean;
}

export interface CreateOfferRequest {
  url: string;
  targetPrice?: number;
  clientData?: { brand?: string; model?: string };
}

export interface StoreOfferSummary {
  offerId: string;
  source: ProductSource;
  currentPrice: number;
  isCheapest: boolean;
  storeName: string;
  lowestPrice: number;
  lastCheckedAt?: string | null;
}

export interface ProductComparison {
  productId: string;
  name: string;
  imageUrl?: string | null;
  offers: StoreOfferSummary[];
}

export interface OfferCandidate {
  id: string;
  productId: string;
  source: ProductSource;
  storeName: string;
  url: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  score: number;
  reason: 0 | 1;
  preselected: boolean;
}

export interface ConfirmMatchRequest {
  isSameProduct: boolean;
  track: boolean;
  targetPrice?: number;
}

export const ConfirmOutcome = { Rejected: 0, Recorded: 1, Attached: 2, Pending: 3, Unavailable: 4 } as const;
export type ConfirmOutcome = (typeof ConfirmOutcome)[keyof typeof ConfirmOutcome];

export interface ConfirmMatchResponse {
  outcome: ConfirmOutcome;
  productId: string;
  offerId?: string | null;
}

export interface StoreCapabilities {
  source: ProductSource;
  name: string;
  homeUrl: string;
  canFetchByUrl: boolean;
  canSearch: boolean;
  canGenerateAffiliateLink: boolean;
}

export interface AppNotification {
  id: string;
  productId: string;
  productName: string;
  type: 0 | 1;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ClickResponse {
  url: string;
}
