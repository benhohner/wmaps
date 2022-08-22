import AppSingleton from "./render/components/AppSingleton";
import { editor } from "./editor/Editor";
import "./index.css";

import { updateEditorText } from "./state/State";

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

const run = (elementId: string) => {
  updateEditorText(editor.getValue());

  // Bind app view to root html element
  document.getElementById(elementId)?.appendChild(AppSingleton.view);
  AppSingleton.resize();
};

run("app");