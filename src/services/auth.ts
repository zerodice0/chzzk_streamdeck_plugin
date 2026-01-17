/**
 * CHZZK Authentication Service
 * Handles OAuth 2.0 flow with local callback server
 */

import http from "http";
import { URL } from "url";
import streamDeck from "@elgato/streamdeck";
import {
  GlobalSettings,
  TokenResponse,
  CHZZK_OAUTH_BASE,
  CHZZK_TOKEN_ENDPOINT,
  OAUTH_REDIRECT_PORT,
  OAUTH_REDIRECT_URI,
} from "../types";

export class AuthService {
  private static server: http.Server | null = null;
  private static pendingState: string | null = null;

  /**
   * Get current global settings
   */
  static async getGlobalSettings(): Promise<GlobalSettings> {
    const settings = await streamDeck.settings.getGlobalSettings<GlobalSettings>();
    return settings || { isAuthenticated: false };
  }

  /**
   * Save tokens to global settings
   */
  static async saveTokens(
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
    channelId: string,
    channelName: string
  ): Promise<void> {
    const currentSettings = await this.getGlobalSettings();
    const settings: GlobalSettings = {
      ...currentSettings,
      accessToken,
      refreshToken,
      tokenExpiry: Date.now() + expiresIn * 1000,
      channelId,
      channelName,
      isAuthenticated: true,
    };
    await streamDeck.settings.setGlobalSettings(settings);
  }

  /**
   * Clear authentication data
   */
  static async clearAuthentication(): Promise<void> {
    const currentSettings = await this.getGlobalSettings();
    await streamDeck.settings.setGlobalSettings({
      ...currentSettings,
      accessToken: undefined,
      refreshToken: undefined,
      tokenExpiry: undefined,
      channelId: undefined,
      channelName: undefined,
      isAuthenticated: false,
    });
  }

  /**
   * Check if token is expired
   */
  static async isTokenExpired(): Promise<boolean> {
    const settings = await this.getGlobalSettings();
    if (!settings.tokenExpiry) return true;
    // Consider expired if less than 5 minutes remaining
    return Date.now() > settings.tokenExpiry - 5 * 60 * 1000;
  }

  /**
   * Get valid access token, refreshing if needed
   */
  static async getValidAccessToken(): Promise<string> {
    const settings = await this.getGlobalSettings();

    if (!settings.accessToken) {
      throw new Error("Not authenticated");
    }

    if (await this.isTokenExpired()) {
      if (!settings.refreshToken) {
        throw new Error("Refresh token unavailable");
      }
      await this.refreshAccessToken();
      const newSettings = await this.getGlobalSettings();
      return newSettings.accessToken!;
    }

    return settings.accessToken;
  }

  /**
   * Generate OAuth authorization URL
   */
  static getAuthorizationUrl(clientId: string, state: string): string {
    const params = new URLSearchParams({
      clientId,
      redirectUri: OAUTH_REDIRECT_URI,
      state,
    });
    return `${CHZZK_OAUTH_BASE}?${params.toString()}`;
  }

  /**
   * Start OAuth flow with local callback server
   */
  static async startOAuthFlow(
    clientId: string,
    clientSecret: string
  ): Promise<TokenResponse> {
    // Save client credentials for token exchange
    const currentSettings = await this.getGlobalSettings();
    await streamDeck.settings.setGlobalSettings({
      ...currentSettings,
      clientId,
      clientSecret,
    });

    // Generate random state for CSRF protection
    const state = Math.random().toString(36).substring(2, 15) +
                  Math.random().toString(36).substring(2, 15);
    this.pendingState = state;

    // Start local server to receive callback
    const authCode = await this.startCallbackServer(state);

    // Exchange code for tokens
    const tokens = await this.exchangeCodeForTokens(authCode, clientId, clientSecret);

    return tokens;
  }

