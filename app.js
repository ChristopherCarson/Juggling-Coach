let utils = new Utils('errorMessage');

let streaming = false;
const videoInput = document.getElementById('videoInput');
const startAndStop = document.getElementById('startAndStop');
const canvasOutput = document.getElementById('canvasOutput');
const dataDisplayMotion = document.getElementById('dataDisplayMotion');
const patternText = document.getElementById('patternText');
const patternImage = document.getElementById('patternImage');
const throwInfo = document.getElementById('throws');

//Dev Tools
const framesPerSecSlider = document.getElementById('framesPerSecSlider')
const framesPerSecText = document.getElementById('framesPerSecText')

let fullGrid = [];
let canvasContext = canvasOutput.getContext('2d');
let lower = null;
let upper = null;

var patternType = "unknown";

// The higher this value, the less the fps will reflect temporary variations
// A value of 1 will only keep the last value
const filterStrength = 10;
let frameTime = 0, lastLoop = new Date, thisLoop;
var fpsOut = document.getElementById('fps');


    var elem = document.getElementById("progress-bar");   

    var width = 0;
    elem.style.width = width + '%'; 
    var id1 = setInterval(frame, 10);
    function frame() {
        if (width >= 80) {
              clearInterval(id1);
        } else {
          width++; 
          elem.style.width = width + '%'; 
        }
      }


setInterval(function(){
  fpsOut.innerHTML = (1000/frameTime).toFixed(1) + " fps";
},1000);

startAndStop.addEventListener('click', () => {
    if (!streaming) {
        utils.clearError();
        utils.startCamera('qvga', onVideoStarted, 'videoInput');
        document.getElementById('status').innerHTML = 'Computer Juggling Coach';
    } else {
        utils.stopCamera();
        onVideoStopped();
    }
});


