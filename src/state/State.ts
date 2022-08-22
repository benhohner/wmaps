import { proxy, subscribe } from "valtio/vanilla";

import { parseInput, WardleyASTT } from "../parser/WardleyParser";
import { ComponentT } from "../render/components/types";

interface StateT {
  editor: { editorText: string };
  ast: { astArr: WardleyASTT };
  lastAst: { astArr: WardleyASTT };
  objectID: { value: number };
  interact: {
    lineTargetA: ComponentT | undefined;
  };
}
// STORE
export const state = proxy<StateT>({
  editor: { editorText: "" },
  ast: { astArr: [] },
  lastAst: { astArr: [] },
  objectID: { value: 0 },
  interact: {
    lineTargetA: undefined,
  },
});

// ACTIONS
export const updateEditorText = (text: string) => {
  state.editor.editorText = text;
};

export const getObjectID = () => {
  return state.objectID.value++;
};

export const setLineTargetA = (lineTargetA: ComponentT | undefined) => {
  state.interact.lineTargetA = lineTargetA;
};

// SUBSCRIPTIONS
subscribe(state.editor, () => {
  state.ast.astArr = parseInput(state.editor.editorText);
});

export { subscribe };