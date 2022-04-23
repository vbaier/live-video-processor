import React from "react";
import ReactDOM from "react-dom";
import WebcamCapture from "./Webcam";

const App = () => (
  <React.Fragment>
    <WebcamCapture socket_endpoint="ws/img/"/>
  </React.Fragment>
);
const wrapper = document.getElementById("app");
wrapper ? ReactDOM.render(<App />, wrapper) : null;