import { Application, Container, BitmapFont, Point } from "pixi.js";
import { FPSMonitor } from "../utilities/FPSMonitor";

import { appendText } from "../../editor/Editor";
import { getObjectID } from "../../state/State";

import { graph } from "../../state/Graph";

// @ts-ignore
Application.prototype.render = null; // Disable auto-rendering by removing the function

class AppSingleton extends Application {
  static _instance: AppSingleton;

  graphContainer = new Container();
  dirty: boolean = false;

  constructor() {
    if (AppSingleton._instance) {
      return AppSingleton._instance;
    }

    super({
      backgroundColor: 0xf0f0f0,
      antialias: true,
      autoDensity: true,
      // this may introduce coordinate bugs
      resolution: 2,
      resizeTo: document.getElementById("app")!,
    });

    AppSingleton._instance = this;

    //Set up custom renderer
    this.ticker.add(() => {
      if (this.dirty) {
        // Manually render when something has changed
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

      // Might double click more than once within 200ms
      if (
        e.detail % 1 === 0 &&
        !this.renderer.plugins.interaction.hitTest(
          new Point(e.offsetX, e.offsetY)
        )
      ) {
        // TODO: Extract to a component;
        const componentID = getObjectID();
        const mouseX = e.offsetX;
        const mouseY = e.offsetY;
        const container = document.createElement("div");
        container.className = "componentInputContainer";
        container.style.width = "auto";
        container.style.display = "flex";
        container.style.position = "fixed";
        container.style.zIndex = "100";
        container.style.left = e.offsetX + 4 + "px";
        container.style.top = e.offsetY - 17 + "px";
        const el = document.createElement("input");
        container.appendChild(el);
        el.className = "componentInput";
        el.type = "text";
        el.style.fontSize = "15px";
        el.size = 1;
        el.style.width = "8px";
        el.tabIndex = 1;

        const el2 = document.createElement("div");
        el2.style.position = "fixed";
        el2.style.visibility = "hidden";
        el2.style.whiteSpace = "pre";
        el2.style.top = "-100px";
        el2.style.fontSize = "15px";
        el2.style.fontFamily = "inherit";
        el2.style.padding = "1px 2px";
        container.appendChild(el2);
        let fieldSubmitted = false;

        const handleBlur = (e: Event) => {
          const target = e.target as HTMLInputElement;
          let componentName = "";
          if (!fieldSubmitted) {
            if (target.value && !graph.hasNode(target.value)) {
              componentName = target.value;
              const coords = this.rendererToWardleyCoords(mouseX, mouseY);
              appendText(
                `\ncomponent ${componentName} [${coords[1]}, ${coords[0]}]`
              );
            }
            target.parentNode!.parentNode!.removeChild(target.parentNode!);
          }
        };

        el.onblur = (e) => handleBlur(e);

        el.addEventListener("input", (e) => {
          let target = e.target as HTMLInputElement;
          el2.innerText = target.value;
          el.style.width = el2.clientWidth + "px";
        });

        el.onkeydown = (e) => {
          if (e.key === "Enter" || e.key === "Escape") {
            let target = e.target as HTMLInputElement;

            if (target.value && !graph.hasNode(target.value)) {
              const coords = this.rendererToWardleyCoords(mouseX, mouseY);

              appendText(
                `\ncomponent ${target.value} [${coords[1]}, ${coords[0]}]`
              );
            }

            fieldSubmitted = true; // prevent handleBlur from duplicating work
            target.parentNode!.parentNode!.removeChild(target.parentNode!);
          }
        };

        document.getElementById("app")?.append(container);
        // For some reason focus doesn't work on main thread.
        window.setTimeout(() => el.focus(), 1);
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

export default new AppSingleton();
