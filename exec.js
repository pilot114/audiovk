const {ipcRenderer} = require('electron')

// window.onload = function() {
var run = function() {
	console.clear();
	console.log("START PRELOAD");

	var id = window.location.hash.substring(1);

	// crunch for denied audios (its my audios)
	var el = $($(".audio_row")[0]);
	var duration = el.find('div.audio_duration').text();
	if (duration == "3:09:38") {
		console.log("DENIED");
		ipcRenderer.sendSync('parse_result', ["error"])
		return;
	}

	var audiosData = [id];
	var scrollInterval = 300;

	// scroll down
	var prevWh = 0;
	var refreshIntervalId = setInterval(function(){
		console.log('iter...');
		var newWh = document.body.scrollHeight;
		window.scrollTo(0, newWh);

		if (newWh == prevWh) {
			console.log('end!');
			clearInterval(refreshIntervalId);

			var audios = $(".audio_row");
			for (var i = 0; i < audios.length; i++) {
				var el = $(audios[i]);
				var name     = el.find('span.audio_title_inner').text().trim();
				var artist   = el.find('a.audio_performer').text().trim();
				var duration = el.find('div.audio_duration').text();
				var audio = [ name, artist, duration ];
				audiosData.push(audio);
			}
			ipcRenderer.sendSync('parse_result', audiosData)
		}
		prevWh = newWh;
	}, scrollInterval);
};
run();
