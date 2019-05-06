let utils = new Utils('errorMessage');

let streaming = false;
const videoInput = document.getElementById('videoInput');
const startAndStop = document.getElementById('startAndStop');
const canvasOutput = document.getElementById('canvasOutput');
const dataDisplayColor = document.getElementById('dataDisplayColor');
const dataDisplayMotion = document.getElementById('dataDisplayMotion');

//Dev Tools
const hueMaxSlider = document.getElementById('hueMaxSlider')
const hueMaxText = document.getElementById('hueMaxText')
const hueMinSlider = document.getElementById('hueMinSlider')
const hueMinText = document.getElementById('hueMinText')

const satMaxSlider = document.getElementById('satMaxSlider')
const satMaxText = document.getElementById('satMaxText')
const satMinSlider = document.getElementById('satMinSlider')
const satMinText = document.getElementById('satMinText')

const valMaxSlider = document.getElementById('valMaxSlider')
const valMaxText = document.getElementById('valMaxText')
const valMinSlider = document.getElementById('valMinSlider')
const valMinText = document.getElementById('valMinText')

const colorThreshSlider = document.getElementById('colorThreshSlider')
const colorThreshText = document.getElementById('colorThreshText')
const motionThreshSlider = document.getElementById('motionThreshSlider')
const motionThreshText = document.getElementById('motionThreshText')

const framesPerSecSlider = document.getElementById('framesPerSecSlider')
const framesPerSecText = document.getElementById('framesPerSecText')

let canvasContext = canvasOutput.getContext('2d');

// The higher this value, the less the fps will reflect temporary variations
// A value of 1 will only keep the last value
const filterStrength = 10;
let frameTime = 0, lastLoop = new Date, thisLoop;
var fpsOut = document.getElementById('fps');

setInterval(function(){
  fpsOut.innerHTML = (1000/frameTime).toFixed(1) + " fps";
},1000);

startAndStop.addEventListener('click', () => {
    if (!streaming) {
        utils.clearError();
        utils.startCamera('qvga', onVideoStarted, 'videoInput');
    } else {
        utils.stopCamera();
        onVideoStopped();
    }
});

colorCapture.addEventListener('click', () => {
    capture();
});

