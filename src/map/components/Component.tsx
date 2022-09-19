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

export const Component = (
  x: number,
  y: number,
  nodeKey: string,
  type: NodeAttributes["type"],
  labelX: number | undefined = undefined,
  labelY: number | undefined = undefined
) => {
  // Performance optimization by localizing global?
  let kp = KeyPressure;

  let component = new Container() as ComponentT;

  component.nodeKey = nodeKey;
  component.position = new Point(x, y);
  setDraggable(component, undefined, undefined, onDragEnd, graphUpdateStrategy);

  const text = new BitmapText(nodeKey, {
    fontName: "TitleFont",
    fontSize: 16,
  });

  // TODO: currently checking labelX to tell if pipeline child, will need to pass in children eventually to calculate pipeline width
  text.x = labelX ? 9 + labelX : 9;
  text.y = labelY ? -16 + labelY : -16;
  text.rotation = labelY ? Math.PI / 6 : 0; // HACK

  if (type === "pipeline") {
    text.y = -18;
  }

  // Add a rectangle under the text in app bg color to visually separate text
  // from lines
  const rect = Rectangle(text.x, text.y, text.width, text.height);
  rect.rotation = labelY ? Math.PI / 6 : 0;
  component.addChild(rect);

  // paint on top of rect but need text width to build rectangle
  component.addChild(text);

  if (type === "pipeline") {
    const pipe = PipelineContainer(-200, 150);
    component.addChild(pipe);
  }

  let g = new Graphics();
  state.interact.isTargeting
    ? componentStyles[type].targetable(g)
    : componentStyles[type].default(g);
  component.addChild(g);

  const unsubscribe = subscribe(state.interact, () => {
    if (
      state.interact.lineTargetA?.nodeKey === nodeKey &&
      state.interact.isTargeting
    ) {
      componentStyles[type].targeted(g);
      MapSingleton.dirty = true;
    } else if (state.interact.isTargeting) {
      componentStyles[type].targetable(g);
      MapSingleton.dirty = true;
    } else {
      componentStyles[type].default(g);
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
