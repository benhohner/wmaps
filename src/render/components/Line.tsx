import { Graphics, Ticker } from "pixi.js";

import { LineT, ComponentT } from "./types";

import { getObjectID } from "../../state/State";

import AppSingleton from "./AppSingleton";

export const Line = (
  componentAx: number,
  componentAy: number,
  componentBx: number,
  componentBy: number,
  id: number,
  nodeKey: string
): LineT => {
  const g = new Graphics() as LineT;

  g.lineStyle(1, 0x000000, 1, 0.5, false);
  g.moveTo(componentAx, componentAy);
  g.lineTo(componentBx, componentBy);
  g.endFill();

  g.zIndex = -1;
  g.id = id;
  g.nodeKey = nodeKey;

  g.updateLine = (
    componentAx: number,
    componentAy: number,
    componentBx: number,
    componentBy: number
  ) => {
    g.clear();
    g.lineStyle(1, 0x000000, 1, 0.5, false);
    g.moveTo(componentAx, componentAy);
    g.lineTo(componentBx, componentBy);
    g.endFill();
  };

  //     componentA.on("pointermove", () => {
  //         updateLine(0, g, componentA, componentB)
  //     } )

  //     componentB.on("pointermove", () => {
  //         updateLine(0, g, componentA, componentB)
  //     })
  //   // STATE: kind of, at least updates here
  //   g.ticker = new Ticker();
  //   g.ticker.add((delta) => {
  //     updateLine(delta, g, componentA, componentB);
  //   });
  //   g.ticker.start();

  g.on("removed", () => {
    if (g.ticker) {
      g.ticker.stop();
      g.ticker.destroy();
    }
    g.destroy(true);
  });

  return g;
};