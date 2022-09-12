import { proxy, subscribe } from "valtio/vanilla";

import { ComponentT } from "../map/components/types";

import { multiplayerClientID } from "../editor/Editor";

interface StateT {
  editor: { editorText: string };
  interact: {
    lineTargetA: ComponentT | undefined;
    isTargeting: boolean;
  };
}
// STORE
export const state = proxy<StateT>({
  editor: { editorText: "" },
  interact: {
    lineTargetA: undefined,
    isTargeting: false,
  },
});

let objectID = 0;

// ACTIONS
export const setEditorText = (text: string) => {
  state.editor.editorText = text;
};

export const getObjectID = (clientID: number = multiplayerClientID) => {
  return clientID + objectID++; // <-Editor
};

export const setLineTargetA = (lineTargetA: ComponentT | undefined) => {
  state.interact.lineTargetA = lineTargetA;
};
export const setIsTargeting = (isTargeting: boolean) => {
  state.interact.isTargeting = isTargeting;
};
export { subscribe };
