import React from "react";
import ReactDOM from "react-dom";

import App from "./App";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: "" };
  }

  componentDidCatch(error) {
    console.log(error);
    this.setState({
      error: `${error.name}: ${error.message}`
    });
  }

  render() {
    const { error } = this.state;
    if (error) {
      return <div>{error}</div>;
    } else {
      return <>{this.props.children}</>;
    }
  }
}

ReactDOM.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
  document.getElementById("react")
);
