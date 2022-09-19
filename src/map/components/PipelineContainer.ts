import { Graphics } from "pixi.js";

export function PipelineContainer(left: number, right: number) {
  let rectangle = new Graphics()
    .lineStyle(1, 0x000000, undefined, 1)
    .beginFill(0xffffff, 0.1)
    .drawRect(left, 2, Math.abs(left) + right, 20)
    .endFill();
  return rectangle;
}
