 import isEqual from "lodash/isEqual";

import Graph from "graphology";
import EdgeIterationCallback from "graphology";

import AppSingleton from "../render/components/AppSingleton";
import { Component } from "../render/components/Component";
import { Line } from "../render/components/Line";
import { ComponentT, LineT } from "../render/components/types";

import { state, subscribe, getObjectID, setLineTargetA } from "./State";

type NodeAttributes = {
  type: "component";
  nodeKey: string;
  id: number;
  coordinates: { x: number; y: number };
  component: ComponentT;
  mounted: boolean;
};

type EdgeAttributes = {
  type: "edge";
  nodeKey: string;
  id: number;
  coordinates: {
    start: { x: number; y: number };
    stop: { x: number; y: number };
  };
  component: LineT;
  mounted: boolean;
};

type GraphAttributes = {
  name?: string;
};

export const graph: Graph<NodeAttributes, EdgeAttributes, GraphAttributes> =
  new Graph({ type: "undirected" });

// Allow adding to window object
// declare global {
//   interface Window {
//     graph: Graph<NodeAttributes, EdgeAttributes, GraphAttributes>;
//   }
// }
// window.graph = graph

// ACTIONS
export const addComponent = (
  x: number,
  y: number,
  name: string | undefined = undefined
) => {
  const id = getObjectID();
  const nodeKey = name || id.toString();

  const component = Component(x, y, id, nodeKey);
  component.nodeKey = nodeKey;

  graph.addNode(nodeKey, {
    nodeKey,
    type: "component",
    id,
    coordinates: { x, y },
    component,
    mounted: true,
  });

  AppSingleton.graphContainer.addChild(component);
};

export const updateComponentPosition = (
  nodeKey: string,
  x: number,
  y: number
) => {
  const node = graph.getNodeAttributes(nodeKey);
  if (node) {
    node.component.position.x = x;
    node.component.position.y = y;
    node.coordinates.x = x;
    node.coordinates.y = y;
    graph.forEachEdge(nodeKey, updateEdgePosition);
  }
};

export const addEdge = (componentAKey: string, componentBKey: string) => {
  const componentA = graph.getNodeAttributes(componentAKey);
  const componentB = graph.getNodeAttributes(componentBKey);

  if (componentA?.mounted && componentB?.mounted) {
    const componentAx = componentA.coordinates.x;
    const componentAy = componentA.coordinates.y;
    const componentBx = componentB.coordinates.x;
    const componentBy = componentB.coordinates.y;
    const id = getObjectID();
    const nodeKey = `${componentA.nodeKey}->${componentB.nodeKey}`;
    const component = Line(
      componentAx,
      componentAy,
      componentBx,
      componentBy,
      id,
      nodeKey
    );

    AppSingleton.graphContainer.addChild(component);

    graph.addEdge(componentA.nodeKey, componentB.nodeKey, {
      id,
      type: "edge",
      coordinates: {
        start: { x: componentAx, y: componentAy },
        stop: { x: componentBx, y: componentBy },
      },
      nodeKey,
      mounted: true,
      component,
    });
  }
};

const updateEdgePosition = (
  edge: string,
  attributes: EdgeAttributes,
  source: string,
  target: string,
  sourceAttributes: NodeAttributes,
  targetAttributes: NodeAttributes,
  undirected: boolean
) => {
  attributes.coordinates.start.x = sourceAttributes.coordinates.x;
  attributes.coordinates.start.y = sourceAttributes.coordinates.y;
  attributes.coordinates.stop.x = targetAttributes.coordinates.x;
  attributes.coordinates.stop.y = targetAttributes.coordinates.y;

  attributes.component.updateLine(
    attributes.coordinates.start.x,
    attributes.coordinates.start.y,
    attributes.coordinates.stop.x,
    attributes.coordinates.stop.y
  );
};

// SUBSCRIPTIONS
export const rerenderGraph = () => {
  // Don't keep reference to deleted item
  setLineTargetA(undefined);

  graph.clear();

  state.ast.astArr.forEach((dec) => {
    if (dec.type === "componentDeclaration") {
      if (dec.coordinates) {
        // wardleyscript has coordinates backwards
        const y =
          ((1 - dec.coordinates[0]) * AppSingleton.renderer.height) /
          AppSingleton.renderer.resolution;
        const x =
          (dec.coordinates[1] * AppSingleton.renderer.width) /
          AppSingleton.renderer.resolution;

        addComponent(x, y, dec.componentName);
      } else {
        addComponent(20, 20, dec.componentName);
      }
    }
  });

  state.ast.astArr.forEach((dec) => {
    if (dec.type === "edgeDeclaration") {
      addEdge(dec.lhs, dec.rhs);
    }
  });
};

subscribe(state.ast, () => {
  // Try to prevent deep object diffing as it's slow
  if (state.ast.astArr.length !== state.lastAst.astArr.length) {
    state.lastAst.astArr = state.ast.astArr;
    rerenderGraph();
    return;
  }

  for (let i = 0; i < state.ast.astArr.length; i++) {
    if (state.ast.astArr[i].type !== state.lastAst.astArr[i].type) {
      state.lastAst.astArr = state.ast.astArr;
      rerenderGraph();
      return;
    } else if (!isEqual(state.ast.astArr[i], state.lastAst.astArr[i])) {
      state.lastAst.astArr = state.ast.astArr;
      rerenderGraph();
      return;
    }
  }
});

graph.on("cleared", function () {
  AppSingleton.graphContainer.removeChildren();
});