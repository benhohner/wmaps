import * as PIXI from "pixi.js";

import KeyPressure from "../utilities/KeyPressure";
import ObjectIDCounter from "../../state/utilities/ObjectIDCounter";
import { setDraggable } from "../utilities/Draggable";

import { ExtendedGraphics } from "./types";

import LineTargetA from "../utilities/LineTargetA";
import { Line } from "./Line";

import AppSingleton from "./AppSingleton";

export const Component = (x: number, y: number) => {
  let g: ExtendedGraphics = new PIXI.Graphics();

  g.lineStyle(0); // draw a circle, set the lineStyle to zero so the circle doesn't have an outline
  g.beginFill(0x000000, 1);
  g.drawCircle(0, 0, 7);
  g.endFill();
  g.beginFill(0xffffff, 1);
  g.drawCircle(0, 0, 6);
  g.endFill();
  g.position = new PIXI.Point(x, y);
  g.id = ObjectIDCounter.getID();

  setDraggable(g);

  KeyPressure.addKeydownListener(17, () => {
    g.clear();
    g.lineStyle(0); // draw a circle, set the lineStyle to zero so the circle doesn't have an outline
    g.beginFill(0x0f30a0, 1);
    g.drawCircle(0, 0, 8);
    g.endFill();
    g.beginFill(0xffffff, 1);
    g.drawCircle(0, 0, 6);
    g.endFill();
  });

  KeyPressure.addKeyupListener(17, () => {
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
      if (!LineTargetA.target) {
        LineTargetA.target = e.target;
        return;
      } else if (LineTargetA.target && LineTargetA.target.id !== e.target.id) {
        // ^ If not trying to link a component to itself
        AppSingleton.graphContainer.addChild(
          Line(LineTargetA.target, e.target)
        );
      }
    }
    // Reset if clicking self component or not holding control
    LineTargetA.target = undefined;
  });

  return g;
};