  /**
   * Start local HTTP server for OAuth callback
   */
  private static startCallbackServer(expectedState: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // Close existing server if any
      if (this.server) {
        this.server.close();
      }

      this.server = http.createServer((req, res) => {
        if (!req.url) {
          res.writeHead(400);
          res.end("Bad Request");
          return;
        }

        const url = new URL(req.url, `http://localhost:${OAUTH_REDIRECT_PORT}`);

        if (url.pathname === "/callback") {
          const code = url.searchParams.get("code");
          const state = url.searchParams.get("state");
          const error = url.searchParams.get("error");

          if (error) {
            res.writeHead(400);
            res.end(this.getErrorHtml(error));
            this.server?.close();
            this.server = null;
            reject(new Error(`OAuth error: ${error}`));
            return;
          }

          if (state !== expectedState) {
            res.writeHead(400);
            res.end(this.getErrorHtml("Invalid state parameter"));
            this.server?.close();
            this.server = null;
            reject(new Error("Invalid state parameter"));
            return;
          }

          if (!code) {
            res.writeHead(400);
            res.end(this.getErrorHtml("No authorization code received"));
            this.server?.close();
            this.server = null;
            reject(new Error("No authorization code received"));
            return;
          }

          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(this.getSuccessHtml());
          this.server?.close();
          this.server = null;
          resolve(code);
        } else {
          res.writeHead(404);
          res.end("Not Found");
        }
      });

      this.server.listen(OAUTH_REDIRECT_PORT, () => {
        streamDeck.logger.info(`OAuth callback server started on port ${OAUTH_REDIRECT_PORT}`);
      });

      this.server.on("error", (err) => {
        streamDeck.logger.error(`OAuth server error: ${err.message}`);
        reject(err);
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        if (this.server) {
          this.server.close();
          this.server = null;
          reject(new Error("OAuth timeout"));
        }
      }, 5 * 60 * 1000);
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  private static async exchangeCodeForTokens(
    code: string,
    clientId: string,
    clientSecret: string
  ): Promise<TokenResponse> {
    const response = await fetch(CHZZK_TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grantType: "authorization_code",
        code,
        clientId,
        clientSecret,
        redirectUri: OAUTH_REDIRECT_URI,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return {
      access_token: data.content.accessToken,
      refresh_token: data.content.refreshToken,
      expires_in: data.content.expiresIn,
      token_type: data.content.tokenType,
    };
  }

  /**
   * Refresh access token
   */
  static async refreshAccessToken(): Promise<void> {
    const settings = await this.getGlobalSettings();

    if (!settings.refreshToken || !settings.clientId || !settings.clientSecret) {
      throw new Error("Missing refresh token or client credentials");
    }

    const response = await fetch(CHZZK_TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        grantType: "refresh_token",
        refreshToken: settings.refreshToken,
        clientId: settings.clientId,
        clientSecret: settings.clientSecret,
      }),
    });

    if (!response.ok) {
      // Refresh token is invalid, clear auth
      await this.clearAuthentication();
      throw new Error("Token refresh failed");
    }

    const data = await response.json();
    await this.saveTokens(
      data.content.accessToken,
      data.content.refreshToken,
      data.content.expiresIn,
      settings.channelId || "",
      settings.channelName || ""
    );
  }

  /**
   * Revoke token (logout)
   */
  static async revokeToken(): Promise<void> {
    const settings = await this.getGlobalSettings();

    if (settings.accessToken && settings.clientId && settings.clientSecret) {
      try {
        await fetch(`${CHZZK_TOKEN_ENDPOINT}/revoke`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: settings.accessToken,
            clientId: settings.clientId,
            clientSecret: settings.clientSecret,
          }),
        });
      } catch (error) {
        streamDeck.logger.warn("Token revocation failed, proceeding with logout");
      }
    }

    await this.clearAuthentication();
  }

  /**
   * Open authorization URL in browser
   */
  static openAuthorizationUrl(clientId: string, state: string): void {
    const url = this.getAuthorizationUrl(clientId, state);
    // Stream Deck SDK will open the URL in default browser
    streamDeck.system.openUrl(url);
  }

  /**
   * Success HTML page for OAuth callback
   */
  private static getSuccessHtml(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>CHZZK 인증 완료</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #fff;
    }
    .container {
      text-align: center;
      padding: 40px;
      background: rgba(255,255,255,0.1);
      border-radius: 16px;
      backdrop-filter: blur(10px);
    }
    .success-icon {
      font-size: 64px;
      margin-bottom: 20px;
    }
    h1 { margin: 0 0 10px; }
    p { margin: 0; opacity: 0.8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="success-icon">&#10004;</div>
    <h1>인증 완료!</h1>
    <p>이 창을 닫고 Stream Deck으로 돌아가세요.</p>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Error HTML page for OAuth callback
   */
  private static getErrorHtml(error: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>CHZZK 인증 실패</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #fff;
    }
    .container {
      text-align: center;
      padding: 40px;
      background: rgba(255,255,255,0.1);
      border-radius: 16px;
      backdrop-filter: blur(10px);
    }
    .error-icon {
      font-size: 64px;
      margin-bottom: 20px;
      color: #ff6b6b;
    }
    h1 { margin: 0 0 10px; color: #ff6b6b; }
    p { margin: 0; opacity: 0.8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="error-icon">&#10006;</div>
    <h1>인증 실패</h1>
    <p>${error}</p>
  </div>
</body>
</html>
    `.trim();
  }
}
