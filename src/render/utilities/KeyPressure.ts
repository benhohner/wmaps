type SparseBooleanArray = boolean | undefined;

type ListenerArray = [number, Function];
type ListenerMap = Map<number, ListenerArray>;

/** Gets a live updating list of all pressed keys */
class KeyPressure {
  static _instance: KeyPressure; // For tracking singleton status

  private _listenerID: number = 0;
  /**
   * A sparse array of all the keys currently pressed.
   * @type {SparseBooleanArray[]}
   * @public
   */
  public keys: SparseBooleanArray[] = [];

  private _keydownListeners: ListenerMap = new Map();
  private _keyupListeners: ListenerMap = new Map();

  constructor(scope = window) {
    // Make singleton
    if (KeyPressure._instance) {
      return KeyPressure._instance;
    }

    KeyPressure._instance = this;

    scope.onkeydown = (e) => {
      // prevent repeating by only allowing keycode once
      if (!this.keys[e.keyCode]) {
        this.keys[e.keyCode] = true;

        // Note: if lots of keycodes have listeners, this slows down
        this._keydownListeners.forEach((listener) => {
          if (listener[0] === e.keyCode) {
            listener[1]();
          }
        });
      }
    };

    scope.onkeyup = (e) => {
      this._keyupListeners.forEach((listener) => {
        if (listener[0] === e.keyCode) {
          listener[1]();
        }
      });

      this.keys[e.keyCode] = false;
    };
  }

  addKeydownListener(keyCode: number, listener: Function) {
    this._listenerID++;
    this._keydownListeners.set(this._listenerID, [keyCode, listener]);
    return this._listenerID;
  }

  removeKeydownListener(listenerID: number) {
    this._keydownListeners.delete(listenerID);
  }

  addKeyupListener(keyCode: number, listener: Function) {
    this._listenerID++;
    this._keyupListeners.set(this._listenerID, [keyCode, listener]);
    return this._listenerID;
  }

  removeKeyupListener(listenerID: number) {
    this._keyupListeners.delete(listenerID);
  }
}

export default new KeyPressure();
