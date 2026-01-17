import streamDeck from "@elgato/streamdeck";

import { ChzzkAction } from "./actions/chzzk-action";

// Register the CHZZK action.
streamDeck.actions.registerAction(new ChzzkAction());

// Connect to the Stream Deck.
streamDeck.connect();
