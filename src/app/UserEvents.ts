import Combokeys from "combokeys";

import { isApple } from "./common/BrowserPlatform";

import MapSingleton from "../map/components/MapSingleton";
import { deleteComponents, undoManager } from "../editor/Editor";

import { setIsLinkModeEnabled, state, stopSelecting } from "../state/State";

var combokeys = new Combokeys(document.documentElement);
// Allow hotkeys when focused on inputs
combokeys.stopCallback = () => false;

const ctrlCmd = isApple ? "command" : "ctrl";

const resetInteractiveStates = () => {
  setIsLinkModeEnabled(false);
  stopSelecting();
};

export const initializeUserEvents = () => {
  combokeys.bind(`${ctrlCmd}+z`, (event) => {
    if (!(event.target as Element).classList.contains("cm-content")) {
      event.preventDefault();
      undoManager.undo();
    }
  });
  combokeys.bind([`${ctrlCmd}+shift+z`, `${ctrlCmd}+y`], (event) => {
    if (!(event.target as Element).classList.contains("cm-content")) {
      event.preventDefault();
      undoManager.redo();
    }
  });
  combokeys.bind(ctrlCmd, () => setIsLinkModeEnabled(true), "keydown");
  combokeys.bind(ctrlCmd, () => setIsLinkModeEnabled(false), "keyup");

  combokeys.bind(
    ["del", "backspace"],
    (e: KeyboardEvent) => {
      if (
        !(e.target as Element).classList.contains("cm-content") &&
        !(e.target as Element).classList.contains("componentInput")
      ) {
        // Delete item
        deleteComponents(Array.from(state.selection.selectionItems.values()));
      }
    },
    "keydown"
  );

  window.addEventListener("mouseup", MapSingleton.handleMouseUp);
  window.addEventListener("resize", MapSingleton.handleResize);
  window.addEventListener("blur", resetInteractiveStates);
};
