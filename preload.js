// var MongoClient = require('mongodb').MongoClient
// var assert = require('assert');
// var yaml_config = require('node-yaml-config');
// var config = yaml_config.load(__dirname + '/config.yml');
// const {ipcRenderer} = require('electron');

// MongoClient.connect(config.db.connect, function(err, db) {
// 	assert.equal(null, err);

// 	// db.audios.count()
// 	ipcRenderer.send('db_info', 123);
// 	db.close();
// });

window.addEventListener('load', () => {
	//inject libs to page
	window.$ = window.jQuery = require('./bower_components/jquery/dist/jquery.min.js');
	require('./bower_components/bootstrap/dist/js/bootstrap.min.js');
	require('./bower_components/bootstrap-file-input/bootstrap.file-input.js');


});
