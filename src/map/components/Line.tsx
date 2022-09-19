import { Graphics } from "pixi.js";

import { LineT } from "./types";

export const Line = (
  componentAx: number,
  componentAy: number,
  componentBx: number,
  componentBy: number,
  nodeKey: string
): LineT => {
  const g = new Graphics() as LineT;

  g.lineStyle(1, 0x000000, undefined, 0.5);
  g.moveTo(componentAx, componentAy);
  g.lineTo(componentBx, componentBy);
  g.endFill();

  g.zIndex = -1;
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

  g.on("removed", () => g.destroy());

  return g;
};
