function rand() {
  return Math.random();
}  

function addToPlot(markerType, xCoord, yCoord) {
	Plotly.extendTraces('scatterPlot', {
		x: [[xCoord]], y: [[yCoord]]
	}, [markerType])
}

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
}]);
