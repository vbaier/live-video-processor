import React from "react";
import Webcam from "react-webcam";
import pako from "pako";
//import ZstdCodec from 'zstd-codec';

const frameRate = 60.0;
const frameTime = 1.0/frameRate;
const redrawRequestTime = 0.95/frameRate;

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "user"
};

const WebcamCapture = (props) => {

  const webcam = React.useRef(null);
  const localInput = React.useRef(null);
  const localOutput = React.useRef(null);
  const remoteInput = React.useRef(null);
  const remoteOutput = React.useRef(null);
  const perfTimerStart = React.useRef(0);

  const [video, setVideo] = React.useState(null);

  const websocket = React.useRef(new WebSocket(((location.protocol == 'https:') ? 'wss://' : 'ws://' )+ window.location.host +
        '/' + props.socket_endpoint,));

  const transmitFrameData = React.useCallback( () => {
        const inputCanvas = remoteInput.current;

        if(!inputCanvas || !websocket.current || !video)
        {
            setTimeout(localRenderCallback, redrawRequestTime);
            return;
        }

        const inputContext = inputCanvas.getContext("2d");

        inputContext.drawImage(video, 0, 0, inputCanvas.width, inputCanvas.height);

        let frame = inputContext.getImageData(0, 0, inputCanvas.width, inputCanvas.height);
        console.log("Input Frame Drawn - " + (performance.now() - perfTimerStart.current) )

        /*
        let compressedFrame;
        ZstdCodec.ZstdCodec.run((zstd) => {
            var simple = new zstd.Simple();
            compressedFrame = simple.compress(frame.data);
            console.log("Frame Compressed - " + (performance.now() - perfTimerStart.current) )

            websocket.current.send(compressedFrame.buffer);
            console.log("Input Frame Sent - " + (performance.now() - perfTimerStart.current) )
        });
        */

        let compressedFrame;
        compressedFrame = pako.gzip(frame.data);
        console.log("Frame Compressed - " + (performance.now() - perfTimerStart.current) )

        websocket.current.send(compressedFrame.buffer);
        console.log("Input Frame Sent - " + (performance.now() - perfTimerStart.current) )
  },
  [remoteInput, websocket, video]);

  const initializeFrameProcessor = React.useEffect(
  () => {

        if(!websocket.current)
        {
            console.log('null websocket');
            return;
        }

        websocket.current.binaryType = "arraybuffer";
        websocket.current.onopen = () => {
            console.log('connected');
        }

        websocket.current.onclose  = () => {
            console.log('disconnected');
        }

        websocket.current.onmessage  = (event) => {
            //console.log(event);
            //console.log(event.data);

            const inputCanvas = remoteInput.current;
            const outputCanvas = remoteOutput.current;

            if(inputCanvas && outputCanvas)
            {
                console.log("Output Frame Received - " + (performance.now() - perfTimerStart.current) )

                const inputContext = inputCanvas.getContext("2d");
                const outputContext = outputCanvas.getContext("2d");

                let outputImageData = outputContext.createImageData(inputCanvas.width, inputCanvas.height);
                outputImageData.data.set(new Uint8ClampedArray(event.data));
                outputContext.putImageData(outputImageData,0,0);
                console.log("Output Frame Drawn - " + (performance.now() - perfTimerStart.current) )
            }
            perfTimerStart.current = performance.now()
            transmitFrameData();
        }
  },
  [websocket, transmitFrameData])

  const capture = React.useCallback(
    () => {
      const imageSrc = webcam.current.getScreenshot();
      websocket.current.send(imageSrc);
    },
    [webcam]
  );

  const getVideoReference = React.useCallback(
    () => {
        setVideo(webcam.current.video);
    },
    [webcam]
  );

  const attachPlayCallback = React.useEffect(
    () => {

        if(!video)
            return;

        const drawLocalFrame = () => {
            const inputCanvas = localInput.current;
            const outputCanvas = localOutput.current;

            if(!inputCanvas || !outputCanvas || !video)
                return;

            const inputContext = inputCanvas.getContext("2d");
            const outputContext = outputCanvas.getContext("2d");

            inputContext.drawImage(video, 0, 0, inputCanvas.width, inputCanvas.height);

            let frame = inputContext.getImageData(0, 0, inputCanvas.width, inputCanvas.height);
            let l = frame.data.length / 4;

            for (let i = 0; i < l; i++)
              frame.data[i * 4 + 0] = 0;

            outputContext.putImageData(frame, 0, 0);
        }

        const localRenderCallback = () => {
            drawLocalFrame();
            setTimeout(localRenderCallback, redrawRequestTime);
        }

        const initRendering = () => {
            setTimeout(localRenderCallback, 0);
            transmitFrameData();
        }

        video.onplay = setTimeout(initRendering, 0);
    },
    [video, transmitFrameData]
  );

  const webcamStyle = {
    display: 'block',
    position: 'absolute',
    right: '100%'
  };

  const ioPairStyle = {
    width: '100%',
    display: 'block'
  };
  const ioContainerStyle = {
    width: '50%',
    display: 'inline-block'
  };
  const canvasStyle = {width: '100%'};

  return (
    <>
    <div id="webcam" style={webcamStyle}>
      <Webcam
        muted={false}
        height={720}
        ref={webcam}
        screenshotFormat="image/png"
        width={1280}
        videoConstraints={videoConstraints}
        onUserMedia={getVideoReference}
      />
      <button onClick={capture}>Capture photo</button>
    </div>
    <div id="local-io" style={ioPairStyle}>
        <div id="local-input" style={ioContainerStyle}>
            <canvas ref={localInput} style={canvasStyle}></canvas>
        </div>
        <div id="local-output" style={ioContainerStyle}>
            <canvas ref={localOutput} style={canvasStyle}></canvas>
        </div>
    </div>
    <div id="remote-io" style={ioPairStyle}>
        <div id="remote-input" style={ioContainerStyle}>
            <canvas ref={remoteInput} style={canvasStyle}></canvas>
        </div>
        <div id="remote-output" style={ioContainerStyle}>
            <canvas ref={remoteOutput} style={canvasStyle}></canvas>
        </div>
    </div>
    </>
  );
};

export default WebcamCapture;