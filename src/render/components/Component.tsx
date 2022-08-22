import * as PIXI from "pixi.js";

import KeyPressure from "../utilities/KeyPressure";
import { setDraggable, ObjectUpdateStrategy } from "../utilities/Draggable";

import { ComponentT } from "./types";

import { state, setLineTargetA } from "../../state/State";

import { addEdge, updateComponentPosition } from "../../state/Graph";

export const Component = (
  x: number,
  y: number,
  id: number,
  nodeKey: string
) => {
  let g = new PIXI.Graphics() as ComponentT;

  g.id = id;
  g.nodeKey = nodeKey;

  g.lineStyle(0); // draw a circle, set the lineStyle to zero so the circle doesn't have an outline
  g.beginFill(0x000000, 1);
  g.drawCircle(0, 0, 7);
  g.endFill();
  g.beginFill(0xffffff, 1);
  g.drawCircle(0, 0, 6);
  g.endFill();
  g.position = new PIXI.Point(x, y);

  const text = new PIXI.BitmapText(nodeKey, {
    fontName: "TitleFont",
    fontSize: 14,
  });

  text.x = 8;
  text.y = -15;

  g.addChild(text);

  const graphUpdateStrategy: ObjectUpdateStrategy = (obj, x, y) => {
    updateComponentPosition(obj.nodeKey, x, y);
  };

  setDraggable(g, undefined, undefined, undefined, graphUpdateStrategy);

  const keydownListenerID = KeyPressure.addKeydownListener(17, () => {
    g.clear();
    g.lineStyle(0); // draw a circle, set the lineStyle to zero so the circle doesn't have an outline
    g.beginFill(0x0f30a0, 1);
    g.drawCircle(0, 0, 8);
    g.endFill();
    g.beginFill(0xffffff, 1);
    g.drawCircle(0, 0, 6);
    g.endFill();
  });

  const keyupListenerID = KeyPressure.addKeyupListener(17, () => {
    g.clear();
    g.lineStyle(0); // draw a circle, set the lineStyle to zero so the circle doesn't have an outline
    g.beginFill(0x000000, 1);
    g.drawCircle(0, 0, 7);
    g.endFill();
    g.beginFill(0xffffff, 1);
    g.drawCircle(0, 0, 6);
    g.endFill();
  });

  g.on("pointerdown", (e) => {
    // If ctrl pressed
    if (KeyPressure.keys[17]) {
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
    KeyPressure.removeKeyupListener(keyupListenerID);
    KeyPressure.removeKeydownListener(keydownListenerID);
    g.destroy(true);
  });

  return g;
};