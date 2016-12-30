function (data) {
	function hmsToSecondsOnly(str) {
	    var p = str.split(':'),
	        s = 0, m = 1;

	    while (p.length > 0) {
	        s += m * parseInt(p.pop(), 10);
	        m *= 60;
	    }
	    return s;
	}
	
	if (data.uids) {
		var uids = data.uids.match(/[^\r\n]+/g);
	}
	var phrases = data.phrases.match(/[^\r\n]+/g);
	var type_search = data.type_search;
	var accord = data.accord || false;
	var duration_max = data.duration_max || false;
	var duration_min = data.duration_min || false;

	// fuzzy search
	if (!accord) {
		phrases = phrases.map(function(phrase) {
		  return phrase.toLowerCase();
		});
	}

	var docs = [];
	if (data.uids) {
		var cur = db.audios.find({ uid:{$in:uids} });
	} else {
		var cur = db.audios.find({});
	}
	cur.forEach( function(doc) {
		var matches = 0;
		var finded = [];

		for (var i = 0; i < doc.audios.length; i++) {
			var title  = doc.audios[i][0];
			var artist = doc.audios[i][1];
			var duration = hmsToSecondsOnly(doc.audios[i][2]);


			if (type_search == "1") {
				var haystack = artist;
			} else {
				var haystack = title;
			}

			var find = false;
			for (var j = 0; j < phrases.length; j++) {
				if (accord) {
					if (haystack == phrases[j]) {
						find = true;
						finded.push(doc.audios[i]);
					}
				// fuzzy search
				} else {
					lHaystack = haystack.toLowerCase();
					if (lHaystack.indexOf(phrases[j]) != -1) {
					   find = true;
					   finded.push(doc.audios[i]);
					}
				}
			}

			if (find) {
				// find match!
				if (duration_max && duration > duration_max) {
					continue;
				}
				if (duration_min && duration < duration_min) {
					continue;
				}
				matches++;
			}
		}
		doc.finded = finded;

		if (matches >= data.matches) {
			docs.push(doc);
		}
	});

  	return docs;
}
