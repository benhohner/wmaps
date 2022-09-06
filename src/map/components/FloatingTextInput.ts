export type OnSubmitHandler = (event: KeyboardEvent | FocusEvent) => void;

export const FloatingTextInput = (
  mountPoint: HTMLElement,
  x: number,
  y: number,
  onSubmitHandler: OnSubmitHandler,
  initialText?: string
): void => {
  const container = document.createElement("div");
  container.className = "componentInputContainer";
  container.style.width = "auto";
  container.style.display = "flex";
  container.style.position = "absolute";
  container.style.zIndex = "100";
  container.style.left = x + 4 + "px";
  container.style.top = y - 23 + "px";

  const input = document.createElement("input");
  container.appendChild(input);
  input.className = "componentInput";
  input.type = "text";
  input.style.fontSize = "15px";
  input.size = 1;
  input.style.width = "8px";
  input.tabIndex = 1;

  const shadowText = document.createElement("div");
  shadowText.style.position = "fixed";
  shadowText.style.visibility = "hidden";
  shadowText.style.whiteSpace = "pre";
  shadowText.style.top = "-100px";
  shadowText.style.fontSize = "15px";
  shadowText.style.fontFamily = "inherit";
  shadowText.style.padding = "1px 2px";
  container.appendChild(shadowText);
  let fieldSubmitted = false;

  input.addEventListener("blur", (e: FocusEvent) => {
    const target = e.target as HTMLInputElement;

    if (!fieldSubmitted) {
      if (target.value) {
        onSubmitHandler(e);
      }
      target.parentNode!.parentNode!.removeChild(target.parentNode!);
    }
  });

  input.addEventListener("input", (e: Event) => {
    let target = e.target as HTMLInputElement;

    shadowText.innerText = target.value;
    input.style.width = shadowText.clientWidth + "px";
  });

  input.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === "Escape") {
      let target = e.target as HTMLInputElement;

      if (target.value) {
        onSubmitHandler(e);
      }

      fieldSubmitted = true; // prevent handleBlur from duplicating work
      target.parentNode!.parentNode!.removeChild(target.parentNode!);
    }
  });

  mountPoint.appendChild(container);

  if (initialText) {
    input.value = initialText;
    shadowText.innerText = input.value;
    input.style.width = shadowText.clientWidth + "px";
  }
  // For some reason focus doesn't work on main thread.
  window.setTimeout(() => {
    input.focus();
    input.select();
  }, 1);
};
