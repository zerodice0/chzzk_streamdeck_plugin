/**
 * Change Title Action
 * Changes broadcast title only
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
import { ChangeTitleSettings } from "../types";

@action({ UUID: "com.zerodice0.chzzk.change-title" })
export class ChangeTitleAction extends SingletonAction<ChangeTitleSettings> {
  /**
   * Called when action appears on Stream Deck
   */
  override async onWillAppear(
    ev: WillAppearEvent<ChangeTitleSettings>
  ): Promise<void> {
    const settings = ev.payload.settings;
    await this.updateDisplay(ev.action, settings);
  }

  /**
   * Called when user presses the key
   */
  override async onKeyDown(
    ev: KeyDownEvent<ChangeTitleSettings>
  ): Promise<void> {
    const settings = ev.payload.settings;

    try {
      const globalSettings = await AuthService.getGlobalSettings();

      if (!globalSettings.isAuthenticated) {
        await ev.action.showAlert();
        return;
      }

      if (!settings.title) {
        await ev.action.showAlert();
        return;
      }

      await ChzzkAPI.updateLiveTitle(settings.title);
      await ev.action.showOk();
    } catch (error) {
      await ev.action.showAlert();
    }
  }

  /**
   * Called when settings are updated from Property Inspector
   */
  override async onDidReceiveSettings(
    ev: DidReceiveSettingsEvent<ChangeTitleSettings>
  ): Promise<void> {
    const settings = ev.payload.settings;
    await this.updateDisplay(ev.action, settings);
  }

  /**
   * Update the button display
   */
  private async updateDisplay(
    actionInstance: Action<ChangeTitleSettings>,
    settings: ChangeTitleSettings
  ): Promise<void> {
    try {
      const globalSettings = await AuthService.getGlobalSettings();

      if (!globalSettings.isAuthenticated) {
        await actionInstance.setTitle("Login\nRequired");
        return;
      }

      if (settings.title) {
        const displayTitle =
          settings.title.length > 8
            ? settings.title.substring(0, 8) + ".."
            : settings.title;
        await actionInstance.setTitle(displayTitle);
      } else {
        await actionInstance.setTitle("Title");
      }
    } catch (error) {
      await actionInstance.setTitle("Error");
    }
  }
}
