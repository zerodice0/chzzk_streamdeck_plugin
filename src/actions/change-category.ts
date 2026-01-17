/**
 * Change Category Action
 * Changes broadcast category only
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
import { ChangeCategorySettings } from "../types";

@action({ UUID: "com.zerodice0.chzzk.change-category" })
export class ChangeCategoryAction extends SingletonAction<ChangeCategorySettings> {
  /**
   * Called when action appears on Stream Deck
   */
  override async onWillAppear(
    ev: WillAppearEvent<ChangeCategorySettings>
  ): Promise<void> {
    const settings = ev.payload.settings;
    await this.updateDisplay(ev.action, settings);
  }

  /**
   * Called when user presses the key
   */
  override async onKeyDown(
    ev: KeyDownEvent<ChangeCategorySettings>
  ): Promise<void> {
    const settings = ev.payload.settings;

    try {
      const globalSettings = await AuthService.getGlobalSettings();

      if (!globalSettings.isAuthenticated) {
        await ev.action.showAlert();
        return;
      }

      if (!settings.categoryType) {
        await ev.action.showAlert();
        return;
      }

      await ChzzkAPI.updateLiveCategory(settings.categoryType, settings.categoryId);
      await ev.action.showOk();
    } catch (error) {
      await ev.action.showAlert();
    }
  }

  /**
   * Called when settings are updated from Property Inspector
   */
  override async onDidReceiveSettings(
    ev: DidReceiveSettingsEvent<ChangeCategorySettings>
  ): Promise<void> {
    const settings = ev.payload.settings;
    await this.updateDisplay(ev.action, settings);
  }

  /**
   * Update the button display
   */
  private async updateDisplay(
    actionInstance: Action<ChangeCategorySettings>,
    settings: ChangeCategorySettings
  ): Promise<void> {
    try {
      const globalSettings = await AuthService.getGlobalSettings();

      if (!globalSettings.isAuthenticated) {
        await actionInstance.setTitle("Login\nRequired");
        return;
      }

      if (settings.categoryType) {
        const categoryLabels: Record<string, string> = {
          GAME: "Game",
          SPORTS: "Sports",
          ETC: "Etc",
        };
        await actionInstance.setTitle(categoryLabels[settings.categoryType] || settings.categoryType);
      } else {
        await actionInstance.setTitle("Category");
      }
    } catch (error) {
      await actionInstance.setTitle("Error");
    }
  }
}
