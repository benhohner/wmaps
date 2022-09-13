import * as Y from "yjs";
// @ts-ignore because no typings
import { yCollab } from "y-codemirror.next";
import { WebrtcProvider } from "y-webrtc";

import { EditorState } from "@codemirror/state";
import { basicSetup, EditorView } from "codemirror";
import { keymap } from "@codemirror/view";
import { RegExpCursor } from "@codemirror/search";
import { undo, redo } from "@codemirror/commands";

// @ts-ignore because no typings
import { vscodeKeymap } from "@replit/codemirror-vscode-keymap";

import debounce from "lodash/debounce";

import { matchComponentRegex, matchEdgeRegex } from "./Regexes";
import { setEditorText } from "../state/State";
import MapSingleton from "../map/components/MapSingleton";

const Theme = EditorView.theme({
  "&": {
    fontSize: "1rem",
  },
  ".cm-content": {
    fontFamily: "'JetBrains Mono', Consolas, Courier New, monospace",
    fontWeight: "400",
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
      next.match.slice(1, 5).reduce((prev, current) => {
        if (current) {
          return prev + current.length;
        } else {
          return prev;
        }
      }, 0);

    changes.push({
      from: next.from,
      to,
      insert: `${next.match[1]}${next.match[2] || ""}[${coords[1]},${
        coords[0]
      }]${next.match[4] || ""}`, // TODO: should be coming from Parser
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
      next.match.slice(1, 2).reduce((prev, current) => {
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
    let to = next.from;
    let insert = "";

    // LHS Match
    if (next.match[2]) {
      to += (next.match[1] ? next.match[1].length : 0) + next.match[2].length;
      insert = `${next.match[1] ? next.match[1] : ""}${newName}`;

      //RHS Match
    } else if (next.match[4]) {
      to +=
        2 + (next.match[3] ? next.match[3].length : 0) + next.match[4].length;
      insert = `->${next.match[3] ? next.match[3] : ""}${newName}`;
    } else {
      return;
    }

    changes.push({
      from: next.from,
      to,
      insert,
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

// Save editor state to browser storage before navigating away
window.addEventListener("beforeunload", function (e) {
  localStorage.setItem("editorText", editorView.state.doc.toString());
});

document.addEventListener("keydown", (e: KeyboardEvent) => {
  if (e.ctrlKey) {
    switch (e.key) {
      case "z":
        undo(editorView);
        break;
      case "y":
        redo(editorView);
        break;
    }
  }
});

const handleEditorChange = debounce((text: string) => {
  setEditorText(text);
}, 32);
