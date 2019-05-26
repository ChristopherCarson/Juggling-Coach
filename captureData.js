function convertArrayOfObjectsToCSV(args) {
	var result, ctr, keys, columnDelimiter, lineDelimiter, data;

	data = args.data || null;
	if (data == null || !data.length) {
		return null;
	}

	columnDelimiter = args.columnDelimiter || ',';
	lineDelimiter = args.lineDelimiter || '\n';

	keys = Object.keys(data[0]);

	result = '';
	result += keys.join(columnDelimiter);
	result += lineDelimiter;

	data.forEach(function(item) {
		ctr = 0;
		keys.forEach(function(key) {
			if (ctr > 0) result += columnDelimiter;

			result += item[key];
			ctr++;
		});
		result += lineDelimiter;
	});

	return result;
}

function downloadCSV(args) {
	var data, filename, link;

	var csv = convertArrayOfObjectsToCSV({
		data: args
	});
	if (csv == null) return;

	filename = args.filename || 'export.csv';

	if (!csv.match(/^data:text\/csv/i)) {
		csv = 'data:text/csv;charset=utf-8,' + csv;
	}
	data = encodeURI(csv);

	link = document.createElement('a');
	link.setAttribute('href', data);
	link.setAttribute('download', filename);
	link.click();
}

function captureData (dataArray, initMaxX, initMaxY, type="") {
	const gridSize = 3; //3*3 = 9 total squares
	var minimumPoints = (dataArray.length / 20);
	var initialGrid = 4;
	var minX = dataArray[0].point.x;
	var minY = dataArray[0].point.y;
	var maxX = dataArray[0].point.x;
	var maxY = dataArray[0].point.y;
	var sX = 0;
	var sY = 0;
	var dataGrid = [];
	var grid = [];
	var xArray = [];
	var yArray = [];
	var gridArray = [];
	var minTime = 0;
	var maxTime = 0;
	
	//First - Resize the total grid size from the whole frame to where data is actually being captured.
	sX = initMaxX / initialGrid;
	sY = initMaxY / initialGrid;
	
	//X coordinate
	for(x = 0; x <= initMaxX; x = x + sX) {
		xArray = dataArray.filter(data => data.point.x >= x && data.point.x < (x + sX));
		if(xArray.length > minimumPoints) {
			for(var i in xArray) {
				if(xArray[i].point.x < minX) minX = xArray[i].point.x;
				if(xArray[i].point.x > maxX) maxX = xArray[i].point.x;
			}
		}
	}
	
	//Y Coordinate
	for(y = 0; y <= initMaxY; y = y + sY) {
		yArray = dataArray.filter(data => data.point.y >= y && data.point.y < (y + sY));
		if(yArray.length > minimumPoints) {
			for(var i in yArray) {
				if(yArray[i].point.y < minY) minY = yArray[i].point.y;
				if(yArray[i].point.y > maxY) maxY = yArray[i].point.y;
			}
		}
	}
	
	//Resize each grid square using new min/max coordinates.
	sX = (maxX - minX) / gridSize;
	sY = (maxY - minY) / gridSize;
	
	//Enumerate through each grid square and capture data.
	var gridIndex = 1;
	var avgUp = 0;
	var avgDown = 0;
	var avgRight = 0;
	var avgLeft = 0;
	for(var x = minX; x <= maxX - 1; x = x + sX) {
		xArray = dataArray.filter(data => data.point.x >= x && data.point.x < (x + sX));
		for(var y = minY; y <= maxY - 1; y = y + sY) {
			gridArray = xArray.filter(data => data.point.y >= y && data.point.y < (y + sY));
			
			//Sort by time
			gridArray.sort((a, b) => (a.time > b.time) ? 1 : -1);
			
			if(gridArray.length > 1) {
				avgUp = (gridArray.filter(data => data.direction.vertical == 1).length * 1.0) / gridArray.length; //UpAvg
				avgDown = (gridArray.filter(data => data.direction.vertical == 2).length * 1.0) / gridArray.length; //DownAvg
				avgRight = (gridArray.filter(data => data.direction.horizontal == 1).length * 1.0) / gridArray.length; //RightAvg
				avgLeft = (gridArray.filter(data => data.direction.horizontal == 2).length * 1.0) / gridArray.length; //LeftAvg
			} else {
				totaltime = 0;
				avgtimedistance = 0;
			}
			
			grid["g" + gridIndex + "GP"] = (gridArray.length * 1.0) / dataArray.length; //Percentage of total grid,
			grid["g" + gridIndex + "nU"] = gridArray.filter(data => data.direction.vertical == 1).length; //Num up
			grid["g" + gridIndex + "nD"] = gridArray.filter(data => data.direction.vertical == 2).length; //Num down
			grid["g" + gridIndex + "nR"] = gridArray.filter(data => data.direction.horizontal == 1).length; //Num right
			grid["g" + gridIndex + "nL"] = gridArray.filter(data => data.direction.horizontal == 2).length; //Num left
			grid["g" + gridIndex + "aU"] = avgUp;
			grid["g" + gridIndex + "aD"] = avgDown;
			grid["g" + gridIndex + "aR"] = avgRight;
			grid["g" + gridIndex + "aL"] = avgLeft;
			gridIndex++;
		}
	}
	if(type != "") grid["type"] = type;
	return grid;
}

function captureDataForTraining (dataArray, type) {
	const gridSize = 3; //3*3
	
	var minX = dataArray[0].point.x;
	var minY = dataArray[0].point.y;
	var maxX = dataArray[0].point.x;
	var maxY = dataArray[0].point.y;
	var sX = 0;
	var sY = 0;
	var dataGrid = [];
	var gridCount = 1;
	var grid = [];
	
	//Find min/max XY coordinates.
	for(var i in dataArray) {
		if(dataArray[i].point.x < minX) minX = dataArray[i].point.x;
		if(dataArray[i].point.y < minY) minY = dataArray[i].point.y;
		if(dataArray[i].point.x > maxX) maxX = dataArray[i].point.x;
		if(dataArray[i].point.y > maxY) maxY = dataArray[i].point.y;
	}
	
	//Get size of each grid square.
	sX = (maxX - minX) / gridSize;
	sY = (maxY - minY) / gridSize;
	
	for(var x = minX; x <= maxX - 1; x = x + sX) {
		var xFilter = dataArray.filter(data => data.point.x >= x && data.point.x < (x + sX));
		for(var y = minY; y <= maxY - 1; y = y + sY) {
			grid["g" + gridCount + "Up"] = xFilter.filter(
				data => data.point.y >= y && data.point.y < (y + sY) && data.direction.vertical == 1
			).length.toFixed(2);
			grid["g" + gridCount + "down"] = xFilter.filter(
				data => data.point.y >= y && data.point.y < (y + sY) && data.direction.vertical == 2
			).length.toFixed(2);
			
			gridCount++;
		}
	}
	grid["type"] = type;
	
	return grid;
}

