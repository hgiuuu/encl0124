// アプリケーション作成用のモジュールを読み込み
const {app, BrowserWindow, BrowserView, ipcMain} = require('electron');
const express = require('express');
const http = express();
const path = require('path');

// メインウィンドウ
let mainWindow;
let count = 0;

function createWindow() {
  // メインウィンドウを作成します
  mainWindow = new BrowserWindow({
    webPreferences: {
      //nodeIntegration: false,
      //contextIsolation: false,
      preload: path.join(__dirname, 'preload.js'),
    },
    width: 800, height: 600,
  });


  // メインウィンドウに表示する
  mainWindow.webContents.loadFile('index.html');


// get
  http.get('/:action', express.urlencoded({extended: false}), async (req, res) => {

    var act = req.params.action;
    count++;

    switch(act) {
      case 'a01':
        console.log('view01');
        mainWindow.webContents.send('get-action', ['action01.html',count]);
        //mainWindow.loadFile('action01.html');
        break;
      case 'a02':
        console.log('view02');
        mainWindow.webContents.send('get-action', ['action02.html',count]);
        //mainWindow.loadFile('action02.html');
        break;
      default:
        console.log('view_default');
        mainWindow.webContents.send('get-action', ['index.html',count]);
        //mainWindow.loadFile('index.html');
        break;
    }

    res.json({
      result: true,
      action: act,
    });
  })

  http.listen(3000, () => {
    //console.log('listen 3000');
  })

  // デベロッパーツールの起動
  mainWindow.webContents.openDevTools();

  // メインウィンドウが閉じられたときの処理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

//  初期化が完了した時の処理
//app.on('ready', createWindow);
app.whenReady().then(createWindow);

// 全てのウィンドウが閉じたときの処理
app.on('window-all-closed', () => {
  // macOSのとき以外はアプリケーションを終了させます
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
// アプリケーションがアクティブになった時の処理(Macだと、Dockがクリックされた時）
app.on('activate', () => {
  // メインウィンドウが消えている場合は再度メインウィンドウを作成する
  if (mainWindow === null) {
    createWindow();
  }
});