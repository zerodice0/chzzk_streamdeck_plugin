/**
 * CHZZK Stream Deck Plugin - Type Definitions
 */

// ============================================
// OAuth & Authentication Types
// ============================================

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export type GlobalSettings = {
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: number;
  channelId?: string;
  channelName?: string;
  isAuthenticated: boolean;
  clientId?: string;
  clientSecret?: string;
  [key: string]: unknown;
};

// ============================================
// Action Settings Types
// ============================================

export type ViewerCountSettings = {
  refreshInterval?: number; // seconds, default 30
  [key: string]: unknown;
};

export type LiveSettingsActionSettings = {
  presetName?: string;
  title?: string;
  categoryType?: CategoryType;
  categoryId?: string;
  tags?: string[];
  [key: string]: unknown;
};

// ============================================
// CHZZK API Types
// ============================================

export type CategoryType = "GAME" | "SPORTS" | "ETC";

export interface ChzzkUser {
  channelId: string;
  channelName: string;
}

export interface ChzzkLiveInfo {
  liveId: string | null;
  liveTitle: string;
  status: string;
  concurrentUserCount: number;
  accumulateCount: number;
  openDate: string | null;
  closeDate: string | null;
  adult: boolean;
  categoryType: CategoryType;
  liveCategory: string;
  liveCategoryValue: string;
}

export interface ChzzkLiveSetting {
  defaultLiveTitle: string;
  categoryType: CategoryType;
  categoryId: string;
  tags: string[];
}

export interface ChzzkLiveSettingUpdate {
  defaultLiveTitle?: string;
  categoryType?: CategoryType;
  categoryId?: string;
  tags?: string[];
}

export interface ChzzkChannel {
  channelId: string;
  channelName: string;
  channelImageUrl: string;
  followerCount: number;
}

// ============================================
// API Response Types
// ============================================

export interface ChzzkApiResponse<T> {
  code: number;
  message: string | null;
  content: T;
}

export interface ChzzkTokenResponse {
  content: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
  };
}

// ============================================
// Constants
// ============================================

export const CHZZK_OAUTH_BASE = "https://chzzk.naver.com/account-interlock";
export const CHZZK_TOKEN_ENDPOINT = "https://api.chzzk.naver.com/auth/v1/token";
export const CHZZK_API_BASE = "https://openapi.chzzk.naver.com";
export const OAUTH_REDIRECT_PORT = 23456;
export const OAUTH_REDIRECT_URI = `http://localhost:${OAUTH_REDIRECT_PORT}/callback`;

export const DEFAULT_REFRESH_INTERVAL = 30; // seconds
