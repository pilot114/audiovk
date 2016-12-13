const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')
const fs = require('fs')
var MongoClient = require('mongodb').MongoClient
var assert = require('assert');


const {ipcMain} = require('electron')

let mainWindow

function readFile(filepath, cb) {
    fs.readFile(filepath, 'utf-8', function (err, data) {
    if(err) {
      console.log("ERROR: " + err.message);
    }
    cb(data);
    });
}
function readFileToArray(filepath) {
  return new Promise(function(resolve, reject) {
    var cb = function(fileContent) {
      var arrayOfLines = fileContent.match(/[^\r\n]+/g);
            resolve(arrayOfLines);
    };
    readFile(filepath, cb);
    });
}

function* nextIdGen(ids) {
  while(ids.length){
    yield ids.pop();
  }
}

function createWindow () {

  // one load
  mainWindow = new BrowserWindow({width: 1080, height: 860, darkTheme: true, resizable: false,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: true,
      preload: path.resolve(path.join(__dirname, './preload.js'))
    },
  });
  const {session} = require('electron')
  const cookie = {url: 'http://vk.com', name: 'remixsid', value: 'f4bd3310154381b8b381adf1458bfb390a80a14448fbf9e3ec531'}
  session.defaultSession.cookies.set(cookie, (error) => {
    if (error) console.error(error)
  })

  // mainWindow.setMenu(null)
  mainWindow.on('closed', function () {
    mainWindow = null
  })

  /////////////////////////////////////////////////////////////
  readFile('./exec.js', function(contentScript){

    readFileToArray('./ids.txt').then( ids => {
      var idsLen = ids.length;
      var gen = nextIdGen(ids);

      var id = gen.next().value;
      console.log("load page: " + "http://vk.com/audios" + id + '#' + id);
      mainWindow.loadURL("http://vk.com/audios" + id + '#' + id);
      mainWindow.webContents.executeJavaScript(contentScript);

      MongoClient.connect(conUrl, function(err, db) {
        assert.equal(null, err);
        console.log("Connected successfully to server");

        ipcMain.on('parse_result', (event, data) => {

          // access denied
          if (data[0] == "error") {
            var id = gen.next().value;
            console.log("load page: " + "http://vk.com/audios" + id + '#' + id);
            mainWindow.loadURL("http://vk.com/audios" + id + '#' + id);
            mainWindow.webContents.executeJavaScript(contentScript);
          } else {
            console.log("Parsed user with ID: " + data[0])
            console.log("Audios count: " + data.slice(1).length)
            var doc = {
              'uid' : data[0],
              'audios' : data.slice(1)
            };

            insertDocumentWithUpdate(db, function() {
              console.log('success insert!');
              var id = gen.next().value;
              console.log("load page: " + "http://vk.com/audios" + id + '#' + id);
              mainWindow.loadURL("http://vk.com/audios" + id + '#' + id);
              mainWindow.webContents.executeJavaScript(contentScript);
            }, doc);
          }

          event.returnValue = 'ok'
        })

        // db.close();
      });
    });
  });
  /////////////////////////////////////////////////////////////
}

// command interface
function createCommandWindow(){
  commandWindow = new BrowserWindow({width: 600, height: 600, darkTheme: true, resizable: false,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: true,
      preload: path.resolve(path.join(__dirname, './preload.js'))
    },
  });
  commandWindow.setMenu(null);
  commandWindow.loadURL(`file://${__dirname}/command.html`)
  commandWindow.on('closed', function () {
    commandWindow = null
  })
}


var conUrl = 'mongodb://172.24.0.121:27017/parse';

var insertDocumentWithUpdate = function(db, cb, doc) {
  var collection = db.collection('audios');
  // Insert some documents
  collection.update({uid: doc.uid}, doc, {upsert:true}, function(err, result) {
    assert.equal(err, null);
    cb(result);
  });
}


app.on('ready', function(){
  createWindow()
});
app.on('ready', createCommandWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
    createCommandWindow()
  }
})
