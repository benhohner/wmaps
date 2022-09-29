import * as Y from "yjs";
// @ts-ignore because no typings
import { yCollab } from "y-codemirror.next";
import { WebrtcProvider } from "y-webrtc";

import { EditorState } from "@codemirror/state";
import { basicSetup, EditorView } from "codemirror";
import { keymap } from "@codemirror/view";
import { RegExpCursor } from "@codemirror/search";
import { linter, lintGutter } from "@codemirror/lint";

// @ts-ignore because no typings
import { vscodeKeymap } from "@replit/codemirror-vscode-keymap";

import debounce from "lodash/debounce";
import { matchComponentRegex, matchEdgeRegex } from "../parser/TogetherParser";

import { setEditorText } from "../state/State";
import MapSingleton from "../map/components/MapSingleton";
import { togetherScriptLinter } from "./TogetherScriptLinter";
import { generateRandomAnimal } from "../user/utilities/generateRandomAnimal";

const Theme = EditorView.theme({
  "&": {
    fontSize: "1rem",
  },
  ".cm-content": {
    fontFamily: "'JetBrains Mono', Consolas, Courier New, monospace",
    fontWeight: "400",
    cursor: "text",
  },
  ".cm-scroller": {
    fontFamily: "'JetBrains Mono', Consolas, Courier New, monospace",
    fontWeight: "400",
  },
  ".cm-gutters": {
    color: "#d0d0d0",
    backgroundColor: "transparent",
    borderRight: "none",
  },
  ".cm-gutterElement": {
    userSelect: "none",
  },
  ".cm-ySelectionInfo": {
    fontFamily: "'JetBrains Mono', Consolas, Courier New, monospace",
    fontWeight: "400",
    color: "black",
  },
});

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
const ytext = ydoc.getText();

export const multiplayerClientID = ydoc.clientID;

export const undoManager = new Y.UndoManager(ytext, { captureTimeout: 350 });

// @ts-ignore because Typing error in WebrtcProvider
const provider = new WebrtcProvider("wardley", ydoc, {
  password: "isnh388u3unhuie",
  signaling: [
    "wss://signaling.yjs.dev",
    // "wss://y-webrtc-signaling-us.herokuapp.com",
    "wss://y-webrtc-signaling-eu.herokuapp.com",
  ],
});

let username = localStorage.getItem("username");
if (!username) {
  username = generateRandomAnimal();
  localStorage.setItem("username", username);
}

window.heap.identify(username);

provider.awareness.setLocalStateField("user", {
  name: username,
  color: userColor.color,
  colorLight: userColor.light,
});

// provider.awareness.on("change", (change: any, origin: any) => {
//   console.log(change, origin);
// });

const linterExtension = linter(togetherScriptLinter());

const startState = EditorState.create({
  doc: ytext.toString(),
  extensions: [
    keymap.of(vscodeKeymap),
    basicSetup,
    linterExtension,
    lintGutter(),
    EditorView.lineWrapping,
    Theme,
    yCollab(ytext, provider.awareness, { undoManager }),
    EditorView.updateListener.of((e) => {
      if (e.docChanged) {
        handleEditorChange(e.state.doc.toString());
      }
    }),
  ],
});

export const editorView = new EditorView({
  state: startState,
  parent: document.getElementById("editor")!,
});

/* ========= Actions ========= */
export const enableErrorMode = (): void => {
  const editorDiv = document.getElementById("editor");
  editorDiv!.style.backgroundColor = "rgba(255, 0, 0, 0.05)";
};

export const disableErrorMode = (): void => {
  const editorDiv = document.getElementById("editor");
  editorDiv!.style.backgroundColor = "transparent";
};

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
    matchComponentRegex(componentName),
    {}
  );

  let changes = [];
  var coords = MapSingleton.rendererToWardleyCoords(x, y);

  for (const next of searchCursor) {
    const to =
      next.from +
      next.match.slice(1, 6).reduce((prev, current) => {
        if (current) {
          return prev + current.length;
        } else {
          return prev;
        }
      }, 0);

    changes.push({
      from: next.from,
      to,
      insert: `${next.match[1] || ""}${next.match[2]}${next.match[3] || ""}${
        next.match[4] || ""
      }[${coords[1]},${coords[0]}]`, // TODO: should be coming from Parser
    });
  }

  if (changes.length === 0) {
    throw new Error(
      `Error: "${componentName}" not found in text document. State sync lost or regex error.`
    );
  }

  editorView.dispatch({
    changes,
    selection: { anchor: changes[changes.length - 1].to },
  });
};

export const renameComponent = (oldName: string, newName: string) => {
  let changes = [];

  const componentSearchCursor = new RegExpCursor(
    editorView.state.doc,
    matchComponentRegex(oldName),
    {}
  );

  for (const next of componentSearchCursor) {
    const to =
      next.from +
      next.match.slice(2, 3).reduce((prev, current) => {
        if (current) {
          return prev + current.length;
        } else {
          return prev;
        }
      }, 0);

    changes.push({
      from: next.from,
      to,
      insert: `${newName}`,
    });
  }

  const edgeSearchCursor = new RegExpCursor(
    editorView.state.doc,
    matchEdgeRegex(oldName),
    {}
  );

  for (const next of edgeSearchCursor) {
    let from = next.from;
    let to = next.from;

    // LHS Match
    if (next.match[2]) {
      from += next.match[1] ? next.match[1].length : 0;
      to = from + next.match[2].length;

      //RHS Match
    } else if (next.match[6]) {
      from += next.match[3].length + (next.match[5] ? next.match[5].length : 0);
      to = from + next.match[6].length;
    } else {
      return;
    }

    changes.push({
      from,
      to,
      insert: newName,
    });
  }

  if (changes.length === 0) {
    throw new Error(
      `RenameComponentError: "${oldName}" not found in text document. State sync lost or regex error.`
    );
  }

  editorView.dispatch({
    changes,
  });
};

/* ======== Events ======== */
// Save editor state to browser storage before navigating away
window.addEventListener("beforeunload", function (e) {
  localStorage.setItem("editorText", editorView.state.doc.toString());
});

const handleEditorChange = debounce((text: string) => {
  setEditorText(text);
}, 32);
