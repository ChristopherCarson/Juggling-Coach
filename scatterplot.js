  
function rand() {
  return Math.random();
}  

function addToPlot(markerType, xCoord, yCoord) {
	Plotly.extendTraces('scatterPlot', {
		x: [[xCoord]], y: [[yCoord]]
	}, [markerType])
}

function createPlot() {
	var layout = {
		autosize: false,
		width:500,
		height:440,
		margin: {
			l: 25,
			r: 25,
			b: 50,
			t: 50,
			pad: 4
		}
	};

	Plotly.plot('scatterPlot', [
	{
	  y: [].map(rand),
	  x: [].map(rand),
	  mode: 'markers',
	  line: {color: '#0FE60B'},
	  name: "Color"
	},
	{
	  y: [].map(rand),
	  x: [].map(rand),
	  mode: 'markers',
	  line: {color: '#E60B0B'},
	  name: "Motion"
	}], layout);
}

createPlot();
