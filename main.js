const electron = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow

const path = require('path')
const url = require('url')
const fs = require('fs')

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
function createWindow (ids) {
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

  console.log(ids[3]);  
  mainWindow.loadURL("http://vk.com/audios" + ids[3]);

  // mainWindow.setMenu(null)

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}



readFileToArray('./ids.txt').then( ids => {

  app.on('ready', createWindow);
  app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })
  app.on('activate', function () {
    if (mainWindow === null) {
      createWindow(ids)
    }
  })
});
