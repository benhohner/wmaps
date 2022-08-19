import "./index.css";

import {
  Component,
  Line,
  ExtendedGraphics,
} from "./render/components/Component";

import AppSingleton from "./render/components/AppSingleton";
import ObjectIDCounter from "./state/utilities/ObjectIDCounter";

import PixiFps from "pixi-fps";
import { Container } from "pixi.js";

import localforage from "localforage";

import { proxy, subscribe } from "valtio/vanilla";

import * as Monaco from "monaco-editor";
import debounce from "lodash/debounce";

import Graph, { UndirectedGraph } from "graphology";

import { parseInput, WardleyASTT } from "./parser/WardleyParser";

/**
 * Principles,
 * 1. One way state binding
 * mark each place in app with a state change
 * Make it update data structure
 * Make data structure attatch component to app on creation
 * make data structure rerender on change
 *
 */

// PARSER

// STORE
const state = proxy({
  editor: { editorText: "" },
  ast: { astArr: [] as WardleyASTT },
});

subscribe(state.editor, () => {
  state.ast.astArr = parseInput(state.editor.editorText);
});

const updateEditorText = (text: string) => {
  state.editor.editorText = text;
};

// EDITOR
const editor = Monaco.editor.create(document.getElementById("editor")!, {
  value:
    (await localforage.getItem("editorText")) ||
    "component client [0.99, 0.45]\ncomponent wellbeing [0.91, 0.67]\ncomponent emotional expression [0.69, 0.25] \ncomponent healthy belief systems [0.69, 0.68] \ncomponent habits [0.47, 0.56] \ncomponent exercise [0.29, 0.53]\ncomponent diet [0.31, 0.63]\ncomponent self care [0.27, 0.41]\nclient->wellbeing\nwellbeing->emotional expression\nwellbeing->healthy belief systems\nwellbeing->habits\nhabits->diet\nhabits->exercise\nhabits->self care",
  language: "javascript",
  theme: "vs-dark",
  automaticLayout: true,
});

state.editor.editorText = editor.getValue();

// Save editor state to browser storage before navigating away
window.addEventListener("beforeunload", function (e) {
  localforage.setItem("editorText", editor.getValue());
});

const handleEditorChange = debounce(() => {
  updateEditorText(editor.getValue());
}, 300);

document.getElementById("editor")!.addEventListener("keydown", (e) => {
  handleEditorChange();
});

// GRAPH
type NodeAttributes = {
  type: "component";
  component: ExtendedGraphics;
  mounted: boolean;
};

type EdgeAttributes = {
  name?: string;
  component: ExtendedGraphics;
  mounted: boolean;
};

type GraphAttributes = {
  name?: string;
};

// Allow adding to window object
declare global {
  interface Window {
    graph: Graph<NodeAttributes, EdgeAttributes, GraphAttributes>;
  }
}

const graph: Graph<NodeAttributes, EdgeAttributes, GraphAttributes> = new Graph(
  { type: "undirected" }
);
window.graph = graph;

const run = (elementId: string) => {
  // Bind app view to root html element
  document.getElementById(elementId)?.appendChild(AppSingleton.app.view);
  AppSingleton.app.resize();

  subscribe(state.ast, () => {
    window.graph.clear();
    state.ast.astArr.forEach((declaration) => {
      if (declaration.type === "componentDeclaration") {
        let component;

        if (declaration.coordinates) {
          // wardleyscript has coordinates backwards
          const y =
            (1 - declaration.coordinates[0]) * AppSingleton.app.renderer.height;
          const x =
            declaration.coordinates[1] * AppSingleton.app.renderer.width;
          component = Component(x, y);
        } else {
          component = Component(20, 20);
        }

        component.graphKey = declaration.componentName;

        window.graph.addNode(declaration.componentName, {
          type: "component",
          component,
          mounted: false,
        });
      }
    });

    state.ast.astArr.forEach((declaration) => {
      if (declaration.type === "edgeDeclaration") {
        const lhsNode = window.graph.getNodeAttributes(declaration.lhs);
        const rhsNode = window.graph.getNodeAttributes(declaration.rhs);

        if (lhsNode?.mounted && rhsNode?.mounted) {
          window.graph.addEdge(declaration.lhs, declaration.rhs, {
            component: Line(lhsNode.component, rhsNode.component),
            mounted: false,
          });
        }
      }
    });
  });

  window.graph.on("cleared", function () {
    AppSingleton.app.stage.removeChildren();
    AppSingleton.app.stage.addChild(new PixiFps());
  });

  window.graph.on("nodeAdded", ({ attributes }) => {
    if (attributes.component && !attributes.mounted) {
      AppSingleton.app.stage.addChild(attributes.component);
      attributes.mounted = true;
    }
  });

  window.graph.on("edgeAdded", ({ source, target, attributes }) => {
    AppSingleton.app.stage.addChild(attributes.component);
    attributes.mounted = true;
  });

  AppSingleton.app.renderer.view.addEventListener("mousedown", (e: any) => {
    if (e.detail % 2 === 0) {
      // Might double click twice within 200ms
      window.graph.addNode(ObjectIDCounter.getID(), {
        type: "component",
        component: Component(e.offsetX, e.offsetY),
        mounted: false,
      });
    }
  });
};

run("app");