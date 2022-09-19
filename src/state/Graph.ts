import Graph from "graphology";

import MapSingleton from "../map/components/MapSingleton";
import { Component } from "../map/components/Component";
import { Line } from "../map/components/Line";
import { ComponentT, LineT } from "../map/components/types";

import { state, subscribe, setLineTargetA } from "./State";
import { BaseTogetherVisitor, parseToCST } from "../parser/TogetherParser";
import { disableErrorMode, enableErrorMode } from "../editor/Editor";

export type NodeAttributes = {
  type: "normal" | "pipeline";
  nodeKey: string;
  coordinates: { x: number; y: number };
  component: ComponentT;
  mounted: boolean;
};

export type EdgeAttributes = {
  type: "edge";
  nodeKey: string;
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
  name: NodeAttributes["nodeKey"],
  type: NodeAttributes["type"],
  labelX: number | undefined = undefined,
  labelY: number | undefined = undefined
) => {
  // TODO: Find out what characters aren't possible in nodekeys and prevent them from being used in Identifiers
  const nodeKey = name;

  const component = Component(x, y, nodeKey, type, labelX, labelY); // ->Renderer
  component.nodeKey = nodeKey;
  try {
    graph.addNode(nodeKey, {
      nodeKey,
      type,
      coordinates: { x, y },
      component,
      mounted: true,
    });
  } catch (e) {
    console.error(e);
  }

  MapSingleton.graphContainer.addChild(component); // ->Renderer
  MapSingleton.dirty = true; // ->Renderer
};

export const updateComponentPosition = (
  nodeKey: string,
  x: number,
  y: number
) => {
  const node = graph.getNodeAttributes(nodeKey);
  if (node) {
    node.component.position.x = x; // ->Renderer
    node.component.position.y = y; // ->Renderer
    node.coordinates.x = x;
    node.coordinates.y = y;
    MapSingleton.dirty = true; // ->Renderer
    graph.forEachEdge(nodeKey, updateEdgePosition);
  }
};

export const addEdge = (componentAKey: string, componentBKey: string) => {
  let componentA: NodeAttributes | undefined;
  let componentB: NodeAttributes | undefined;

  try {
    componentA = graph.getNodeAttributes(componentAKey);
  } catch (error) {
    console.error(
      `Node ${componentAKey} not found. Check to make sure it's declared in the graph.\n${error}`
    );
  }
  try {
    componentB = graph.getNodeAttributes(componentBKey);
  } catch (error) {
    console.error(
      `Node ${componentBKey} not found. Check to make sure it's declared in the graph.\n${error}`
    );
  }

  if (!(componentA || componentB)) {
    return;
  }

  // If reverse edge already exists
  if (graph.hasEdge(componentBKey, componentAKey)) {
    return;
  }

  if (componentA?.mounted && componentB?.mounted) {
    const componentAx = componentA.coordinates.x;
    const componentAy = componentA.coordinates.y;
    const componentBx = componentB.coordinates.x;
    const componentBy = componentB.coordinates.y;
    const nodeKey = `${componentA.nodeKey}->${componentB.nodeKey}`;
    const component = Line(
      componentAx,
      componentAy,
      componentBx,
      componentBy,
      nodeKey
    ); // ->Renderer

    MapSingleton.graphContainer.addChild(component); // ->Renderer
    MapSingleton.dirty = true; // ->Renderer

    graph.addEdge(componentA.nodeKey, componentB.nodeKey, {
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
  ); // ->Renderer
  MapSingleton.dirty = true; // ->Renderer
};

// SUBSCRIPTIONS
export class TogetherVisitorToGraph extends BaseTogetherVisitor {
  // <-Parser
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
  default(ctx: any) {
    if (ctx.statement) {
      // Don't keep reference to deleted item
      setLineTargetA(undefined); // <-State

      graph.clear();

      const edgeDecs: any = [];

      ctx.statement.forEach((dec: any) => {
        const edgeDec = this.visit(dec);

        if (edgeDec) {
          edgeDecs.push(edgeDec);
        }
      });

      // render edges last to allow edges to be declared before components
      edgeDecs.forEach((edgeDec: any) => {
        addEdge(edgeDec.lhs, edgeDec.rhs);
      });
    } else {
      // If map is empty, rerender once
      graph.clear();
      MapSingleton.dirty = true; // ->Renderer
    }
  }

  statement(ctx: any) {
    if (ctx.componentDeclaration) {
      this.visit(ctx.componentDeclaration[0]);
      return;
    } else if (ctx.edgeDeclaration) {
      // we only return edgeDecs because they need to be created last
      // so pass them to the top level function which will run last
      return this.visit(ctx.edgeDeclaration[0]);
    }
    // TODO: add command and note
  }

  command(ctx: any) {
    return;
  }

  attributes(ctx: any) {
    return ctx.attributes;
  }

  attribute(ctx: any) {
    return;
  }

  edgeDeclaration(ctx: any) {
    return {
      type: "edgeDeclaration",
      lhs: ctx.LHS[0].image,
      rhs: ctx.RHS[0].image,
    };
  }

  componentDeclaration(
    ctx: any,
    pipelineParentY: number | undefined = undefined
  ) {
    if (ctx.coordinates) {
      const coordinates = this.visit(ctx.coordinates[0]);

      // wardleyscript has coordinates backwards
      const rendererCoords = MapSingleton.wardleyToRendererCoords(
        coordinates[1],
        pipelineParentY ? pipelineParentY : coordinates[0]
      ); // <-Renderer

      if (ctx.pipeline && ctx.pipeline[0].children?.statement?.length > 0) {
        ctx.pipeline[0].children!.statement.forEach((s: any) => {
          if (s.children && s.children.componentDeclaration?.length > 0) {
            this.visit(
              s.children.componentDeclaration[0],
              coordinates[0] - 1.7
            );
          }
        });
      }

      addComponent(
        rendererCoords[0],
        rendererCoords[1],
        ctx.Identifier[0].image,
        ctx.pipeline ? "pipeline" : "normal",
        undefined,
        pipelineParentY ? 26 : undefined
      );
    } else {
      addComponent(
        40,
        pipelineParentY ? pipelineParentY : 40,
        ctx.Identifier[0].image,
        ctx.pipeline ? "pipeline" : "normal",
        undefined,
        pipelineParentY ? 26 : undefined
      );
    }
  }

  pipeline(ctx: any) {
    return;
  }

  coordinates(ctx: any) {
    return [Number(ctx.LHS[0].image), Number(ctx.RHS[0].image)];
  }

  note(ctx: any) {
    return;
  }
}

const visitorInstance = new TogetherVisitorToGraph(graph);

let wasRerenderError = false;

export const rerenderGraph = () => {
  let isError = false;

  try {
    visitorInstance.visit(parseToCST(state.editor.editorText)); // <-State
    MapSingleton.renderIndicator.reset();
  } catch (e: any) {
    enableErrorMode(); // ->Editor

    wasRerenderError = true;
    isError = true;

    console.error(e);
  }

  if (wasRerenderError && !isError) {
    disableErrorMode(); // ->Editor

    wasRerenderError = false;
  }
};

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
}); // <-State

graph.on("cleared", function () {
  MapSingleton.graphContainer.removeChildren(); // ->Renderer
});
