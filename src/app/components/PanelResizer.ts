import MapSingleton from "../../map/components/MapSingleton";

export const initializePanelResizer = (resizedComponent: any) => {
  const panel = resizedComponent;
  const resizeDiv = document.getElementById("resize");

  let initialMouseX: number;
  let lastMouseX: number;
  const initialCssPanelWidth: number = panel!.clientWidth;
  let lastPanelWidth: number = initialCssPanelWidth;
  // TODO: add to state
  let collapsed: boolean = false;
  let wasResizing: boolean = false;

  function resize(event: MouseEvent) {
    event.preventDefault();
    const deltaX = lastMouseX - event.x;
    if (deltaX) {
      const newWidth = parseInt(getComputedStyle(panel!, "").width) + deltaX;

      panel!.style.width = newWidth + "px";

      if (newWidth > 40) {
        collapsed = false;
      }

      wasResizing = true;
      MapSingleton.handleResize();
      lastMouseX = event.x;
    }
  }

  document!.addEventListener(
    "mousedown",
    function (event) {
      const resizeBounds = resizeDiv!.getBoundingClientRect();

      if (
        event.x >= Math.floor(resizeBounds!.left) &&
        event.x <= Math.ceil(resizeBounds!.right)
      ) {
        event.preventDefault();

        document.body.style.cursor = "ew-resize";

        initialMouseX = event.x;
        lastMouseX = initialMouseX;

        document.addEventListener("mousemove", resize, false);
      }
    },
    false
  );

  document.addEventListener(
    "mouseup",
    function (event: MouseEvent) {
      document.body.style.cursor = "auto";
      document.removeEventListener("mousemove", resize, false);

      if (wasResizing) {
        if (panel!.clientWidth < 41) {
          panel!.style.width = "1px";
          collapsed = true;

          lastPanelWidth = initialCssPanelWidth;
          MapSingleton.handleResize();
        } else {
          lastPanelWidth = panel!.clientWidth;
        }
        wasResizing = false;
      } else {
        // if click and not drag
        if (event.x === lastMouseX) {
          // reset if it's too small in case someone tried dragging but failed
          if (collapsed) {
            panel!.style.width = lastPanelWidth + "px";
          } else {
            panel!.style.width = "1px";
          }

          collapsed = !collapsed;

          lastMouseX = 0; // Prevent further toggling if the mouse hasn't moved.
          MapSingleton.handleResize();
        }
      }
    },
    false
  );
};
