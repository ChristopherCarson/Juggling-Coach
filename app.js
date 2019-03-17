let utils = new Utils('errorMessage');

let streaming = false;
let videoInput = document.getElementById('videoInput');
let startAndStop = document.getElementById('startAndStop');
let canvasOutput = document.getElementById('canvasOutput');
let canvasContext = canvasOutput.getContext('2d');
let lower = null;
let upper = null;

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
    streaming = true;
    startAndStop.innerText = 'Stop';
    videoInput.width = videoInput.videoWidth;
    videoInput.height = videoInput.videoHeight;
    colorCapture.disabled = false;

let video = document.getElementById('videoInput');
let src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
let dst = new cv.Mat(video.height, video.width, cv.CV_8UC1);
let cap = new cv.VideoCapture(video);

const FPS = 45;
function processVideo() {
    try {
        if (!streaming) {
            // clean and stop.
            src.delete();
            dst.delete();
            return;
        }
        let begin = Date.now();
        // start processing.
        //If this imshow isn't here, the canvasOutput is blank until the color is detected.
        cv.imshow('canvasOutput', src);
        cap.read(src);
        cv.cvtColor(src, dst, cv.COLOR_BGR2HSV);

        //starting range
        if (lower == null){
            lower = new cv.Mat(dst.rows, dst.cols, dst.type(), [70, 128, 114, 44])
            upper = new cv.Mat(dst.rows, dst.cols, dst.type(), [255, 210, 194, 124])
        }

        cv.inRange(dst, lower, upper, dst);

        let M = cv.Mat.ones(5, 5, cv.CV_8U);
        let anchor = new cv.Point(-1, -1);

        cv.dilate(dst, dst, M, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());

        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();
        cv.findContours(dst, contours, hierarchy, 1, 2);
        
        let ball;
        let center;
        let area;
        let areaThreshHold = 150;

        for (let i = 0; i < contours.size(); i++) {
            area = cv.contourArea(contours.get(i));
            if (area>areaThreshHold){
                ball = cv.boundingRect(contours.get(i));
                center = new cv.Point(ball.x + Math.round(ball.width/2), ball.y + Math.round(ball.height/2));
                cv.circle(src, center, Math.round(ball.width/2), [0, 255, 0, 255], 2);
                cv.imshow('canvasOutput', src);
            }
        }
        
        // schedule the next one.

        let delay = 1000/FPS - (Date.now() - begin);
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

    function mouseUp() { drag = false; }

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
                console.log("MinH MaxH MinS MaxS MinV MaxV", minMaxH.minVal
                    , minMaxH.maxVal, minMaxS.minVal, minMaxS.maxVal,
                    minMaxV.minVal, minMaxV.maxVal);
                //Now try extracting the HSV out
                var frame_HSV = new cv.Mat();
                cv.cvtColor(src, frame_HSV, cv.COLOR_BGR2HSV)
                //console.log(frame_HSV.rows, frame_HSV.cols, frame_HSV.type())
                lower = new cv.Mat(frame_HSV.rows, frame_HSV.cols, frame_HSV.type(),
                    [minMaxH.minVal, minMaxS.minVal, minMaxV.minVal, 0]);
                upper = new cv.Mat(frame_HSV.rows, frame_HSV.cols, frame_HSV.type(),
                    [minMaxH.maxVal, minMaxS.maxVal, minMaxV.maxVal, 250]);

                dst.delete();

            } catch (err) {
                console.log("Error: ", err.message)
            }
        }

    }

};