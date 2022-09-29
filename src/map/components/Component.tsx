import { Graphics, Point, BitmapText, Container } from "pixi.js";

import KeyPressure from "../utilities/KeyPressure";
import {
  setDraggable,
  ObjectUpdateStrategy,
  OnDragEndCallback,
  DragObject,
} from "../utilities/Draggable";

import { Rectangle } from "./Rectangle";

import { ComponentT } from "./types";

import {
  state,
  setLineTargetA,
  subscribe,
  setIsTargeting,
} from "../../state/State";
import {
  graph,
  NodeAttributes,
  updateComponentPosition,
} from "../../state/Graph";

import { appendText, replaceCoordinates } from "../../editor/Editor";

import MapSingleton from "./MapSingleton";
import { PipelineContainer } from "./PipelineContainer";

const componentColors = {
  normalBackground: 0xffffff,
  untargetedBorder: 0x000000,
  targetableBorder: 0x0f30a0,
  targetedBorder: 0x00ff00,
};

const componentStyles = {
  normal: {
    default: (g: Graphics): void => {
      g.clear()
        .lineStyle(1, componentColors.untargetedBorder, undefined, 1)
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

const graphUpdateStrategy: ObjectUpdateStrategy = (obj, x, y) => {
  updateComponentPosition(obj.nodeKey, x, y); //->Graph
};

const onDragEnd: OnDragEndCallback = (e) => {
  const obj = e.currentTarget as DragObject;

  const data = obj.dragData;
  if (!data) return;

  const dragPointerEnd = data.getLocalPosition(obj.parent);

  // Only update if actually moved
  if (
    obj.dragObjStart.x !==
      obj.dragObjStart.x + (dragPointerEnd.x - obj.dragPointerStart.x) ||
    obj.dragObjStart.y !==
      obj.dragObjStart.y + (dragPointerEnd.y - obj.dragPointerStart.y)
  ) {
    replaceCoordinates(
      obj.nodeKey,
      obj.dragObjStart.x + (dragPointerEnd.x - obj.dragPointerStart.x),
      obj.dragObjStart.y + (dragPointerEnd.y - obj.dragPointerStart.y)
    ); //->Editor
  }
};

interface IComponentConfig {
  x: number;
  y: number;
  name: string;
  type: NodeAttributes["type"];
  children?: Object[];
  parent?: Object;
  labelX?: number;
  labelY?: number;
}

export const Component = (config: IComponentConfig) => {
  let { x, y, name, parent, labelX, labelY, children } = config;

  let componentStyle: "normal" | "pipeline" = "normal";
  if (children) {
    componentStyle = "pipeline";
  }

  // Performance optimization by localizing global?
  let kp = KeyPressure;

  let component = new Container() as ComponentT;

  component.nodeKey = name;

  // NOTE: This will break if we enable nested pipelines
  if (parent) {
    y += 12;
    component.zIndex = 1;
  }

  component.position = new Point(x, y);

  setDraggable(component, undefined, undefined, onDragEnd, graphUpdateStrategy);

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

  // TODO: currently checking labelX to tell if pipeline child, will need to pass in children eventually to calculate pipeline width
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

  let g = new Graphics();
  state.interact.isTargeting
    ? componentStyles[componentStyle].targetable(g)
    : componentStyles[componentStyle].default(g);
  component.addChild(g);

  const unsubscribe = subscribe(state.interact, () => {
    if (
      state.interact.lineTargetA?.nodeKey === name &&
      state.interact.isTargeting
    ) {
      componentStyles[componentStyle].targeted(g);
      MapSingleton.dirty = true;
    } else if (state.interact.isTargeting) {
      componentStyles[componentStyle].targetable(g);
      MapSingleton.dirty = true;
    } else {
      componentStyles[componentStyle].default(g);
      MapSingleton.dirty = true;
    }
  });

  const keydownListenerID = kp.addKeydownListener(17, () => {
    setIsTargeting(true);
  });

  const keyupListenerID = kp.addKeyupListener(17, () => {
    setIsTargeting(false);
  });

  component.on("pointerdown", (e) => {
    // If ctrl pressed
    if (state.interact.isTargeting) {
      if (!state.interact.lineTargetA) {
        // Note: e.target should be the component because events don't bubble
        // in pixi
        setLineTargetA(e.target); //->State
        return;
      } else if (
        state.interact.lineTargetA &&
        state.interact.lineTargetA.nodeKey !== e.target.nodeKey
      ) {
        // ^ If not trying to link a component to itself
        if (
          !graph.hasEdge(e.target.nodeKey, state.interact.lineTargetA.nodeKey)
        )
          //<-Graph
          // TODO: this string should be borrowed from Parser
          appendText(
            `\n${state.interact.lineTargetA.nodeKey}.${e.target.nodeKey}`
          ); //->Editor
      }
    }
    // Reset if clicking self component or not holding control
    setLineTargetA(undefined); //->State
  });

  component.on("removed", () => {
    unsubscribe();
    kp.removeKeyupListener(keyupListenerID);
    kp.removeKeydownListener(keydownListenerID);
    text.destroy();
    rect.destroy();
    g.destroy();
    component.destroy();
  });

  return component;
};
