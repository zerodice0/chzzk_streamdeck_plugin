/**
 * Live Settings Action
 * Changes broadcast title, category, and tags on button press
 */

import {
  action,
  Action,
  KeyDownEvent,
  SingletonAction,
  WillAppearEvent,
  DidReceiveSettingsEvent,
} from "@elgato/streamdeck";
import { AuthService } from "../services/auth";
import { ChzzkAPI } from "../services/chzzk-api";
import { LiveSettingsActionSettings, ChzzkLiveSettingUpdate } from "../types";

@action({ UUID: "com.zerodice0.chzzk.live-settings" })
export class LiveSettingsAction extends SingletonAction<LiveSettingsActionSettings> {
  /**
   * Called when action appears on Stream Deck
   */
  override async onWillAppear(
    ev: WillAppearEvent<LiveSettingsActionSettings>
  ): Promise<void> {
    const settings = ev.payload.settings;
    await this.updateDisplay(ev.action, settings);
  }

  /**
   * Called when user presses the key
   */
  override async onKeyDown(
    ev: KeyDownEvent<LiveSettingsActionSettings>
  ): Promise<void> {
    const settings = ev.payload.settings;

    try {
      const globalSettings = await AuthService.getGlobalSettings();

      if (!globalSettings.isAuthenticated) {
        await ev.action.showAlert();
        return;
      }

      // Check if any settings are configured
      if (!settings.title && !settings.categoryType && !settings.tags?.length) {
        await ev.action.showAlert();
        return;
      }

      // Build update payload
      const update: ChzzkLiveSettingUpdate = {};

      if (settings.title) {
        update.defaultLiveTitle = settings.title;
      }

      if (settings.categoryType) {
        update.categoryType = settings.categoryType;
        if (settings.categoryId) {
          update.categoryId = settings.categoryId;
        }
      }

      if (settings.tags && settings.tags.length > 0) {
        update.tags = settings.tags;
      }

      // Apply settings
      await ChzzkAPI.updateLiveSettings(update);
      await ev.action.showOk();
    } catch (error) {
      await ev.action.showAlert();
    }
  }

  /**
   * Called when settings are updated from Property Inspector
   */
  override async onDidReceiveSettings(
    ev: DidReceiveSettingsEvent<LiveSettingsActionSettings>
  ): Promise<void> {
    const settings = ev.payload.settings;
    await this.updateDisplay(ev.action, settings);
  }

  /**
   * Update the button display based on configured preset
   */
  private async updateDisplay(
    actionInstance: Action<LiveSettingsActionSettings>,
    settings: LiveSettingsActionSettings
  ): Promise<void> {
    try {
      const globalSettings = await AuthService.getGlobalSettings();

      if (!globalSettings.isAuthenticated) {
        await actionInstance.setTitle("Login\nRequired");
        return;
      }

      // Show preset name or default label
      if (settings.presetName) {
        await actionInstance.setTitle(settings.presetName);
      } else if (settings.title) {
        // Show truncated title
        const displayTitle =
          settings.title.length > 10
            ? settings.title.substring(0, 10) + "..."
            : settings.title;
        await actionInstance.setTitle(displayTitle);
      } else {
        await actionInstance.setTitle("Settings");
      }
    } catch (error) {
      await actionInstance.setTitle("Error");
    }
  }
}