function onVideoStarted() {
    let video = document.getElementById('videoInput');
    let src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
    let colorFrame = new cv.Mat();
    let dst = new cv.Mat();
    let motionFrame = new cv.Mat();
    let diff = new cv.Mat();
    let thresh = new cv.Mat();
    let oneTime = false

    let ballMotion;
    let centerMotion;
    let areaMotion;
    let areaThreshHoldMotion = 2000;

    let ballColor;
    let centerColor;
    let areaColor;
    let areaThreshHoldColor = 150;

    colorThreshSlider.value = areaThreshHoldColor;
    motionThreshSlider.value = areaThreshHoldMotion;

    colorThreshText.innerHTML = colorThreshSlider.value;
    motionThreshText.innerHTML = motionThreshSlider.value;

    let cap = new cv.VideoCapture(video);
    let ksize = new cv.Size(21, 21);

    let begin
    let anchor = new cv.Point(-1, -1);
    let M = cv.Mat.ones(5, 5, cv.CV_8U);
    let contoursMotion = new cv.MatVector();
    let contoursColor = new cv.MatVector();
    let hierarchy = new cv.Mat();

    let dataColorCap = [];
    let dataMotionCap = [];
    let dataTimeSubtract = new Date().getTime()
    let dataFrame = 1;

    let lower = null;
    let upper = null;

    streaming = true;
    startAndStop.innerText = 'Stop';
    videoInput.width = videoInput.videoWidth;
    videoInput.height = videoInput.videoHeight;
    colorCapture.disabled = false;

    
    addEventListener("keydown", function (event) {
        if (event.keyCode == 99)
            dataDisplayColor.innerHTML = '';
        dataDisplayMotion.innerHTML = '';
        dataColorCap = [];
        dataMotionCap = [];
    });


    const memoize = (fn) => {
        let cache = {};
        return (...args) => {
          let n = args[0];  // just taking one argument here
          if (n in cache) {
            //console.log('Fetching from cache');
            return cache[n];
          }
          else {
            //console.log('Calculating result');
            let result = fn(n);
            cache[n] = result;
            return result;
          }
        }
      }

      const calcLower = (vals) => (new cv.Mat(dst.rows, dst.cols, dst.type(), [vals[0], vals[1], vals[2], 0]));
      const calcUpper = (vals) => (new cv.Mat(dst.rows, dst.cols, dst.type(), [vals[0], vals[1], vals[2], 0]));

      const memoizeLower = memoize(calcLower);
      const memoizeUpper = memoize(calcUpper);

    let FPS = 45;
    framesPerSecSlider.value = FPS;

    function processVideo() {
        try {
            if (!streaming) {
                // clean and stop.
                src.delete();
                colorFrame.delete();
                dst.delete();
                motionFrame.delete();
                diff.delete();
                thresh.delete();
                M.delete();
                contoursMotion.delete();
                contoursColor.delete();
                hierarchy.delete();

                return;
            }
            begin = Date.now();
            // start processing.
            //If this imshow isn't here, the canvasOutput is blank until the color is detected.
            cv.imshow('canvasOutput', src);
            cap.read(src);

            cv.cvtColor(src, motionFrame, cv.COLOR_BGR2GRAY);
            cv.GaussianBlur(motionFrame, motionFrame, ksize, 0, 0, cv.BORDER_DEFAULT);

            if (oneTime == false) {
                oneTime = true;
                master = motionFrame.clone();
            }

            cv.absdiff(master, motionFrame, diff)
            cv.threshold(diff, thresh, 15, 255, cv.THRESH_BINARY)
            cv.dilate(thresh, thresh, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
            cv.findContours(thresh, contoursMotion, hierarchy, 1, 2);
            cv.cvtColor(src, dst, cv.COLOR_BGR2HSV);

            //starting range
            if (lower == null) {
                let hMin = 92;
                let hMax = 99;
                let sMin = 80;
                let sMax = 133;
                let vMin = 160;
                let vMax = 240;

                lower = new cv.Mat(dst.rows, dst.cols, dst.type(), [hMin, sMin, vMin, 0]);
                upper = new cv.Mat(dst.rows, dst.cols, dst.type(), [hMax, sMax, vMax, 0]);

                hueMaxSlider.value = hMax;
                hueMinSlider.value = hMin;
                satMaxSlider.value = sMax;
                satMinSlider.value = sMin;
                valMaxSlider.value = vMax;
                valMinSlider.value = vMin;

                hueMaxText.innerHTML = hMax;
                hueMinText.innerHTML = hMin;
                satMaxText.innerHTML = sMax;
                satMinText.innerHTML = sMin;
                valMaxText.innerHTML = vMax;
                valMinText.innerHTML = vMin;
            }

            cv.inRange(dst, lower, upper, colorFrame);
            cv.dilate(colorFrame, colorFrame, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
            cv.findContours(colorFrame, contoursColor, hierarchy, 1, 2);

            for (let i = 0; i < contoursColor.size(); i++) {
                areaColor = cv.contourArea(contoursColor.get(i));
                if (areaColor > areaThreshHoldColor) {
                    ballColor = cv.boundingRect(contoursColor.get(i));
                    centerColor = new cv.Point(ballColor.x + Math.round(ballColor.width / 2), ballColor.y + Math.round(ballColor.height / 2));
                    cv.circle(src, centerColor, 20, [0, 255, 0, 255], 8);
                    if (dataColorCap.length === 0) {
                        dataColorCap.push({
                            frame: dataFrame,
                            time: new Date().getTime() - dataTimeSubtract,
                            point: centerColor
                        });
                    } else if (dataColorCap[dataColorCap.length - 1].point.x !== centerColor.x && dataColorCap[dataColorCap.length - 1].point.y !== centerColor.y) {
                        dataColorCap.push({
                            frame: dataFrame,
                            time: new Date().getTime() - dataTimeSubtract,
                            point: centerColor
                        });
                    }
                }
            }

            for (let i = 0; i < contoursMotion.size(); i++) {
                areaMotion = cv.contourArea(contoursMotion.get(i));
                if (areaMotion > areaThreshHoldMotion) {
                    ballMotion = cv.boundingRect(contoursMotion.get(i));
                    centerMotion = new cv.Point(ballMotion.x + Math.round(ballMotion.width / 2), ballMotion.y + Math.round(ballMotion.height / 2));
                    cv.circle(src, centerMotion, 20, [255, 0, 0, 255], 8);
                    if (dataMotionCap.length === 0) {
                        dataMotionCap.push({
                            frame: dataFrame,
                            time: new Date().getTime() - dataTimeSubtract,
                            point: centerMotion
                        });
                    } else if (dataMotionCap[dataMotionCap.length - 1].point.x !== centerMotion.x && dataMotionCap[dataMotionCap.length - 1].point.y !== centerMotion.y) {
                        dataMotionCap.push({
                            frame: dataFrame,
                            time: new Date().getTime() - dataTimeSubtract,
                            point: centerMotion
                        });
                    }
                }
            }

            cv.imshow('canvasOutput', src);

            var thisFrameTime = (thisLoop=new Date) - lastLoop;
            frameTime+= (thisFrameTime - frameTime) / filterStrength;
            lastLoop = thisLoop;

            lower = memoizeLower([parseInt(hueMinSlider.value), parseInt(satMinSlider.value), parseInt(valMinSlider.value)]);
            upper = memoizeUpper([parseInt(hueMaxSlider.value), parseInt(satMaxSlider.value), parseInt(valMaxSlider.value)]);

            hueMaxText.innerHTML = hueMaxSlider.value;
            hueMinText.innerHTML = hueMinSlider.value;
            satMaxText.innerHTML = satMaxSlider.value;
            satMinText.innerHTML = satMinSlider.value;
            valMaxText.innerHTML = valMaxSlider.value;
            valMinText.innerHTML = valMinSlider.value;

            areaThreshHoldColor = parseInt(colorThreshSlider.value);
            areaThreshHoldMotion = parseInt(motionThreshSlider.value);
 
            colorThreshText.innerHTML = colorThreshSlider.value;
            motionThreshText.innerHTML = motionThreshSlider.value;

            FPS = parseInt(framesPerSecSlider.value);
            framesPerSecText.innerHTML = framesPerSecSlider.value;


            // for (var i = 0; i < Object.keys(dataColorCap).length; i++) {
            //     var tr = "<tr>";
            //     tr += "<td>" + dataColorCap[i].frame + "</td>" + "<td>" + dataColorCap[i].time.toString() + "</td></tr>";
            //     dataDisplayColor.innerHTML += tr;
            // }

            if (dataColorCap.length > 20) dataColorCap = []
            if (dataMotionCap.length > 20) dataMotionCap = []
            dataDisplayColor.innerHTML = dataColorCap.map(data => JSON.stringify(data, null, 4))
            dataDisplayMotion.innerHTML = dataMotionCap.map(data => JSON.stringify(data, null, 4))

            master = motionFrame.clone();
            // schedule the next one.

            dataFrame++;
            let delay = 1000 / FPS - (Date.now() - begin);
            setTimeout(processVideo, delay);
        } catch (err) {
            utils.printError(err);
        }
    };

    // schedule the first one.
    setTimeout(processVideo, 0);

}

function onVideoStopped() {
    streaming = false;
    startAndStop.innerText = 'Start';
    colorCapture.disabled = true;
}

utils.loadOpenCv(() => {
    startAndStop.removeAttribute('disabled');
    colorCapture.removeAttribute('disabled');
    document.getElementById('status').innerHTML = 'OpenCV.js is ready!';
});


let src;

function capture() {

    const colorPickerXoffset = 351;
    const colorPickerYoffset = 146;
    var canvas = document.getElementById('canvasOutput');
    var ctx = canvas.getContext('2d');
    var rect = {};
    var drag = false;
    colorCapture.disabled = true;

    src = new cv.Mat(240, 320, cv.CV_8UC4);
    let video = document.getElementById('videoInput');
    let cap = new cv.VideoCapture(video);
    cap.read(src);
    utils.stopCamera();
    onVideoStopped();

    canvas.addEventListener('mousedown', mouseDown, false);
    canvas.addEventListener('mouseup', mouseUp, false);
    canvas.addEventListener('mousemove', mouseMove, false);
    //to draw on Canvas
    function mouseDown(e) {
        if (e.which == 1) {
            rect.startX = e.pageX - colorPickerXoffset;
            rect.startY = e.pageY - colorPickerYoffset;
            drag = true;
        }
    }

    function mouseUp() {
        drag = false;
    }

    function mouseMove(e) {
        if (drag) {
            try {

                ctx.clearRect(rect.startX, rect.startY, rect.w, rect.h);
                cv.imshow('canvasOutput', src);
                rect.w = (e.pageX - colorPickerXoffset) - rect.startX;
                rect.h = (e.pageY - colorPickerYoffset) - rect.startY;
                ctx.strokeStyle = 'red';
                ctx.strokeRect(rect.startX, rect.startY, rect.w, rect.h);
                let dst = new cv.Mat();
                let rectCV = new cv.Rect(rect.startX, rect.startY, rect.w, rect.h);
                dst = src.roi(rectCV);

                var res = new cv.Mat();
                cv.cvtColor(dst, res, cv.COLOR_BGR2HSV, 0);

                let rgbaPlanes = new cv.MatVector()
                // Split the Mat
                cv.split(res, rgbaPlanes);
                // Get R channel
                let H = rgbaPlanes.get(0);
                let S = rgbaPlanes.get(1);
                let V = rgbaPlanes.get(2);
                let minMaxH = cv.minMaxLoc(H);
                let minMaxS = cv.minMaxLoc(S);
                let minMaxV = cv.minMaxLoc(V);
                //Get the HSV values
                console.log("MinH MaxH MinS MaxS MinV MaxV", minMaxH.minVal, minMaxH.maxVal, minMaxS.minVal, minMaxS.maxVal,
                    minMaxV.minVal, minMaxV.maxVal);
                //Now try extracting the HSV out
                var frame_HSV = new cv.Mat();
                cv.cvtColor(src, frame_HSV, cv.COLOR_BGR2HSV)
                //console.log(frame_HSV.rows, frame_HSV.cols, frame_HSV.type())
                lower = new cv.Mat(frame_HSV.rows, frame_HSV.cols, frame_HSV.type(),
                    [minMaxH.minVal, minMaxS.minVal, minMaxV.minVal, 0]);
                upper = new cv.Mat(frame_HSV.rows, frame_HSV.cols, frame_HSV.type(),
                    [minMaxH.maxVal, minMaxS.maxVal, minMaxV.maxVal, 250]);

                hueMaxSlider.value = minMaxH.maxVal;
                hueMinSlider.value = minMaxH.minVal;
                satMaxSlider.value = minMaxS.maxVal;
                satMinSlider.value = minMaxS.minVal;
                valMaxSlider.value = minMaxV.maxVal;
                valMinSlider.value = minMaxV.minVal;

                hueMaxText.innerHTML = minMaxH.maxVal;
                hueMinText.innerHTML = minMaxH.minVal;
                satMaxText.innerHTML = minMaxS.maxVal;
                satMinText.innerHTML = minMaxS.minVal;
                valMaxText.innerHTML = minMaxV.maxVal;
                valMinText.innerHTML = minMaxV.minVal;

                dst.delete();
                cap.delete();
                rgbaPlanes.delete();
                frame_HSV.delete();

            } catch (err) {
                console.log("Error: ", err.message)
            }
        }

    }

};