/**
 * CHZZK API Service
 * Handles all CHZZK API calls
 */

import streamDeck from "@elgato/streamdeck";
import { AuthService } from "./auth";
import {
  ChzzkApiResponse,
  ChzzkUser,
  ChzzkLiveInfo,
  ChzzkLiveSetting,
  ChzzkLiveSettingUpdate,
  ChzzkChannel,
  CHZZK_API_BASE,
} from "../types";

export class ChzzkAPI {
  /**
   * Generic API request with automatic token refresh
   */
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    let accessToken: string;
    try {
      accessToken = await AuthService.getValidAccessToken();
    } catch (error) {
      throw new Error("Not authenticated");
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...((options.headers || {}) as Record<string, string>),
    };

    const url = `${CHZZK_API_BASE}${endpoint}`;
    streamDeck.logger.debug(`API Request: ${options.method || "GET"} ${url}`);

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // If 401, try to refresh token and retry once
    if (response.status === 401) {
      streamDeck.logger.info("Token expired, attempting refresh...");
      try {
        await AuthService.refreshAccessToken();
        accessToken = await AuthService.getValidAccessToken();
        headers.Authorization = `Bearer ${accessToken}`;

        response = await fetch(url, {
          ...options,
          headers,
        });
      } catch (error) {
        streamDeck.logger.error("Token refresh failed during API call");
        throw new Error("Authentication expired");
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      streamDeck.logger.error(`API Error: ${response.status} ${errorText}`);
      throw new Error(`API error: ${response.status}`);
    }

    const data: ChzzkApiResponse<T> = await response.json();

    if (data.code !== 200) {
      throw new Error(data.message || "API request failed");
    }

    return data.content;
  }

  /**
   * Get current user info
   */
  static async getCurrentUser(): Promise<ChzzkUser> {
    return this.request<ChzzkUser>("/open/v1/users/me");
  }

  /**
   * Get live info for a channel
   * @param channelId - Channel ID (optional, uses authenticated user's channel if not provided)
   */
  static async getLiveInfo(channelId?: string): Promise<ChzzkLiveInfo | null> {
    const settings = await AuthService.getGlobalSettings();
    const targetChannelId = channelId || settings.channelId;

    if (!targetChannelId) {
      throw new Error("No channel ID available");
    }

    try {
      const response = await this.request<{ lives: ChzzkLiveInfo[] }>(
        `/open/v1/lives?channelId=${targetChannelId}`
      );
      return response.lives?.[0] || null;
    } catch (error) {
      // May return empty if not live
      return null;
    }
  }

  /**
   * Get current viewer count
   * Returns 0 if not live or error
   */
  static async getViewerCount(channelId?: string): Promise<number> {
    try {
      const liveInfo = await this.getLiveInfo(channelId);
      return liveInfo?.concurrentUserCount || 0;
    } catch (error) {
      streamDeck.logger.warn(`Failed to get viewer count: ${error}`);
      return 0;
    }
  }

  /**
   * Check if channel is currently live
   */
  static async isLive(channelId?: string): Promise<boolean> {
    try {
      const liveInfo = await this.getLiveInfo(channelId);
      return liveInfo?.liveId !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get live settings
   */
  static async getLiveSettings(): Promise<ChzzkLiveSetting> {
    return this.request<ChzzkLiveSetting>("/open/v1/lives/setting");
  }

  /**
   * Update live settings
   */
  static async updateLiveSettings(
    settings: ChzzkLiveSettingUpdate
  ): Promise<void> {
    await this.request("/open/v1/lives/setting", {
      method: "PATCH",
      body: JSON.stringify(settings),
    });
  }

  /**
   * Update live title
   */
  static async updateLiveTitle(title: string): Promise<void> {
    if (!title.trim()) {
      throw new Error("Title cannot be empty");
    }
    await this.updateLiveSettings({ defaultLiveTitle: title });
  }

  /**
   * Update live category
   */
  static async updateLiveCategory(
    categoryType: "GAME" | "SPORTS" | "ETC",
    categoryId?: string
  ): Promise<void> {
    const settings: ChzzkLiveSettingUpdate = { categoryType };
    if (categoryId) {
      settings.categoryId = categoryId;
    }
    await this.updateLiveSettings(settings);
  }

  /**
   * Update live tags
   */
  static async updateLiveTags(tags: string[]): Promise<void> {
    await this.updateLiveSettings({ tags });
  }

  /**
   * Get channel info
   */
  static async getChannelInfo(channelId?: string): Promise<ChzzkChannel> {
    const settings = await AuthService.getGlobalSettings();
    const targetChannelId = channelId || settings.channelId;

    if (!targetChannelId) {
      throw new Error("No channel ID available");
    }

    return this.request<ChzzkChannel>(
      `/open/v1/channels?channelId=${targetChannelId}`
    );
  }

  /**
   * Format viewer count for display
   */
  static formatViewerCount(count: number): string {
    if (count >= 10000) {
      return `${(count / 10000).toFixed(1)}만`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}천`;
    }
    return count.toString();
  }
}
