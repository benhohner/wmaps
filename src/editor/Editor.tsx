import * as monaco from "monaco-editor";
import debounce from "lodash/debounce";

import { updateEditorText } from "../state/State";
import { truncate } from "lodash";

monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
  noSyntaxValidation: true,
  noSemanticValidation: true,
  noSuggestionDiagnostics: true,
});

// monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
//   // Remove autocompletions
//   noLib: true,
//   types: undefined
// });

// EDITOR
export const editor = monaco.editor.create(document.getElementById("editor")!, {
  value:
    localStorage.getItem("editorText") ||
    "component client [0.99, 0.45]\ncomponent wellbeing [0.91, 0.67]\ncomponent emotional expression [0.69, 0.25] \ncomponent healthy belief systems [0.69, 0.68] \ncomponent habits [0.47, 0.56] \ncomponent exercise [0.29, 0.53]\ncomponent diet [0.31, 0.63]\ncomponent self care [0.27, 0.41]\nclient->wellbeing\nwellbeing->emotional expression\nwellbeing->healthy belief systems\nwellbeing->habits\nhabits->diet\nhabits->exercise\nhabits->self care",
  language: "typescript",
  theme: "vs-dark",
  automaticLayout: true,
});

// Save editor state to browser storage before navigating away
window.addEventListener("beforeunload", function (e) {
  localStorage.setItem("editorText", editor.getValue());
});

const handleEditorChange = debounce(() => {
  updateEditorText(editor.getValue());
}, 300);

editor.getModel()!.onDidChangeContent((event) => {
  handleEditorChange();
});
