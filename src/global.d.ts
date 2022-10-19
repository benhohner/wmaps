export {};

declare global {
  interface Window {
    heap: Heap;
    __APP_VERSION__: string;
  }
}
