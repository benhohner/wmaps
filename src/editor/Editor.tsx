import * as Y from "yjs";
// @ts-ignore because no typings
import { yCollab } from "y-codemirror.next";
import { WebrtcProvider } from "y-webrtc";

import { EditorState } from "@codemirror/state";
import { basicSetup, EditorView } from "codemirror";
import { keymap } from "@codemirror/view";
import { RegExpCursor } from "@codemirror/search";

// @ts-ignore because no typings
import { vscodeKeymap } from "@replit/codemirror-vscode-keymap";

import debounce from "lodash/debounce";

import { setEditorText } from "../state/State";
import AppSingleton from "../render/components/AppSingleton";

export const usercolors = [
  { color: "#30bced", light: "#30bced33" },
  { color: "#6eeb83", light: "#6eeb8333" },
  { color: "#ffbc42", light: "#ffbc4233" },
  { color: "#ecd444", light: "#ecd44433" },
  { color: "#ee6352", light: "#ee635233" },
  { color: "#9ac2c9", light: "#9ac2c933" },
  { color: "#8acb88", light: "#8acb8833" },
  { color: "#1be7ff", light: "#1be7ff33" },
];

export const userColor =
  usercolors[Math.floor(Math.random() * usercolors.length)];

const ydoc = new Y.Doc();
const ytext = ydoc.getText("wardleytext");
const undoManager = new Y.UndoManager(ytext);

// @ts-ignore because Typing error in WebrtcProvider
const provider = new WebrtcProvider("wardley", ydoc, {
  password: "isnh388u3unhuie",
  signaling: [
    "wss://signaling.yjs.dev",
    "wss://y-webrtc-signaling-us.herokuapp.com",
    "wss://y-webrtc-signaling-eu.herokuapp.com",
  ],
});

provider.awareness.setLocalStateField("user", {
  name: "Anonymous " + Math.floor(Math.random() * 1000),
  color: userColor.color,
  colorLight: userColor.light,
});

const startState = EditorState.create({
  doc: ytext.toString(),
  extensions: [
    keymap.of(vscodeKeymap),
    basicSetup,
    EditorView.lineWrapping,
    yCollab(ytext, provider.awareness, { undoManager }),
    EditorView.updateListener.of((e) => {
      if (e.docChanged) {
        console.log(e);
        handleEditorChange(e.state.doc.toString());
      }
    }),
  ],
});

export const editorView = new EditorView({
  state: startState,
  parent: document.getElementById("editor")!,
});

export const appendText = (text: string) => {
  editorView.dispatch({
    changes: {
      from: editorView.state.doc.length,
      insert: text,
    },
    selection: {
      anchor: editorView.state.doc.length + text.length,
    },
  });
};

export const replaceCoordinates = (
  componentName: string,
  x: number,
  y: number
) => {
  const searchCursor = new RegExpCursor(
    editorView.state.doc,
    `[ \t]*component[ \t]+${componentName}([^\r\n/]*)`
  );

  let changes = [];
  var coords = AppSingleton.rendererToWardleyCoords(x, y);
  for (const next of searchCursor) {
    console.log(next);

    changes.push({
      from: next.from,
      to: next.to,
      insert: `component ${componentName} [${coords[1]}, ${coords[0]}]${
        next.match[1] ? " " : ""
      }`,
    });
  }

  if (!changes) {
    throw new Error(
      `Error: "${componentName}" not found in text document. State sync lost or regex error.`
    );
  }

  editorView.dispatch({
    changes,
    selection: { anchor: changes[changes.length - 1].to },
  });
};

// Save editor state to browser storage before navigating away
window.addEventListener("beforeunload", function (e) {
  localStorage.setItem("editorText", editorView.state.doc.toString());
});

const handleEditorChange = debounce((text: string) => {
  setEditorText(text);
}, 32);
