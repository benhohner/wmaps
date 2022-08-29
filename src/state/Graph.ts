import isEqual from "lodash/isEqual";

import Graph from "graphology";

import AppSingleton from "../render/components/AppSingleton";
import { Component } from "../render/components/Component";
import { Line } from "../render/components/Line";
import { ComponentT, LineT } from "../render/components/types";

import { state, subscribe, getObjectID, setLineTargetA } from "./State";
import { BaseWardleyVisitor, parseInputToCST } from "../parser/WardleyParser";

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
  AppSingleton.dirty = true;
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
    AppSingleton.dirty = true;
    graph.forEachEdge(nodeKey, updateEdgePosition);
  }
};

export const addEdge = (componentAKey: string, componentBKey: string) => {
  let componentA: NodeAttributes | undefined;
  let componentB: NodeAttributes | undefined;

  try {
    componentA = graph.getNodeAttributes(componentAKey);
  } catch (error) {
    console.log(graph.nodes());

    console.error(
      `Node ${componentAKey} not found. Check to make sure it's declared in the graph.\n${error}`
    );
  }
  try {
    componentB = graph.getNodeAttributes(componentBKey);
  } catch (error) {
    console.log(graph.nodes());
    console.error(
      `Node ${componentBKey} not found. Check to make sure it's declared in the graph.\n${error}`
    );
  }

  if (!(componentA || componentB)) {
    return;
  }

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
    AppSingleton.dirty = true;

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
  AppSingleton.dirty = true;
};

// SUBSCRIPTIONS
export class WardleyVisitorToGraph extends BaseWardleyVisitor {
  // Local reference to graph for speed
  graph: WardleyGraph;

  constructor(graph: WardleyGraph) {
    super();

    this.graph = graph;

    // The "validateVisitor" method is a helper utility which performs static analysis
    // to detect missing or redundant visitor methods
    this.validateVisitor();
  }

  /* Visit methods */
  wardley(ctx: any) {
    if (ctx.declaration) {
      // Don't keep reference to deleted item
      setLineTargetA(undefined);

      graph.clear();

      const edgeDecs: any = [];

      ctx.declaration.forEach((dec: any) => {
        const edgeDec = this.visit(dec);

        if (edgeDec) {
          edgeDecs.push(edgeDec);
        }
      });

      // render edges last to allow edges to be declared before components
      edgeDecs.forEach((edgeDec: any) => {
        addEdge(edgeDec.lhs, edgeDec.rhs);
      });
    }
  }

  declaration(ctx: any) {
    if (ctx.componentDeclaration) {
      this.visit(ctx.componentDeclaration[0]);
      return;
    } else if (ctx.edgeDeclaration) {
      // we only return edgeDecs because they need to be created last
      // so pass them to the top level function which will run last
      return this.visit(ctx.edgeDeclaration[0]);
    }
  }

  edgeDeclaration(ctx: any) {
    return {
      type: "edgeDeclaration",
      lhs: ctx.LHS[0].image,
      rhs: ctx.RHS[0].image,
    };
  }

  componentDeclaration(ctx: any) {
    if (ctx.coordinates) {
      const coordinates = this.visit(ctx.coordinates[0]);

      // wardleyscript has coordinates backwards
      const rendererCoords = AppSingleton.wardleyToRendererCoords(
        coordinates[1],
        coordinates[0]
      );

      addComponent(
        rendererCoords[0],
        rendererCoords[1],
        ctx.StringLiteral[0].image
      );
    } else {
      addComponent(40, 40, ctx.StringLiteral[0].image);
    }
  }

  coordinates(ctx: any) {
    return [Number(ctx.LHS[0].image), Number(ctx.RHS[0].image)];
  }
}

const visitorInstance = new WardleyVisitorToGraph(graph);

export const rerenderGraph = () =>
  visitorInstance.visit(parseInputToCST(state.editor.editorText));

// SUBSCRIPTIONS
subscribe(state.editor, () => {
  // TODO: read lazy update checking to see if text makes a different graph than before
  // Rerendering each time might be faster than diffing graph?

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
