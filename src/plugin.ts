/**
 * CHZZK Stream Deck Plugin
 * Main entry point
 */

import streamDeck from "@elgato/streamdeck";

import { ViewerCountAction } from "./actions/viewer-count";
import { LiveSettingsAction } from "./actions/live-settings";
import { ChangeTitleAction } from "./actions/change-title";
import { ChangeCategoryAction } from "./actions/change-category";
import { ChangeTagsAction } from "./actions/change-tags";

// Register actions
streamDeck.actions.registerAction(new ViewerCountAction());
streamDeck.actions.registerAction(new LiveSettingsAction());
streamDeck.actions.registerAction(new ChangeTitleAction());
streamDeck.actions.registerAction(new ChangeCategoryAction());
streamDeck.actions.registerAction(new ChangeTagsAction());

// Connect to Stream Deck
streamDeck.connect();
