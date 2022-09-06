import { Application, Container, BitmapFont, Point } from "pixi.js";

import { appendText, renameComponent } from "../../editor/Editor";

import { graph } from "../../state/Graph";
import { FloatingTextInput, OnSubmitHandler } from "./FloatingTextInput";

// @ts-ignore
Application.prototype.render = null; // Disable auto-rendering by removing the function

class MapSingleton extends Application {
  static _instance: MapSingleton;
  static _parentElement: HTMLDivElement = document.getElementById(
    "map"
  ) as HTMLDivElement;

  graphContainer = new Container();
  dirty: boolean = false;

  constructor() {
    if (MapSingleton._instance) {
      return MapSingleton._instance;
    }

    super({
      backgroundColor: 0xf0f0f0,
      antialias: true,
      autoDensity: true,
      // this may introduce coordinate bugs
      resolution: 2,
      resizeTo: MapSingleton._parentElement,
    });

    MapSingleton._instance = this;

    //Set up custom renderer
    this.ticker.add(() => {
      // Manually render when something has changed
      if (this.dirty) {
        this.renderer.render(this.stage);
        this.dirty = false;
      }
    });

    // Create a font for usage
    BitmapFont.from(
      "TitleFont",
      {
        fill: "#000000",
        // supersize font based on dpr
        fontSize: 16 * this.renderer.resolution,
        fontWeight: "normal",
      },
      {
        chars:
          "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789~1234567890!@#$%^&?*-=_+()[]{}<>,./;':\"\\| ",
      }
    );

    // A container to hold all components, lines, text
    this.stage.addChild(this.graphContainer);
    this.graphContainer.sortableChildren = true; // make zIndex work

    // FPS Monitor
    // this.stage.addChild(new FPSMonitor());

    this.view.addEventListener("mousedown", (e: MouseEvent) => {
      // TODO: Use me to get rid of endless listeners components?
      // console.log(
      //   this.renderer.plugins.interaction.hitTest(
      //     new Point(e.offsetX, e.offsetY)
      //     )
      // );

      const element = this.renderer.plugins.interaction.hitTest(
        new Point(e.offsetX, e.offsetY)
      );

      if (e.detail % 1 === 0 && !element) {
        const mouseX = e.offsetX;
        const mouseY = e.offsetY;

        const handleInputSubmit: OnSubmitHandler = (e) => {
          const target = e.target as HTMLInputElement;
          if (!graph.hasNode(target.value)) {
            const coords = this.rendererToWardleyCoords(mouseX, mouseY);
            appendText(
              `\ncomponent ${target.value} [${coords[1]}, ${coords[0]}]`
            );
          } else {
            console.error(
              "ComponentRenameError: the new name for the component already exists in the map."
            );
          }
        };

        FloatingTextInput(
          MapSingleton._parentElement,
          mouseX,
          mouseY,
          handleInputSubmit
        );
      } else if (e.detail % 2 === 0 && element) {
        const oldKey = element.nodeKey;

        // Make sure we're clicking on a Component
        if (oldKey) {
          const mouseX = e.offsetX;
          const mouseY = e.offsetY;

          const handleInputSubmit: OnSubmitHandler = (e) => {
            const target = e.target as HTMLInputElement;
            if (!graph.hasNode(target.value)) {
              renameComponent(oldKey, target.value);
            }
          };

          FloatingTextInput(
            MapSingleton._parentElement as HTMLDivElement,
            mouseX,
            mouseY,
            handleInputSubmit,
            oldKey
          );
        }
      }
    });
  }

  wardleyToRendererCoords(x: number, y: number) {
    return [
      (x * this.renderer.width) / this.renderer.resolution,
      ((1 - y) * this.renderer.height) / this.renderer.resolution,
    ];
  }

  rendererToWardleyCoords(x: number, y: number) {
    return [
      ((1 / this.renderer.width) * this.renderer.resolution * x).toFixed(3),
      (1 - (1 / this.renderer.height) * this.renderer.resolution * y).toFixed(
        3
      ),
    ];
  }
}

export default new MapSingleton();
