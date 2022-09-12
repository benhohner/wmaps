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
import { graph, updateComponentPosition } from "../../state/Graph";

import { appendText, replaceCoordinates } from "../../editor/Editor";

import MapSingleton from "./MapSingleton";

const makeBaseComponent = (g: Graphics): void => {
  g.clear()
    .lineStyle(0)
    .beginFill(0x000000, 1)
    .drawCircle(0, 0, 7)
    .endFill()
    .beginFill(0xffffff, 1)
    .drawCircle(0, 0, 6)
    .endFill();
};

const makeTargetedComponent = (g: Graphics): void => {
  g.clear()
    .lineStyle(0)
    .beginFill(0x00ff00, 1)
    .drawCircle(0, 0, 8)
    .endFill()
    .beginFill(0xffffff, 1)
    .drawCircle(0, 0, 6)
    .endFill();
};
const makeTargetableComponent = (g: Graphics): void => {
  g.clear()
    .lineStyle(0)
    .beginFill(0x0f30a0, 1)
    .drawCircle(0, 0, 8)
    .endFill()
    .beginFill(0xffffff, 1)
    .drawCircle(0, 0, 6)
    .endFill();
};

const SelectedComponent = new Graphics();

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
  id: number,
  nodeKey: string
) => {
  // Performance optimization by localizing global?
  let kp = KeyPressure;

  let component = new Container() as ComponentT;
  component.id = id;
  component.nodeKey = nodeKey;
  component.position = new Point(x, y);
  setDraggable(component, undefined, undefined, onDragEnd, graphUpdateStrategy);

  const text = new BitmapText(nodeKey, {
    fontName: "TitleFont",
    fontSize: 16,
  });
  text.x = 9;
  text.y = -16;

  // Add a rectangle under the text in app bg color to visually separate text
  // from lines
  const rect = Rectangle(text.x, text.y, text.width, text.height);
  component.addChild(rect);

  // paint on top of rect but need text width to build rectangle
  component.addChild(text);

  let g = new Graphics();
  state.interact.isTargeting
    ? makeTargetableComponent(g)
    : makeBaseComponent(g);
  component.addChild(g);

  // TODO: Add isControl to state and remove the keydown and keyup listeners
  // Should fix bug where highlights disappear on rerender because event listeners destroyed and recreated
  const unsubscribe = subscribe(state.interact, () => {
    if (state.interact.lineTargetA?.nodeKey === nodeKey) {
      makeTargetedComponent(g);
      MapSingleton.dirty = true;
    } else if (state.interact.isTargeting) {
      makeTargetableComponent(g);
      MapSingleton.dirty = true;
    } else {
      makeBaseComponent(g);
      MapSingleton.dirty = true;
    }
  });

  const keydownListenerID = kp.addKeydownListener(17, () => {
    setIsTargeting(true);
  });

  const keyupListenerID = kp.addKeyupListener(17, () => {
    setIsTargeting(false);
  });

  // BUG: Change to container.on
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
        state.interact.lineTargetA.id !== e.target.id
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
