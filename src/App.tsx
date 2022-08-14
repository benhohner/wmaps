import { Stage, Text, useApp } from "@inlet/react-pixi";
import React, { useState } from "react";
import { Component } from "./render/components/Component";
import {} from "jotai";
// import * as PIXI from "pixi.js";

const width = 500;
const height = 350;
const options = {
  backgroundColor: 0xf0f0f0,
  sortableChildren: true
};

function RenderCircles() {
  let app = useApp();
  const [circles, setCircles] = useState<typeof Component[]>([]);

  const onMouseDown = (e) => {
    if (e.detail % 2 === 0) {
      // Might double click twice within 200ms
      let newCircles = [...circles, <Component x={e.offsetX} y={e.offsetY}/>]];
      console.log(newCircles);
      setCircles(newCircles);
    }
  };

  // this adds an event listener on ever render leading to infinte loop
  // FIXME
  React.useEffect(() => {
    console.log("fired");
    app.renderer.view.addEventListener("mousedown", onMouseDown);
  }, []);

  return (
    <>
      {circles.map((circle) => (
        <Component x={circle[0]} y={circle[1]} key={Math.random()} />
      ))}
    </>
  );
}

function App() {
  return (
    <Stage width={width} height={height} options={options}>
      <RenderCircles />
      <Component x={100} y={100} />
      <Text text="test" x={10} y={10} />
    </Stage>
  );
}

export default App;
