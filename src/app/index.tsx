import ReactDOM from "react-dom";

import MapSingleton from "../map/components/MapSingleton";

import { editorView } from "../editor/Editor";
import { ProjectMenu } from "../menu";

import { setEditorText } from "../state/State";

import { initializeHistoryMonkeypatch } from "./HistoryMonkeypatch";
import { initializePanelResizer } from "./components/PanelResizer";
import { initializeUserEvents } from "./UserEvents";

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

initializeHistoryMonkeypatch();

initializeUserEvents();

const run = (elementId: string) => {
  initializePanelResizer(document.getElementById("editorContainer"));

  setEditorText(editorView.state.doc.toString());

  // Bind app view to root html element
  document.getElementById(elementId)?.appendChild(MapSingleton.view);

  MapSingleton.handleResize();

  // Render once even if graph is empty
  MapSingleton.dirty = true;
};

run("map");

ReactDOM.render(<ProjectMenu />, document.getElementById("projectMenu"));
