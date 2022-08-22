import { Graphics, DisplayObject, Ticker } from "pixi.js";

export type ExtendedGraphics = Graphics &
  DisplayObject & {
    id: number;
    nodeKey: string;
  };

export type ComponentT = ExtendedGraphics;

export type LineT = ExtendedGraphics & {
  ticker?: Ticker;
  updateLine: Function;
};