function onVideoStarted() {
    let video = document.getElementById('videoInput');
    let src = new cv.Mat(video.height, video.width, cv.CV_8UC4);
    let dst = new cv.Mat();
    let motionFrame = new cv.Mat();
    let diff = new cv.Mat();
    let thresh = new cv.Mat();
    let oneTime = false

    let ballMotion;
    let centerMotion;
    let areaMotion;
    let areaThreshHoldMotion = 2000;

	let motionCount = 0;
	let numToDisplay = 0;


    let cap = new cv.VideoCapture(video);
    let ksize = new cv.Size(21, 21);

    let begin
    let anchor = new cv.Point(-1, -1);
    let M = cv.Mat.ones(5, 5, cv.CV_8U);
    let contoursMotion = new cv.MatVector();
    let hierarchy = new cv.Mat();
    let dataMotionCap = [];
    let dataTimeSubtract = new Date().getTime()
    let dataFrame = 1;
    let lastUpdate = 0;

    let throwData = [];
    let rightCount = 0;
    let leftCount = 0;
    let rightThrowTimer = 0;
    let leftThrowTimer = 0;
    let rightFlag = 0;
    let leftFlag = 0;

    let totals = []

    streaming = true;
    startAndStop.innerText = 'Stop';
    videoInput.width = videoInput.videoWidth;
    videoInput.height = videoInput.videoHeight;


    function reset(){
		//motionCount = 0;
        //dataMotionCap = [];
		purgePlot("motionScatterPlot");
        createPlot("motionScatterPlot", "Motion");
        leftCount = 0;
        rightCount = 0;
    }

    function setPatternImage(result){
        if (result === "NONE"){
            patternText.innerHTML = "NO PATTERN"
            patternImage.src = "images/NO_PATTERN.png"
            reset()
        }else{
        patternText.innerHTML = result.Prediction + " " + Math.round(result.Probability,0) + "%"
    
            if (result.Prediction === "Cascade"){
                patternImage.src = "images/CASCADE.gif"
            }else if (result.Prediction === "Reverse Cascade"){
                patternImage.src = "images/REVERSE_CASCADE.gif"
            }else if (result.Prediction === "Shower"){
                patternImage.src = "images/SHOWER.gif"
            }else if (result.Prediction === "Reverse Shower"){
                patternImage.src = "images/REVERSE_SHOWER.gif"
            }else if (result.Prediction === "Mills Mess"){
                patternImage.src = "images/MILLS_MESS.gif"
            }
        }
    }

    let FPS = 45;


    function processVideo() {
        try {
            if (!streaming) {
                // clean and stop.
                src.delete();
                dst.delete();
                motionFrame.delete();
                diff.delete();
                thresh.delete();
                M.delete();
                contoursMotion.delete();
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


            for (let i = 0; i < contoursMotion.size(); i++) {
                areaMotion = cv.contourArea(contoursMotion.get(i));
                if (areaMotion > areaThreshHoldMotion) {
                    ballMotion = cv.boundingRect(contoursMotion.get(i));
                    centerMotion = new cv.Point(ballMotion.x + Math.round(ballMotion.width / 2), ballMotion.y + Math.round(ballMotion.height / 2));
                    
                    direction = getDirection(dataMotionCap, dataFrame, centerMotion);
                    if (direction.horizontal === 1){
                        cv.circle(src, centerMotion, 20, [230,59,218, 255], 8);
                    }else if (direction.horizontal === 2){
                        cv.circle(src, centerMotion, 20, [59,229,217, 255], 8);
                    }else{
                        cv.circle(src, centerMotion, 20, [229,139,59, 255], 8);
                    }

                    if (dataMotionCap.length === 0) {
                        dataMotionCap.push({
                            frame: dataFrame,
                            time: new Date().getTime() - dataTimeSubtract,
                            point: centerMotion,
							direction: direction
                        });
                        throwData.push({
                            frame: dataFrame,
                            time: new Date().getTime() - dataTimeSubtract,
                            point: centerMotion,
							direction: direction
                        });
                    } else if (dataMotionCap[dataMotionCap.length - 1].point.x !== centerMotion.x && dataMotionCap[dataMotionCap.length - 1].point.y !== centerMotion.y) {
                        dataMotionCap.push({
                            frame: dataFrame,
                            time: new Date().getTime() - dataTimeSubtract,
                            point: centerMotion,
							direction: direction
                        });
                        throwData.push({
                            frame: dataFrame,
                            time: new Date().getTime() - dataTimeSubtract,
                            point: centerMotion,
							direction: direction
                        });
                    }
					
					//ScatterPlot
					addToPlot("motionScatterPlot", centerMotion.x, (centerMotion.y - (centerMotion.y * 2)),direction.horizontal);
					motionCount++;

					//Create predictions
					if(motionCount >= 75) {
						motionCount = 0;
						
						if (dataMotionCap.length >= 100) {
							numToDisplay = dataMotionCap.length - 75;
							//fullGrid.push(captureData(dataMotionCap.slice(numToDisplay), 320, 240, patternType)); 
							capturedData = captureData(dataMotionCap.slice(numToDisplay), 320, 240);
							
							var cdArray = Object.keys(capturedData).map(function(key) {
								return capturedData[key];
							});
							getPatternPrediction("model1", cdArray).then(
								function (result) {
                                    setPatternImage(result)
								}
							);
							purgePlot("motionScatterPlot");
							createPlot("motionScatterPlot", "Motion");
						}
						else 
							numToDisplay = 0;
						
						purgePlot("motionScatterPlot");
						createPlot("motionScatterPlot", "Motion");
					}
                }
            }

            //remove data that is over 300 milliseonds old
            if (throwData.length > 0){
                var index = 0
                while ((new Date().getTime() - dataTimeSubtract) - throwData[index].time > 200){
                    index++
                    if (index = throwData.length) break
                }
                throwData = throwData.slice(index, throwData.length + 1)
            }

            for (let i = 0; i < throwData.length; i++) {
                if (throwData[i].point.y < 200 && throwData[i].direction.horizontal === 1){
                    leftFlag++
                    //throwData[i].point.y = 201
                } 
                if (throwData[i].point.y < 200 && throwData[i].direction.horizontal === 2){
                    rightFlag++
                    //throwData[i].point.y = 201
                }
            }

            if (leftFlag > 2 && leftThrowTimer < 0){
                leftThrowTimer = 10
                leftCount++
             }
            if (rightFlag > 2 && rightThrowTimer < 0){
                rightThrowTimer = 10
                rightCount++
            }

            leftThrowTimer--
            rightThrowTimer--
            leftFlag = 0
            rightFlag = 0
            
            throwInfo.innerHTML = 'LEFT: '+leftCount+'  RIGHT: '+rightCount

            cv.imshow('canvasOutput', src);

            var thisFrameTime = (thisLoop=new Date) - lastLoop;
            frameTime+= (thisFrameTime - frameTime) / filterStrength;
            lastLoop = thisLoop;

            if (dataMotionCap.length>0){
                if (new Date().getTime() - dataTimeSubtract - lastUpdate > 1000){
                    setPatternImage("NONE");
                }
            }

            if (dataMotionCap.length>0){
                lastUpdate = dataMotionCap[dataMotionCap.length - 1].time;
            }

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
}

utils.loadOpenCv(() => {
    startAndStop.removeAttribute('disabled');
    document.getElementById('status').innerHTML = 'Press the start button below to begin!';

    var id2 = setInterval(frame, 10);
    function frame() {
        if (width >= 100) {
          width++;
            if (width >= 200){
              clearInterval(id2);
              document.getElementById("progress").style.display = "none";
            }
        } else {
          width++; 
          elem.style.width = width + '%'; 
        }
      }
});

