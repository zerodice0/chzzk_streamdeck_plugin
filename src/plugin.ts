/**
 * CHZZK Stream Deck Plugin
 * Main entry point
 */

import streamDeck from "@elgato/streamdeck";

import { ViewerCountAction } from "./actions/viewer-count";
import { LiveSettingsAction } from "./actions/live-settings";

// Register actions
streamDeck.actions.registerAction(new ViewerCountAction());
streamDeck.actions.registerAction(new LiveSettingsAction());

// Connect to Stream Deck
streamDeck.connect();
