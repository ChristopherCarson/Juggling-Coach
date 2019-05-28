async function load_model() {
	const model = await tf.loadLayersModel("model.json", "group1-shard1of1");
	model.summary();
	await model.save('localstorage://model1');
}

async function getPatternPrediction(modelName, data) {
	model = await tf.loadLayersModel('localstorage://' + modelName);
	console.log(data);
	const class_names = ['Cascade', 'Reverse Cascade', 'Shower', 'Mills Mess', 'Unknown Pattern'];
	
	var tensorData = tf.tensor([data]);

	var prediction = model.predict(tensorData).dataSync();

	var id = tf.argMax(prediction, -1).dataSync();
	var prob = tf.softmax(prediction).dataSync();
	var pred = {Prediction: class_names[id[0]],
				Probability: (prob[id[0]] * 100)};
				
	return pred;
}

