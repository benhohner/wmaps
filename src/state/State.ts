import { proxy, subscribe } from "valtio/vanilla";

import { ComponentT } from "../render/components/types";

interface StateT {
  editor: { editorText: string };
  lastGraph: { lastOrder: 0; lastSize: 0 };
  interact: {
    lineTargetA: ComponentT | undefined;
  };
}
// STORE
export const state = proxy<StateT>({
  editor: { editorText: "" },
  lastGraph: { lastOrder: 0, lastSize: 0 },
  interact: {
    lineTargetA: undefined,
  },
});

let objectID = 0;

// ACTIONS
export const updateEditorText = (text: string) => {
  state.editor.editorText = text;
};

export const getObjectID = () => {
  return objectID++;
};

export const setLineTargetA = (lineTargetA: ComponentT | undefined) => {
  state.interact.lineTargetA = lineTargetA;
};

export { subscribe };
