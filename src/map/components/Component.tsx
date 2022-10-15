import { Graphics, Point, BitmapText, Container } from "pixi.js";

import { Rectangle } from "./Rectangle";

import { ComponentT } from "./types";

import {
  state,
  setInitialLinkTarget,
  subscribe,
  StateT,
} from "../../state/State";

import { graph } from "../../state/Graph";

import { appendText } from "../../editor/Editor";

import MapSingleton from "./MapSingleton";
import { PipelineContainer } from "./PipelineContainer";

const componentColors = {
  normalBackground: 0xffffff,
  selectedBorder: 0x9b5af9,
  untargetedBorder: 0x000000,
  targetableBorder: 0x059669,
  targetedBorder: 0x6ee7b7,
};

type ComponentStyles = "normal" | "pipeline";
type InteractionModes = "default" | "selected" | "targetable" | "targeted";

type IComponentStyleMap = {
  [key in ComponentStyles]: {
    [mode in InteractionModes]: (g: Graphics) => void;
  };
};

const componentStyleMap: IComponentStyleMap = {
  normal: {
    default: (g: Graphics): void => {
      g.clear()
        .lineStyle(1, componentColors.untargetedBorder, undefined, 1)
        .beginFill(componentColors.normalBackground, 1)
        .drawCircle(0, 0, 6)
        .endFill();
    },
    selected: (g: Graphics): void => {
      g.clear()
        .lineStyle(2, componentColors.selectedBorder, undefined, 1)
        .beginFill(componentColors.normalBackground, 1)
        .drawCircle(0, 0, 6)
        .endFill();
    },
    targetable: (g: Graphics): void => {
      g.clear()
        .lineStyle(2, componentColors.targetableBorder, undefined, 1)
        .beginFill(componentColors.normalBackground, 1)
        .drawCircle(0, 0, 6)
        .endFill();
    },
    targeted: (g: Graphics): void => {
      g.clear()
        .lineStyle(2, componentColors.targetedBorder, undefined, 1)
        .beginFill(componentColors.normalBackground, 1)
        .drawCircle(0, 0, 6)
        .endFill();
    },
  },
  pipeline: {
    default: (g: Graphics): void => {
      g.clear()
        .lineStyle(1, componentColors.untargetedBorder, undefined, 1)
        .beginFill(componentColors.normalBackground)
        .drawRect(-5, -5, 10, 10)
        .endFill();
    },
    selected: (g: Graphics): void => {
      g.clear()
        .lineStyle(2, componentColors.selectedBorder, undefined, 1)
        .beginFill(componentColors.normalBackground)
        .drawRect(-5.5, -5.5, 11, 11)
        .endFill();
    },
    targetable: (g: Graphics): void => {
      g.clear()
        .lineStyle(2, componentColors.targetableBorder, undefined, 1)
        .beginFill(componentColors.normalBackground)
        .drawRect(-5.5, -5.5, 11, 11)
        .endFill();
    },
    targeted: (g: Graphics): void => {
      g.clear()
        .lineStyle(2, componentColors.targetedBorder, undefined, 1)
        .beginFill(componentColors.normalBackground)
        .drawRect(-5.5, -5.5, 11, 11)
        .endFill();
    },
  },
};

interface IComponentConfig {
  x: number;
  y: number;
  name: string;
  children?: Object[];
  parent?: Object;
  labelX?: number;
  labelY?: number;
}

