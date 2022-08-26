import { Container, Text, Ticker, TextStyle } from "pixi.js";

export class FPSMonitor extends Container {
  private static readonly DEFAULT_FONT_SIZE: number = 30;
  private static readonly DEFAULT_FONT_COLOR: number = 0xff0000;
  private static readonly DEFAULT_HISTORY_SIZE: number = 30;

  private _fpsTextField: Text;
  private _fpsTicker: Ticker;

  private _timeValues: number[] = Array(FPSMonitor.DEFAULT_HISTORY_SIZE);
  private _lastTime: number;
  private _ringIndex: number = 0;

  constructor(style?: TextStyle) {
    super();

    const defaultStyle = new TextStyle({
      fontSize: FPSMonitor.DEFAULT_FONT_SIZE,
      fill: FPSMonitor.DEFAULT_FONT_COLOR,
    });

    this._lastTime = performance.now();

    this._fpsTextField = new Text("", {
      ...defaultStyle,
      ...style,
    } as TextStyle);

    this._fpsTicker = new Ticker();
    this._fpsTicker.add(() => {
      this.measureFPS();
    });
    this._fpsTicker.start();

    this.addChild(this._fpsTextField);
  }

  set style(style: TextStyle) {
    this._fpsTextField.style = style;
  }

  private measureFPS(): void {
    const currentTime = performance.now();
    this._timeValues[this._ringIndex] = 1000 / (currentTime - this._lastTime);

    this._ringIndex++;
    // keep DEFAULT_HISTORY_SIZE items of history and update text every DEFAULT_HISTORY_SIZE iterations
    if (this._ringIndex === FPSMonitor.DEFAULT_HISTORY_SIZE) {
      let total = this._timeValues.reduce((pv, cv) => pv + cv, 0);

      this._fpsTextField.text = (
        total / FPSMonitor.DEFAULT_HISTORY_SIZE
      ).toFixed(2);

      this._ringIndex = 0;
    }

    this._lastTime = currentTime;
  }
}
