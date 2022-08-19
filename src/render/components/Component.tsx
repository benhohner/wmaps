import * as PIXI from "pixi.js";

import KeyPressure from "../utilities/KeyPressure";
import ObjectIDCounter from "../../state/utilities/ObjectIDCounter";
import { setDraggable } from "../utilities/Draggable";

import LineTargetA from "../utilities/LineTargetA";

import AppSingleton from "./AppSingleton";

export type ExtendedGraphics = PIXI.Graphics &
  PIXI.DisplayObject & {
    id?: number;
    ticker?: PIXI.Ticker;
  };

export const Line = (
  componentA: ExtendedGraphics,
  componentB: ExtendedGraphics
): ExtendedGraphics => {
  const graphics: ExtendedGraphics = new PIXI.Graphics();
  graphics.lineStyle(1, 0x000000, 1, 0.5, false);
  graphics.moveTo(componentA.x, componentA.y);
  graphics.lineTo(componentB.x, componentB.y);
  graphics.endFill();

  graphics.zIndex = -1;

  graphics.id = ObjectIDCounter.getID();

  // STATE: kind of, at least updates here
  graphics.ticker = AppSingleton.app.ticker.add((delta: number) => {
    graphics.clear();
    graphics.lineStyle(1, 0x000000, 1, 0.5, false);
    graphics.moveTo(componentA.x, componentA.y);
    graphics.lineTo(componentB.x, componentB.y);
    graphics.endFill();
  });

  return graphics;
};

const makeLine = (lineTargetB: any) => {
  // Don't allow connecting component to itself
  if (LineTargetA.target.id === lineTargetB.id) {
    LineTargetA.target = undefined;
    return;
  }

  return Line(LineTargetA.target, lineTargetB);
};

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
      if (LineTargetA.target && LineTargetA.target.id !== e.target.id) {
        // STATE: add a new line, change to add an edge
        AppSingleton.app.stage.addChild(makeLine(e.target)); // either need to do collision detection or need an event handler on the objects. If I need to do on objects, how do I make a shared context
        LineTargetA.target = undefined;
      } else {
        LineTargetA.target = e.target;
      }
    } else {
      LineTargetA.target = undefined;
    }
  });

  return g;
};