import { Graphics } from "pixi.js";

export function PipelineContainer(width: number) {
  let rectangle = new Graphics()
    .lineStyle(1, 0x000000, undefined, 1)
    .beginFill(0xffffff, 0.1)
    .drawRect(0, 2, width, 20)
    .endFill();
  return rectangle;
}
