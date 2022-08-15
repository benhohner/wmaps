import { Component } from "./render/components/Component";

import AppSingleton from "./render/components/AppSingleton";

const run = (elementId: string) => {
  // Bind app view to root html element
  document.getElementById(elementId)?.appendChild(AppSingleton.app.view);

  // Add test circle so we know app is rendering.
  AppSingleton.app.stage.addChild(Component(10, 10));

  AppSingleton.app.renderer.view.addEventListener("mousedown", (e: any) => {
    if (e.detail % 2 === 0) {
      // Might double click twice within 200ms
      AppSingleton.app.stage.addChild(Component(e.offsetX, e.offsetY));
    }
  });
};

run("app");
