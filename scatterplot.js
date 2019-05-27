  
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
		paper_bgcolor: 'rgba(0,0,0,0)',
		plot_bgcolor: 'rgba(0,0,0,0)',
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
		width:325,
		height:300,
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
	  line: {color:"rgb(229,139,59)"}, //'#0FE60B'
	  name: "Unknown",
	},
	{
	  y: [].map(rand),
	  x: [].map(rand),
	  mode: 'markers',
	  line: {color:"rgb(230,59,218)"}, //'#0FE60B'
	  name: "Left",
	}, 
	{
	  y: [].map(rand),
	  x: [].map(rand),
	  mode: 'markers',
	  line: {color:"rgb(59,229,217)"}, //'#0FE60B'
	  name: "Right",	
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
createPlot("motionScatterPlot", "Motion", "#E60B0B");