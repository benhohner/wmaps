import { Graphics, Point, BitmapText } from "pixi.js";

import KeyPressure from "../utilities/KeyPressure";
import { setDraggable, ObjectUpdateStrategy } from "../utilities/Draggable";

import { ComponentT } from "./types";

import { state, setLineTargetA } from "../../state/State";

import { addEdge, updateComponentPosition } from "../../state/Graph";
import AppSingleton from "./AppSingleton";
const BaseComponent = new Graphics()
  .lineStyle(0)
  .beginFill(0x000000, 1)
  .drawCircle(0, 0, 7)
  .endFill()
  .beginFill(0xffffff, 1)
  .drawCircle(0, 0, 6)
  .endFill();

const graphUpdateStrategy: ObjectUpdateStrategy = (obj, x, y) => {
  updateComponentPosition(obj.nodeKey, x, y);
};

export const Component = (
  x: number,
  y: number,
  id: number,
  nodeKey: string
) => {
  let kp = KeyPressure;
  let g = BaseComponent.clone() as ComponentT;

  g.id = id;
  g.nodeKey = nodeKey;
  g.position = new Point(x, y);

  const text = new BitmapText(nodeKey, {
    fontName: "TitleFont",
    fontSize: 14,
  });

  text.x = 8;
  text.y = -15;

  g.addChild(text);

  setDraggable(g, undefined, undefined, undefined, graphUpdateStrategy);

  const keydownListenerID = kp.addKeydownListener(17, () => {
    g.clear();
    g.lineStyle(0); // draw a circle, set the lineStyle to zero so the circle doesn't have an outline
    g.beginFill(0x0f30a0, 1);
    g.drawCircle(0, 0, 8);
    g.endFill();
    g.beginFill(0xffffff, 1);
    g.drawCircle(0, 0, 6);
    g.endFill();
    AppSingleton.dirty = true;
  });

  const keyupListenerID = kp.addKeyupListener(17, () => {
    g.clear();
    g.lineStyle(0); // draw a circle, set the lineStyle to zero so the circle doesn't have an outline
    g.beginFill(0x000000, 1);
    g.drawCircle(0, 0, 7);
    g.endFill();
    g.beginFill(0xffffff, 1);
    g.drawCircle(0, 0, 6);
    g.endFill();
    AppSingleton.dirty = true;
  });

  g.on("pointerdown", (e) => {
    // If ctrl pressed
    if (kp.keys[17]) {
      if (!state.interact.lineTargetA) {
        setLineTargetA(e.target);
        return;
      } else if (
        state.interact.lineTargetA &&
        state.interact.lineTargetA.id !== e.target.id
      ) {
        // ^ If not trying to link a component to itself
        addEdge(state.interact.lineTargetA.nodeKey, e.target.nodeKey);
      }
    }
    // Reset if clicking self component or not holding control
    setLineTargetA(undefined);
  });

  g.on("removed", () => {
    kp.removeKeyupListener(keyupListenerID);
    kp.removeKeydownListener(keydownListenerID);
    text.destroy();
    g.destroy();
  });

  return g;
};
