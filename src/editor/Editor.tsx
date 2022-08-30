import * as Y from "yjs";
import * as monaco from "monaco-editor";
import { WebrtcProvider } from "y-webrtc";
import { MonacoBinding } from "y-monaco";
import debounce from "lodash/debounce";

import { updateEditorText } from "../state/State";
import AppSingleton from "../render/components/AppSingleton";
import { Object } from "lodash";

const ydoc = new Y.Doc();
const provider = new WebrtcProvider("wardley", ydoc, {
  password: "isnh388u3unhuie",
  signaling: [
    "wss://signaling.yjs.dev",
    "wss://y-webrtc-signaling-us.herokuapp.com",
    "wss://y-webrtc-signaling-eu.herokuapp.com",
  ],
});
const type = ydoc.getText("wardley");

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
    // localStorage.getItem("editorText") ||
    "component client [0.99, 0.45]\ncomponent wellbeing [0.91, 0.67]\ncomponent emotional expression [0.69, 0.25] \ncomponent healthy belief systems [0.69, 0.68] \ncomponent habits [0.47, 0.56] \ncomponent exercise [0.29, 0.53]\ncomponent diet [0.31, 0.63]\ncomponent self care [0.27, 0.41]\nclient->wellbeing\nwellbeing->emotional expression\nwellbeing->healthy belief systems\nwellbeing->habits\nhabits->diet\nhabits->exercise\nhabits->self care",
  language: "typescript",
  theme: "vs",
  automaticLayout: true,
  lineNumbersMinChars: 4,
  renderLineHighlightOnlyWhenFocus: true,
  minimap: { enabled: false },
  bracketPairColorization: {
    enabled: true,
    independentColorPoolPerBracketType: true,
  },
  wordWrap: "bounded",
});

const newModel = monaco.editor.createModel("", "typescript");
newModel.setEOL(0);
editor.setModel(newModel);

const monacoBinding = new MonacoBinding(
  type,
  editor.getModel()!,
  new Set([editor]),
  provider.awareness
);

provider.on("synced", (synced: any) => {
  // NOTE: This is only called when a different browser connects to this client
  // Windows of the same browser communicate directly with each other
  // Although this behavior might be subject to change.
  // It is better not to expect a synced event when using y-webrtc
  console.log("synced!", synced);
});

export const appendText = (text: string) => {
  const lineCount = editor.getModel()!.getLineCount();
  const lastLineLength = editor.getModel()!.getLineMaxColumn(lineCount);

  const range = new monaco.Range(
    lineCount,
    lastLineLength,
    lineCount,
    lastLineLength
  );

  editor.executeEdits("", [{ range, text }]);
  editor.pushUndoStop();
};

export const replaceCoordinates = (
  componentName: string,
  x: number,
  y: number
) => {
  const matches = editor
    .getModel()!
    .findMatches(
      `[ \t]*component[ \t]+${componentName}([^\/]*)`,
      true,
      true,
      false,
      null,
      true
    );

  if (matches.length < 1) {
    throw new Error(
      `Error: "${componentName}" not found in text document. State sync lost or regex error.`
    );
  }

  var coords = AppSingleton.rendererToWardleyCoords(x, y);

  editor.executeEdits("", [
    {
      range: matches[0].range,
      text: `component ${componentName} [${coords[1]}, ${coords[0]}]${
        matches[0].matches!.length > 1 ? " " : ""
      }`,
    },
  ]);
  editor.pushUndoStop();
};

// Save editor state to browser storage before navigating away
window.addEventListener("beforeunload", function (e) {
  localStorage.setItem("editorText", editor.getValue());
});

const handleEditorChange = debounce(() => {
  updateEditorText(editor.getValue());
}, 32);

editor.getModel()!.onDidChangeContent((event) => {
  handleEditorChange();
});
