document.addEventListener("DOMNodeInserted", function(event) {
    if (!!window && !(!!window.$)) {
        window.$ = window.jQuery = require('./jquery.js');
    }
});

window.onload = function() {
	console.clear();

	var audiosData = [];
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
				var name     = el.find('span.audio_title_inner').text();
				var artist   = el.find('a.audio_performer').text();
				var duration = el.find('div.audio_duration').text();
				audiosData.push([ name, artist, duration ]);
			}
		}
		prevWh = newWh;
	}, scrollInterval);
};
