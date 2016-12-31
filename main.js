// DEP SECTION

const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')
const fs = require('fs')
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var yaml_config = require('node-yaml-config');
var config = yaml_config.load(__dirname + '/config.yml');

const {ipcMain} = require('electron');

var Excel = require('exceljs');

let mainWindow
let commandWindow

var gen = null;

// UTILS SECTION

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
    yield ids.shift();
  }
}

function insertDocumentWithUpdate(db, cb, doc) {
  var collection = db.collection('audios');
  // Insert some documents
  collection.update({uid: doc.uid}, doc, {upsert:true}, function(err, result) {
    assert.equal(err, null);
    cb(result);
  });
}

// CREATE WINDOWS SECTION

function createParseWindow(contentScript) {

  // one load
  mainWindow = new BrowserWindow({width: 1200, height: 860, darkTheme: true, resizable: false,
    webPreferences: {
      defaultEncoding: "utf-8",
      nodeIntegration: true,
      webSecurity: true,
      preload: path.resolve(path.join(__dirname, './preload.js'))
    },
  });
  // mainWindow.webContents.openDevTools();

  const {session} = require('electron')
  const cookie = {url: 'https://vk.com', name: 'remixsid', value: config.user.remixsid}
  session.defaultSession.cookies.set(cookie, (error) => {
    if (error) console.error("APP ERR: " + error)
  })

  // mainWindow.setMenu(null);
  mainWindow.on('closed', function () {
    mainWindow = null
  })

  /////////////////////////////////////////////////////////////
  var id = gen.next().value;

  console.log("load page: " + "https://vk.com/audios" + id + '#' + id);
  mainWindow.loadURL("https://vk.com/audios" + id + '#' + id);
  mainWindow.webContents.executeJavaScript(contentScript);
  /////////////////////////////////////////////////////////////
}

// command interface
function createCommandWindow(){
  commandWindow = new BrowserWindow({width: 1000, height: 800, darkTheme: true, resizable: false,
    webPreferences: {
      defaultEncoding: "utf-8",
      nodeIntegration: true,
      webSecurity: true,
      preload: path.resolve(path.join(__dirname, './preload.js'))
    },
  });
  // commandWindow.webContents.openDevTools();
  
  // commandWindow.setMenu(null)
  commandWindow.loadURL(`file://${__dirname}/command.html`)
  commandWindow.on('closed', function () {
    commandWindow = null
  })
}

// IPC EVENT SECTION

ipcMain.on('parse_result', (event, data) => {

    readFile('./exec.js', function(contentScript){

      // access denied
      if (data[0] == "error") {
        console.log("#"+data[0]+": ACCESS DENIED")
        var id = gen.next().value;
        if (!id) {
          console.log("IDS ENDED");
          return;
        }
        console.log("load page: " + "https://vk.com/audios" + id + '#' + id);
        mainWindow.loadURL("https://vk.com/audios" + id + '#' + id);
        mainWindow.webContents.executeJavaScript(contentScript);
      } else {
        MongoClient.connect(config.db.connect, function(err, db) {
          assert.equal(null, err);
          console.log("Connected successfully to server");
          console.log("#"+data[0]+" audios count: " + data.slice(1).length)
          var doc = {
            'uid' : data[0],
            'audios' : data.slice(1)
          };

          insertDocumentWithUpdate(db, function() {
            // console.log('success update!');
            var id = gen.next().value;
            if (!id) {
              console.log("IDS ENDED");
              return;
            }
            mainWindow.loadURL("https://vk.com/audios" + id + '#' + id);
            mainWindow.webContents.executeJavaScript(contentScript);
            console.log("Close connect to MongoDb");
            db.close();
          }, doc);
        });
      }
    });

  event.returnValue = 'ok'
})

ipcMain.on('parse_run', (event, data) => {
  MongoClient.connect(config.db.connect, function(err, db) {
    assert.equal(null, err);
    console.log("Close connect to MongoDb");
    db.close();

    var arrayIds = data.match(/[^\r\n]+/g);
    // global ids generator
    gen = nextIdGen(arrayIds);

    readFile('./exec.js', function(contentScript){
      createParseWindow(contentScript);
    });

  });
    
  event.returnValue = 'ok'
});

ipcMain.on('search_run', (event, data) => {

  var query = fs.readFileSync('./query.js').toString();

  MongoClient.connect(config.db.connect, function(err, db) {
    assert.equal(null, err);
    console.log("Connected successfully to server");

    db.eval(query, data, {nolock:true}, function(err, result){
      if (err) {
        console.log(err.message);
      } else {
        // data return as JSON object
        console.log(result.length);
        for (var i = 0; i < result.length; i++) {
          console.log("http://vk.com/id"+result[i].uid);
          console.log(result[i].finded);
        }
      }
      event.returnValue = {
        count: result.length,
        uids: result.map(function(v){return v.uid;})
      };
      console.log("Close connect to MongoDb");
      db.close();

/*      var workbook = new Excel.Workbook();
      var sheet = workbook.addWorksheet('audio_parser');
      for (var i = 0; i < result.length; i++) {
        sheet.addRow(result[i]).commit();
      }
      sheet.commit();

      workbook.commit().xlsx.writeFile('./result.xls')
      .then(function() { console.log("write result!"); });
*/    });
  });

});

// APP EVENT SECTION

app.on('ready', function(){
});
app.on('ready', createCommandWindow);

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
app.on('activate', function () {
  if (mainWindow === null) {
    createCommandWindow()
  }
})
