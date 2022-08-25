import isEqual from "lodash/isEqual";

import Graph from "graphology";

import AppSingleton from "../render/components/AppSingleton";
import { Component } from "../render/components/Component";
import { Line } from "../render/components/Line";
import { ComponentT, LineT } from "../render/components/types";

import { state, subscribe, getObjectID, setLineTargetA } from "./State";
import {
  parseInputWithVisitor,
  BaseWardleyVisitor,
  parseInputToCST,
} from "../parser/WardleyParser";

export type NodeAttributes = {
  type: "component";
  nodeKey: string;
  id: number;
  coordinates: { x: number; y: number };
  component: ComponentT;
  mounted: boolean;
};

export type EdgeAttributes = {
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

export type GraphAttributes = {
  name?: string;
};

export type WardleyGraph = Graph<
  NodeAttributes,
  EdgeAttributes,
  GraphAttributes
>;

export const graph: WardleyGraph = new Graph({ type: "undirected" });

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
// export const rerenderGraph :  = () => {
//   // Don't keep reference to deleted item
//   setLineTargetA(undefined);

//   graph.clear();

// state.ast.astArr.forEach((dec) => {
//   if (dec.type === "componentDeclaration") {
//     if (dec.coordinates) {
//       // wardleyscript has coordinates backwards
//       const y =
//         ((1 - dec.coordinates[0]) * AppSingleton.renderer.height) /
//         AppSingleton.renderer.resolution;
//       const x =
//         (dec.coordinates[1] * AppSingleton.renderer.width) /
//         AppSingleton.renderer.resolution;

//       addComponent(x, y, dec.componentName);
//     } else {
//       addComponent(20, 20, dec.componentName);
//     }
//   }
// });

export class WardleyVisitorToGraph extends BaseWardleyVisitor {
  graph: WardleyGraph;

  constructor(graph: WardleyGraph) {
    super();
    this.graph = graph;
    // The "validateVisitor" method is a helper utility which performs static analysis
    // to detect missing or redundant visitor methods
    this.validateVisitor();
  }

  // TODO: Update to build graph as we go
  /* Visit methods */
  wardley(ctx) {
    if (ctx.declaration) {
      setLineTargetA(undefined);

      graph.clear();

      ctx.declaration.forEach((dec) => {
        const edgeDec = this.visit(dec);

        if (edgeDec) {
          addEdge(edgeDec.lhs, edgeDec.rhs);
        }
      });
    }
  }

  declaration(ctx) {
    if (ctx.componentDeclaration) {
      this.visit(ctx.componentDeclaration[0]);
      return false;
    } else if (ctx.edgeDeclaration) {
      // we only return edgeDecs because they need to be created last
      // so pass them to the top level function which will run last
      return this.visit(ctx.edgeDeclaration[0]);
    }
  }

  edgeDeclaration(ctx) {
    return {
      type: "edgeDeclaration",
      lhs: ctx.LHS[0].image,
      rhs: ctx.RHS[0].image,
    };
  }

  componentDeclaration(ctx) {
    if (ctx.coordinates) {
      const coordinates = this.visit(ctx.coordinates[0]);

      // wardleyscript has coordinates backwards
      const y =
        ((1 - coordinates[0]) * AppSingleton.renderer.height) /
        AppSingleton.renderer.resolution;
      const x =
        (coordinates[1] * AppSingleton.renderer.width) /
        AppSingleton.renderer.resolution;

      addComponent(x, y, ctx.StringLiteral[0].image);
    } else {
      addComponent(20, 20, ctx.StringLiteral[0].image);
    }
  }

  coordinates(ctx) {
    return [Number(ctx.LHS[0].image), Number(ctx.RHS[0].image)];
  }
}

const visitorInstance = new WardleyVisitorToGraph(graph);

export const rerenderGraph = () =>
  visitorInstance.visit(parseInputToCST(state.editor.editorText));

// SUBSCRIPTIONS
subscribe(state.editor, () => {
  // TODO: read lazy update checking to see if text makes a different graph than before

  //   if (state.ast.astArr.length !== state.lastAst.astArr.length) {
  //     state.lastAst.astArr = state.ast.astArr;
  //     rerenderGraph();
  //     return;
  //   }

  //   for (let i = 0; i < state.ast.astArr.length; i++) {
  //     if (state.ast.astArr[i].type !== state.lastAst.astArr[i].type) {
  //       state.lastAst.astArr = state.ast.astArr;
  //       rerenderGraph();
  //       return;
  //     } else if (!isEqual(state.ast.astArr[i], state.lastAst.astArr[i])) {
  //       state.lastAst.astArr = state.ast.astArr;
  //       rerenderGraph();
  //       return;
  //     }
  //   }

  rerenderGraph();
});

graph.on("cleared", function () {
  AppSingleton.graphContainer.removeChildren();
});