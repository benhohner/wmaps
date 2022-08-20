import { Graphics } from "pixi.js";

import { ExtendedGraphics } from "./types";

import AppSingleton from "./AppSingleton";
import ObjectIDCounter from "../../state/utilities/ObjectIDCounter";

export const Line = (
  componentA: ExtendedGraphics,
  componentB: ExtendedGraphics
): ExtendedGraphics => {
  const graphics: ExtendedGraphics = new Graphics();
  graphics.lineStyle(1, 0x000000, 1, 0.5, false);
  graphics.moveTo(componentA.x, componentA.y);
  graphics.lineTo(componentB.x, componentB.y);
  graphics.endFill();

  graphics.zIndex = -1;

  graphics.id = ObjectIDCounter.getID();

  // STATE: kind of, at least updates here
  graphics.ticker = AppSingleton.ticker.add((delta: number) => {
    graphics.clear();
    graphics.lineStyle(1, 0x000000, 1, 0.5, false);
    graphics.moveTo(componentA.x, componentA.y);
    graphics.lineTo(componentB.x, componentB.y);
    graphics.endFill();
  });

  return graphics;
};