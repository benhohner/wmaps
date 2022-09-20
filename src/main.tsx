import throttle from "lodash/throttle";

import MapSingleton from "./map/components/MapSingleton";

import { editorView, undoManager } from "./editor/Editor";

import { rerenderGraph } from "./state/Graph";
import { setEditorText } from "./state/State";

import "./index.css";

/**
 * Principles,
 * 1. One way state binding
 * mark each place in app with a state change
 * Make it update data structure
 * Make data structure attatch component to app on creation
 * make data structure rerender on change
 *
 *
 * Order of initialization:
 * 1. Graph
 * 2. State
 * 3. Editor
 * 4. App
 */

const panel = document.getElementById("editorContainer");
const resizeDiv = document.getElementById("resize");

let initialMouseX: number;
let lastMouseX: number;
const initialCssPanelWidth: number = panel!.clientWidth;
let lastPanelWidth: number = initialCssPanelWidth;
// TODO: add to state
let collapsed: boolean = false;
let wasResizing: boolean = false;

function resize(event: MouseEvent) {
  event.preventDefault();
  const deltaX = lastMouseX - event.x;
  if (deltaX) {
    const newWidth = parseInt(getComputedStyle(panel!, "").width) + deltaX;

    panel!.style.width = newWidth + "px";

    if (newWidth > 40) {
      collapsed = false;
    }

    wasResizing = true;
    onResize();
    lastMouseX = event.x;
  }
}

document!.addEventListener(
  "mousedown",
  function (event) {
    const resizeBounds = resizeDiv!.getBoundingClientRect();

    if (
      event.x >= Math.floor(resizeBounds!.left) &&
      event.x <= Math.ceil(resizeBounds!.right)
    ) {
      event.preventDefault();

      document.body.style.cursor = "ew-resize";

      initialMouseX = event.x;
      lastMouseX = initialMouseX;

      document.addEventListener("mousemove", resize, false);
    }
  },
  false
);

document.addEventListener(
  "mouseup",
  function (event: MouseEvent) {
    document.body.style.cursor = "auto";
    document.removeEventListener("mousemove", resize, false);

    if (wasResizing) {
      if (panel!.clientWidth < 41) {
        panel!.style.width = "1px";
        collapsed = true;

        lastPanelWidth = initialCssPanelWidth;
        onResize();
      } else {
        lastPanelWidth = panel!.clientWidth;
      }
      wasResizing = false;
    } else {
      // if click and not drag
      if (event.x === lastMouseX) {
        // reset if it's too small in case someone tried dragging but failed
        if (collapsed) {
          panel!.style.width = lastPanelWidth + "px";
        } else {
          panel!.style.width = "1px";
        }

        collapsed = !collapsed;

        lastMouseX = 0; // Prevent further toggling if the mouse hasn't moved.
        onResize();
      }
    }
  },
  false
);

// Resize container on window resize
const onResize = throttle(() => {
  MapSingleton.resize();
  rerenderGraph();
}, 32);
window.addEventListener("resize", onResize);

const handleHotkeys = (e: KeyboardEvent) => {
  if (e.ctrlKey && !(e.target as Element).classList.contains("cm-content")) {
    switch (e.key) {
      case "Z":
        undoManager.redo();
        break;
      case "z":
        undoManager.undo();
        break;
      case "y":
        undoManager.redo();
        break;
    }
  }
};

// bind editor commands to entire window
window.addEventListener("keydown", handleHotkeys);

const run = (elementId: string) => {
  setEditorText(editorView.state.doc.toString());

  // Bind app view to root html element
  document.getElementById(elementId)?.appendChild(MapSingleton.view);
  onResize();

  // Render once even if graph is empty
  MapSingleton.dirty = true;
};

run("map");
