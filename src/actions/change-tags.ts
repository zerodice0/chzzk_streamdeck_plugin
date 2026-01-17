/**
 * Change Tags Action
 * Changes broadcast tags only
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
import { ChangeTagsSettings } from "../types";

@action({ UUID: "com.zerodice0.chzzk.change-tags" })
export class ChangeTagsAction extends SingletonAction<ChangeTagsSettings> {
  /**
   * Called when action appears on Stream Deck
   */
  override async onWillAppear(
    ev: WillAppearEvent<ChangeTagsSettings>
  ): Promise<void> {
    const settings = ev.payload.settings;
    await this.updateDisplay(ev.action, settings);
  }

  /**
   * Called when user presses the key
   */
  override async onKeyDown(
    ev: KeyDownEvent<ChangeTagsSettings>
  ): Promise<void> {
    const settings = ev.payload.settings;

    try {
      const globalSettings = await AuthService.getGlobalSettings();

      if (!globalSettings.isAuthenticated) {
        await ev.action.showAlert();
        return;
      }

      if (!settings.tags || settings.tags.length === 0) {
        await ev.action.showAlert();
        return;
      }

      await ChzzkAPI.updateLiveTags(settings.tags);
      await ev.action.showOk();
    } catch (error) {
      await ev.action.showAlert();
    }
  }

  /**
   * Called when settings are updated from Property Inspector
   */
  override async onDidReceiveSettings(
    ev: DidReceiveSettingsEvent<ChangeTagsSettings>
  ): Promise<void> {
    const settings = ev.payload.settings;
    await this.updateDisplay(ev.action, settings);
  }

  /**
   * Update the button display
   */
  private async updateDisplay(
    actionInstance: Action<ChangeTagsSettings>,
    settings: ChangeTagsSettings
  ): Promise<void> {
    try {
      const globalSettings = await AuthService.getGlobalSettings();

      if (!globalSettings.isAuthenticated) {
        await actionInstance.setTitle("Login\nRequired");
        return;
      }

      if (settings.tags && settings.tags.length > 0) {
        const tagCount = settings.tags.length;
        await actionInstance.setTitle(`Tags\n(${tagCount})`);
      } else {
        await actionInstance.setTitle("Tags");
      }
    } catch (error) {
      await actionInstance.setTitle("Error");
    }
  }
}
