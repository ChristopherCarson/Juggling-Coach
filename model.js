async function load_model_hosted(modelName) {
	if (local == false) {
	const model = await tf.loadLayersModel("model.json", "group1-shard1of1");
	model.summary();
	await model.save('localstorage://model1');
	}else{
		document.getElementById('manual-file-loader').innerHTML = `
		<button id="loadModel">LoadModel</button>
		<input type="file"
			 name="model JSON"
			 id="json-upload" name="model"
			 accept="application/json">
		<input type="file" id="weights-upload" name="Weight">`

		loadModel.addEventListener('click', () => {
			load_model("model1");
		});
	}
}

async function load_model(modelName) {
	const jsonUpload = document.getElementById('json-upload');
	const weightsUpload = document.getElementById('weights-upload');

	const model = await tf.loadLayersModel(
		tf.io.browserFiles([jsonUpload.files[0], weightsUpload.files[0]]));
	
	model.summary();
	await model.save('localstorage://model1');
}

async function getPatternPrediction(modelName, data) {
	model = await tf.loadLayersModel('localstorage://' + modelName);
	console.log(data);
	const class_names = ['Cascade', 'Reverse Cascade', 'Shower'];
	
	var tensorData = tf.tensor([data]);

	var prediction = model.predict(tensorData).dataSync();

	var id = tf.argMax(prediction, -1).dataSync();
	var prob = tf.softmax(prediction).dataSync();
	var pred = {Prediction: class_names[id[0]],
				Probability: (prob[id[0]] * 100)};
				
	return pred;
}


