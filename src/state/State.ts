import { proxy, subscribe } from "valtio/vanilla";

import { ComponentT } from "../render/components/types";

interface StateT {
  editor: { editorText: string };
  interact: {
    lineTargetA: ComponentT | undefined;
  };
}
// STORE
export const state = proxy<StateT>({
  editor: { editorText: "" },
  interact: {
    lineTargetA: undefined,
  },
});

let objectID = 0;

// ACTIONS
export const setEditorText = (text: string) => {
  state.editor.editorText = text;
};

export const getObjectID = () => {
  return objectID++;
};

export const setLineTargetA = (lineTargetA: ComponentT | undefined) => {
  state.interact.lineTargetA = lineTargetA;
};

export { subscribe };
