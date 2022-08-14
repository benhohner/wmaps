import React from "react";

//import { Graphics } from "react-pixi-fiber";
import { Graphics } from "@inlet/react-pixi";
import * as PIXI from "pixi.js";

import KeyPressure from "../utilities/KeyPressure";
import ObjectIDCounter from "../utilities/ObjectIDCounter";
import { setDraggable } from "../utilities/Draggable";

import LineTargetA from "../utilities/LineTargetA";

import AppSingleton from "./AppSingleton";

const makeLine = (lineTargetB: any) => {
  console.log("makeline called");
  console.log(LineTargetA.target, lineTargetB);

  if (LineTargetA.target.id === lineTargetB.id) {
    console.log("Error: Unable to create a line to a line");
    LineTargetA.target = undefined;
    return;
  }

  const graphics: PIXI.Graphics & { id?: number } = new PIXI.Graphics();
  graphics.lineStyle(1, 0x000000, 1, 0.5, false);
  graphics.moveTo(LineTargetA.target.x, LineTargetA.target.y);
  graphics.lineTo(lineTargetB.x, lineTargetB.y);
  graphics.endFill();

  graphics.zIndex = -1;

  graphics.id = ObjectIDCounter.getID();

  return graphics;
};

interface ComponentProps {
  x: number;
  y: number;
}

export const Component = ({ x, y, ...props }: ComponentProps): JSX.Element => {
  const draw = React.useCallback(
    (g) => {
      console.log(g);
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

      g.on("pointerdown", (e) => {
        if (KeyPressure.keys[17]) {
          // control
          if (LineTargetA.target && LineTargetA.target.id !== e.target.id) {
            AppSingleton.app.stage.addChild(makeLine(e.target)); // either need to do collision detection or need an event handler on the objects. If I need to do on objects, how do I make a shared context
            LineTargetA.target = undefined;
          } else {
            console.log(KeyPressure.keys);
            LineTargetA.target = e.target;
          }
        } else {
          LineTargetA.target = undefined;
        }
      });
    },
    [props]
  );

  return <Graphics draw={draw} {...props} />;
};
