import throttle from "lodash/throttle";
import { Application, Container, BitmapFont, Point } from "pixi.js";
import { appendText, renameComponent } from "../../editor/Editor";

import { graph, rerenderGraph } from "../../state/Graph";
import { FloatingTextInput, OnSubmitHandler } from "./FloatingTextInput";

import { RenderIndicator } from "../utilities/RenderIndicator";
import {
  clearSelection,
  replaceSelection,
  startPotentialSelect,
  startSelecting,
  state,
  stopSelecting,
  updateSelectionPoint,
  xorSelection,
  addUpdateSelectionPoint,
  startPotentialTranslation,
  stopTranslation,
  startTranslation,
  updateTranslationPoint,
} from "../../state/State";

import { SelectionHandler } from "./SelectionHandler";

// @ts-ignore
Application.prototype.render = null; // Disable auto-rendering by removing the function

class MapSingleton extends Application {
  static _instance: MapSingleton;
  static _parentElement: HTMLDivElement = document.getElementById(
    "map"
  ) as HTMLDivElement;
  renderIndicator = new RenderIndicator();

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
    if (import.meta.env.VITE_DEBUG_ENABLED === "true") {
      this.ticker.add(() => {
        // Manually render when something has changed
        if (this.dirty) {
          this.renderIndicator.onRender();
          this.renderer.render(this.stage);
          this.dirty = false;
        }
      });
    } else {
      this.ticker.add(() => {
        if (this.dirty) {
          this.renderer.render(this.stage);
          this.dirty = false;
        }
      });
    }

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
    this.stage.addChild(SelectionHandler());

    // FPS Monitor
    // this.stage.addChild(new FPSMonitor());

    // Render indicator
    if (import.meta.env.VITE_DEBUG_ENABLED === "true") {
      this.stage.addChild(this.renderIndicator.r);
    }

    this.view.addEventListener("mousedown", (e: MouseEvent) => {
      // TODO: Use me to get rid of endless listeners components?
      // console.log(
      //   this.renderer.plugins.interaction.hitTest(
      //     new Point(e.offsetX, e.offsetY)
      //     )
      // );

      const cursorPosition = new Point(e.offsetX, e.offsetY);

      const element = this.renderer.plugins.interaction.hitTest(cursorPosition);

      if (e.detail % 1 === 0) {
        /* canvas */
        if (!element) {
          if (!e.shiftKey) {
            clearSelection();
          }

          startPotentialSelect(cursorPosition);
          this.view.addEventListener("mousemove", this.handleSelectDrag, false);
          /* component */
        } else if (element.nodeKey) {
          if (!e.shiftKey) {
            if (!state.selection.selectionItems.has(element.nodeKey)) {
              replaceSelection([element.nodeKey]);
            }
            // start potential drag
            startPotentialTranslation(cursorPosition);
            this.view.addEventListener(
              "mousemove",
              this.handleSelectionTranslate,
              false
            );
          } else {
            xorSelection([element.nodeKey]);
          }
        }
      }

      if (e.detail % 2 === 0) {
        if (!element) {
          const mouseX = e.offsetX;
          const mouseY = e.offsetY;
          const handleInputSubmit: OnSubmitHandler = (e) => {
            const target = e.target as HTMLInputElement;
            if (!graph.hasNode(target.value)) {
              // <-Graph
              const coords = this.rendererToWardleyCoords(mouseX, mouseY);
              // TODO: This string should come from Parser
              appendText(`\n${target.value} [${coords[1]},${coords[0]}]`); // ->Editor
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
          ); // ->UI
        } else if (element && element.nodeKey) {
          const handleInputSubmit: OnSubmitHandler = (e) => {
            const target = e.target as HTMLInputElement;
            if (!graph.hasNode(target.value)) {
              // <-Graph
              renameComponent(element.nodeKey, target.value); // ->Editor
            }
          };

          FloatingTextInput(
            MapSingleton._parentElement as HTMLDivElement,
            cursorPosition.x,
            cursorPosition.y,
            handleInputSubmit,
            element.nodeKey
          ); // ->UI
        }
      }
    });
  }

  handleSelectionTranslate = (e: MouseEvent) => {
    let currentPosition = new Point(e.offsetX, e.offsetY);
    if (state.translateDrag.translationStartPoint) {
      if (
        !state.translateDrag.translationCurrentPoint &&
        Math.abs(
          currentPosition.x - state.translateDrag.translationStartPoint.x
        ) +
          Math.abs(
            currentPosition.y - state.translateDrag.translationStartPoint.y
          ) >=
          3
      ) {
        startTranslation(currentPosition);
      } else if (state.translateDrag.isTranslating) {
        updateTranslationPoint(currentPosition);
      }
    }
  };

  handleSelectDrag = (e: MouseEvent) => {
    let currentPosition = new Point(e.offsetX, e.offsetY);
    if (state.selectDrag.selectionStartPoint) {
      if (
        !state.selectDrag.selectionCurrentPoint &&
        Math.abs(currentPosition.x - state.selectDrag.selectionStartPoint.x) +
          Math.abs(
            currentPosition.y - state.selectDrag.selectionStartPoint.y
          ) >=
          3
      ) {
        startSelecting(currentPosition);
      } else if (state.selectDrag.selectionCurrentPoint) {
        if (e.shiftKey) {
          addUpdateSelectionPoint(currentPosition);
        } else {
          updateSelectionPoint(currentPosition);
        }
      }
    }
  };

  // using window because we want to be able to stop clicking even outside of the canvas.
  handleMouseUp = (e: MouseEvent) => {
    stopSelecting();
    stopTranslation();
    this.view.removeEventListener("mousemove", this.handleSelectDrag, false);
    this.view.removeEventListener(
      "mousemove",
      this.handleSelectionTranslate,
      false
    );
  };

  // Resize container on window resize
  // (manually place throughout app because ResizerObserver makes flashes)
  handleResize = throttle(() => {
    this.resize();
    rerenderGraph();
  }, 32);

  wardleyToRendererCoords(x: number, y: number) {
    return [
      ((x / 100) * this.renderer.width) / this.renderer.resolution,
      ((1 - y / 100) * this.renderer.height) / this.renderer.resolution,
    ];
  }

  rendererToWardleyCoords(x: number, y: number) {
    return [
      ((1 / this.renderer.width) * this.renderer.resolution * x * 100).toFixed(
        1
      ),
      (
        100 -
        (1 / this.renderer.height) * this.renderer.resolution * y * 100
      ).toFixed(1),
    ];
  }
}

export default new MapSingleton();
