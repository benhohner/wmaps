import { Graphics, DisplayObject, Ticker } from "pixi.js";

export type ExtendedGraphics = Graphics &
  DisplayObject & {
    id?: number;
    ticker?: Ticker;
  };