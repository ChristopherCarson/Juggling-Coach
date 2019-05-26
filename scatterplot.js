  
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
	//Right, Up = 1, Left, Down = 2
	var direction = {vertical: 0, horizontal: 0};
	nearbyPoints = [];
	frameThreshold = 1;
	xThreshold = 10;
	yThreshold = 10;
	sameDirFlag = true;
	
	
	if(pointArray.length == 0) 
		return direction;
	
	while(nearbyPoints.length == 0 && frameThreshold != 10) {
		nearbyPoints = pointArray.filter(function(value){
			return ((frame - frameThreshold < value.frame && value.frame != frame) && 
					(value.point.x - centerPoint.x > -xThreshold && value.point.x - centerPoint.x < xThreshold));
		});
		frameThreshold += 1;
		xThreshold += 10;
	}
	
	if(nearbyPoints.length == 0) 
		return direction;
	
	if(nearbyPoints.length == 1) {
		if(nearbyPoints[0].point.y >= centerPoint.y)
			direction.vertical = 1;
		else
			direction.vertical = 2;
		
		if(nearbyPoints[0].point.x >= centerPoint.x)
			direction.horizontal = 1;
		else
			direction.horizontal = 2;
	} else {
		nearbyPoints.forEach(function (point) {
			if(point.direction.vertical != nearbyPoints[0].direction.vertical ||
			   point.direction.horizontal != nearbyPoints[0].direction.horizontal)
				sameDirFlag == false;
		});
	
		if(sameDirFlag)
			return nearbyPoints[0].direction;
		else {
			if(nearbyPoints[0].point.y >= centerPoint.y)
				direction.vertical = 1;
			else
				direction.vertical = 2;
			
			if(nearbyPoints[0].point.x >= centerPoint.x)
				direction.horizontal = 1;
			else
				direction.horizontal = 2;
		}
	}
	
	return direction;
}

function purgePlot(divName) {
	Plotly.purge(divName);
}

createPlot("colorScatterPlot", "Color", "#0FE60B");
createPlot("motionScatterPlot", "Motion", "#E60B0B");