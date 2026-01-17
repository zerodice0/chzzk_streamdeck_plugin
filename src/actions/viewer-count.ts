/**
 * Viewer Count Action
 * Displays real-time viewer count on Stream Deck button
 */

import {
  action,
  Action,
  KeyDownEvent,
  SingletonAction,
  WillAppearEvent,
  WillDisappearEvent,
  DidReceiveSettingsEvent,
} from "@elgato/streamdeck";
import { AuthService } from "../services/auth";
import { ChzzkAPI } from "../services/chzzk-api";
import { ViewerCountSettings, DEFAULT_REFRESH_INTERVAL } from "../types";

@action({ UUID: "com.zerodice0.chzzk.viewer-count" })
export class ViewerCountAction extends SingletonAction<ViewerCountSettings> {
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Called when action appears on Stream Deck
   */
  override async onWillAppear(
    ev: WillAppearEvent<ViewerCountSettings>
  ): Promise<void> {
    const context = ev.action.id;
    const settings = ev.payload.settings;
    const interval = settings.refreshInterval || DEFAULT_REFRESH_INTERVAL;

    // Initial update
    await this.updateDisplay(ev.action);

    // Start periodic updates
    this.startPeriodicUpdate(context, ev.action, interval);
  }

  /**
   * Called when action disappears from Stream Deck
   */
  override onWillDisappear(ev: WillDisappearEvent<ViewerCountSettings>): void {
    const context = ev.action.id;
    this.stopPeriodicUpdate(context);
  }

  /**
   * Called when user presses the key
   */
  override async onKeyDown(
    ev: KeyDownEvent<ViewerCountSettings>
  ): Promise<void> {
    // Force refresh on key press
    await this.updateDisplay(ev.action);
    await ev.action.showOk();
  }

  /**
   * Called when settings are updated from Property Inspector
   */
  override async onDidReceiveSettings(
    ev: DidReceiveSettingsEvent<ViewerCountSettings>
  ): Promise<void> {
    const context = ev.action.id;
    const settings = ev.payload.settings;
    const interval = settings.refreshInterval || DEFAULT_REFRESH_INTERVAL;

    // Restart periodic update with new interval
    this.stopPeriodicUpdate(context);
    this.startPeriodicUpdate(context, ev.action, interval);

    // Immediate update
    await this.updateDisplay(ev.action);
  }

  /**
   * Start periodic viewer count updates
   */
  private startPeriodicUpdate(
    context: string,
    actionInstance: Action<ViewerCountSettings>,
    intervalSeconds: number
  ): void {
    const intervalId = setInterval(async () => {
      await this.updateDisplay(actionInstance);
    }, intervalSeconds * 1000);

    this.updateIntervals.set(context, intervalId);
  }

  /**
   * Stop periodic updates for a context
   */
  private stopPeriodicUpdate(context: string): void {
    const intervalId = this.updateIntervals.get(context);
    if (intervalId) {
      clearInterval(intervalId);
      this.updateIntervals.delete(context);
    }
  }

  /**
   * Update the button display with current viewer count
   */
  private async updateDisplay(
    actionInstance: Action<ViewerCountSettings>
  ): Promise<void> {
    try {
      const globalSettings = await AuthService.getGlobalSettings();

      if (!globalSettings.isAuthenticated) {
        await actionInstance.setTitle("Login\nRequired");
        return;
      }

      const isLive = await ChzzkAPI.isLive();

      if (!isLive) {
        await actionInstance.setTitle("OFFLINE");
        return;
      }

      const viewerCount = await ChzzkAPI.getViewerCount();
      const formattedCount = ChzzkAPI.formatViewerCount(viewerCount);

      await actionInstance.setTitle(`${formattedCount}`);
    } catch (error) {
      await actionInstance.setTitle("Error");
    }
  }
}