export const Component = (config: IComponentConfig) => {
  let { x, y, name, parent, labelX, labelY, children } = config;

  let lastComponentStyle: ComponentStyles | undefined = undefined;
  let componentStyle: ComponentStyles = "normal";
  if (children) {
    componentStyle = "pipeline";
  }

  let component = new Container() as ComponentT;

  component.interactive = true;
  component.buttonMode = true;

  component.nodeKey = name;

  // NOTE: This will break if we enable nested pipelines
  if (parent) {
    y += 12;
    component.zIndex = 1;
  }

  component.position = new Point(x, y);

  // Build pipeline container
  if (children && children.length > 0) {
    let left: number = 0;
    let right: number = 0;
    children.forEach((value: any, index) => {
      let rhs: number;
      if (value.children.coordinates) {
        rhs = parseFloat(value.children.coordinates[0].children.RHS[0].image);
      } else {
        rhs = 10;
      }
      if (index === 0) {
        left = rhs;
        right = rhs;
      }
      if (rhs < left) {
        left = rhs;
      }
      if (rhs > right) {
        right = rhs;
      }
    });

    [left] = MapSingleton.wardleyToRendererCoords(left, 0);
    [right] = MapSingleton.wardleyToRendererCoords(right, 0);

    if (x < left) {
      left = x;
    }
    if (x > right) {
      right = x;
    }

    let width = right - left + 20;
    let offset = left - x - 10;

    const pipe = PipelineContainer(width);
    pipe.x = offset;
    component.addChild(pipe);
  }

  const text = new BitmapText(name, {
    fontName: "TitleFont",
    fontSize: 16,
  });
  text.x = labelX ? 9 + labelX : 9;
  text.y = labelY ? -16 + labelY : -16;
  if (children && children.length > 0 && !parent) {
    text.y = -18;
  }
  text.rotation = parent ? Math.PI / 6 : 0;

  // Add a rectangle under the text in app bg color to visually separate text
  // from lines
  const rect = Rectangle(text.x, text.y, text.width, text.height);
  rect.rotation = labelY ? Math.PI / 6 : 0;
  component.addChild(rect);

  // paint on top of rect but need text width to build rectangle
  component.addChild(text);

  // Draw the node
  let g = new Graphics();

  let lastInteractionMode: InteractionModes | undefined = undefined;
  let interactionMode: InteractionModes = "default";

  const renderComponent = (g: Graphics, state: StateT) => {
    if (state.linking.isLinkModeEnabled) {
      interactionMode = "targetable";
      if (state.linking.initialLinkTarget?.nodeKey === name) {
        interactionMode = "targeted";
      }
    } else if (state.selection.selectionItems.has(component.nodeKey)) {
      interactionMode = "selected";
    } else {
      interactionMode = "default";
    }

    // Rebuilding component is expensive, only do if component has changed
    // Note: don't need to do if switched to pipeline because that will cause
    // a rerender of the whole graph.
    if (interactionMode !== lastInteractionMode) {
      componentStyleMap[componentStyle][interactionMode](g);
      MapSingleton.dirty = true;
      lastInteractionMode = interactionMode;
    }
  };

  renderComponent(g, state);
  component.addChild(g);

  const selectionUnsub = subscribe(state.selection, () =>
    renderComponent(g, state)
  );
  const linkingUnsub = subscribe(state.linking, () =>
    renderComponent(g, state)
  );

  // TODO: Move into MapSingleton and use event delegation.
  component.on("pointerdown", (e) => {
    // If ctrl pressed
    if (state.linking.isLinkModeEnabled) {
      if (!state.linking.initialLinkTarget) {
        // Note: e.target should be the component because events don't bubble
        // in pixi
        setInitialLinkTarget(e.target); //->State
        return;
      } else if (
        state.linking.initialLinkTarget &&
        state.linking.initialLinkTarget.nodeKey !== e.target.nodeKey
      ) {
        // ^ If not trying to link a component to itself
        if (
          !graph.hasEdge(
            e.target.nodeKey,
            state.linking.initialLinkTarget.nodeKey
          )
        )
          //<-Graph
          // TODO: this string should be borrowed from Parser
          appendText(
            `\n${state.linking.initialLinkTarget.nodeKey}.${e.target.nodeKey}`
          ); //->Editor
      }
    }
    // Reset if clicking self component or not holding control
    setInitialLinkTarget(undefined); //->State
  });

  component.on("removed", () => {
    selectionUnsub();
    linkingUnsub();
    text.destroy();
    rect.destroy();
    g.destroy();
    component.destroy();
  });

  return component;
};
