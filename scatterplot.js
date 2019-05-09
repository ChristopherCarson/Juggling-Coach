  
function rand() {
        return Math.random();
}  

function addToPlot(divName, xCoord, yCoord, trace) {
	Plotly.extendTraces(divName, {
		x: [[xCoord]], y: [[yCoord]]
	}, [trace])
}

function createPlot(divName, title) {
	var layout = {
		autosize: false,
		title: {
			text: title,
			font: {
				family: 'Courier New, monospace',
				size: 12
			},
			xref: 'paper',
			x: 0.05,
		},
		width:375,
		height:330,
		margin: {
			l: 25,
			r: 25,
			b: 50,
			t: 50,
			pad: 4
		}
	};

	Plotly.plot(divName, [
	{
	  y: [].map(rand),
	  x: [].map(rand),
	  mode: 'markers',
	  line: {color:"rgb(0,255,0)"}, //'#0FE60B'
	  name: "Unknown",
	},
	{
	  y: [].map(rand),
	  x: [].map(rand),
	  mode: 'markers',
	  line: {color:"rgb(0,0,255)"}, //'#0FE60B'
	  name: "Up",
	}, 
	{
	  y: [].map(rand),
	  x: [].map(rand),
	  mode: 'markers',
	  line: {color:"rgb(255,0,0)"}, //'#0FE60B'
	  name: "Down",	
	}], layout);
}

function getDirection(pointArray, frame, centerPoint) {
	nearbyPoints = [];
	frameThreshold = 1;
	xThreshold = 10;
	sameDirFlag = true;
	
	if(pointArray.length == 0) 
		return 0;
	
	while(nearbyPoints.length == 0 && frameThreshold != 10) {
		nearbyPoints = pointArray.filter(function(value){
			return ((frame - frameThreshold < value.frame && value.frame != frame) && 
					(value.point.x - centerPoint.x > -xThreshold && value.point.x - centerPoint.x < xThreshold));
		});
		frameThreshold += 1;
		xThreshold += 5;
	}

	if(nearbyPoints.length == 0)
		return 0;
	
	if(nearbyPoints.length == 1) {
		console.log("point " + nearbyPoints[0].point.y); 
		if(nearbyPoints[0].point.y >= centerPoint.y)
			return 1;
		else
			return 2;
	} else {
		console.log("Directions " + nearbyPoints);
		nearbyPoints.forEach(function (point) {
			if(point.direction != nearbyPoints[0].direction)
				sameDirFlag == false;
		});
	
		if(sameDirFlag)
			return nearbyPoints[0].direction;
		else {
			if(nearbyPoints[0].point.y >= centerPoint.y)
				return 1;
			else
				return 2;	
		}	
	}
	
}

function purgePlot(divName) {
	Plotly.purge(divName);
}

createPlot("colorScatterPlot", "Color", "#0FE60B");
createPlot("motionScatterPlot", "Motion", "#E60B0B");