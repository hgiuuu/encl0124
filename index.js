// アプリケーション作成用のモジュールを読み込み
const {app, BrowserWindow, Menu, BrowserView, ipcMain, screen} = require('electron');
const express = require('express');
const http = express();
const path = require('path');
const Store = require('electron-store');
const store = new Store({         // 設定の保存
  cwd: app.getPath('userData'),   // 保存先のディレクトリ
  name: 'config',                 // ファイル名
  fileExtension: 'json',          // 拡張子
  defaults: {
    show_titleBar: true,
    show_menu: true,
    show_dev: false,
    fullscreen: false,
    maximize: false,
  },
});

// ウィンドウのデフォルトサイズ
const DEFAULT_SIZE = {
  width: 800,
  height: 600
}

// 右のメッセージが出る場合、GPUアクセラレーションを使用しない -- Passthrough is not supported, GL is disabled, ANGLE is
// WebGL  3D CSS アニメーションを使う場合、外すこと。
app.disableHardwareAcceleration();

// メインウィンドウ
let mainWindow;

// Mac or Win
const isMac = process.platform === "darwin";

//================== End =====================
//============================================

//
// メニュー
//
const menuSettings = 
[
  {
    label: "File",
    submenu: [
      {
        label: "Quit",
        accelerator: "CommandOrControl+Q",
        click() {
          app.quit();
        },
      },
    ],
  },
  { // 表示設定
    label: 'View',
    submenu: [
      {
        label: 'タイトルバー',
        type: 'checkbox',
        checked: store.get('show_titleBar'),
        accelerator: 'CommandOrControl+Shift+T',
        click: () => {
          // ストアに新しい値を保存
          store.set('show_titleBar', !store.get('show_titleBar'));
          setWindowPosSize();
          // ウィンドウごとリロード
          app.relaunch();
          app.exit();
        },
      },
      {
        label: 'メニューバー',
        type: 'checkbox',
        checked: store.get('show_menu'),
        accelerator: 'CommandOrControl+Shift+M',
        click: () => {
          // メニューバーの表示/非表示を反転
          mainWindow.setMenuBarVisibility(!store.get('show_menu'));
          // ストアに新しい値を保存
          store.set('show_menu', !store.get('show_menu'));
        },
      },
      {
        id: 'dev',
        label: 'DevTools',
        type: 'checkbox',
        checked: store.get('show_dev'),
        accelerator: 'CommandOrControl+Shift+D',
        click: () => {
          mainWindow.webContents.openDevTools();
          // ストアに新しい値を保存
          store.set('show_dev', !store.get('show_dev'));
        },
      },
    ],
  }
];

if (isMac) {
  menuSettings = [
    {
      label: "", // Dummy label for Mac menu bar
    }
  ].concat(menuSettings);
}

const menuTemplate = Menu.buildFromTemplate(menuSettings);

//================== メニュー End =====================
//====================================================


/**
 * メインウィンドウを作成
 *
 * @return {void}
 */
function createWindow() {

  // 保存されている前回の位置とサイズ
  const pos  = store.get('window.pos')  || getCenterPosition();
  const size = store.get('window.size') || [DEFAULT_SIZE.width, DEFAULT_SIZE.height];
  
  // メインウィンドウを作成
  mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: false, // 
      contextIsolation: true, // 今回の使い方ではセキュリティ上不要だがtrue（省略時もtrue）
      preload: path.join(__dirname, 'preload.js'),  // rendererとのやり取りを仲介するもの
    },
    frame: store.get('show_titleBar'),            // タイトルバー 
    show: false,                                  // ウィンドウ初期表示
    fullscreen: store.get('fullscreen'),          // フルスクリーン
    width: size[0],                               // 位置とサイズ
    height: size[1],
    x: pos[0],
    y: pos[1],
  });

  // メニューバーをセット
  Menu.setApplicationMenu(menuTemplate);
  mainWindow.setMenuBarVisibility(store.get('show_menu'));
  // 前回終了時の状態による（最大化）
  if (store.get('maximize')) mainWindow.maximize();
  // メインウィンドウにindex.html表示
  mainWindow.webContents.loadFile('index.html');

  // createWindow
  // 以下　GET Action
  //=====================================

  // localhost:3000へのGETを処理
  http.get('/:action', express.urlencoded({extended: false}), async (req, res) => {

    var act = req.params.action;

    var file_name = 'index.html';

    switch(act) {
      case 'index':
        console.log('view_index:' + act); 
        file_name = 'index.html';
        break;
      case 'a01':
        console.log('view_01:' + act);
        file_name = 'action01.html';
        break;
      case 'a02':
        console.log('view_02:' + act);
        file_name = 'action02.html';
        break;
      default:
        console.log('view_default(e.g. when loading sw.js favicon.ico etc... call from browser):' + act); 
        file_name = '';
        break;
    }

    // 要求されたhtmlを表示
    if (file_name != ''){
      mainWindow.loadFile(file_name).then(() => {
        mainWindow.webContents.send('get-action', [file_name]);
        
      }).catch((error) => {
          console.log(error) 
      });
    }
    
    res.json({
      result: true,
      action: act,
    });
  })

  // express　httpサーバ　listen開始
  http.listen(3000, () => {
    //console.log('listen 3000');
  })

  // 前回終了時の状態による（DevToolsの起動
  if (store.get('show_dev')) mainWindow.webContents.openDevTools();

  // createWindow
  // 以下　イベント
  //====================================

  // DevToolsが閉じられたときの処理
  mainWindow.webContents.on('devtools-closed', () => {
    store.set('show_dev', false);  // 設定
    const menu = Menu.getApplicationMenu();
    const item = menu.getMenuItemById('dev');
    item.checked = false;  // チェックを外す
  });

  // 準備が整ったら表示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  });

  // フルスクリーン,最大化　切り替えたときに実行
  mainWindow.on('enter-full-screen', ()=>{
    store.set('fullscreen', true);
  });
  mainWindow.on('leave-full-screen', ()=>{
    store.set('fullscreen', false);
  });
  mainWindow.on('maximize', ()=>{
    store.set('maximize', true);
  });
  mainWindow.on('unmaximize', ()=>{
    store.set('maximize', false);
  });

  // ウィンドウが閉じられる直前に実行
  mainWindow.on('close', ()=>{
    setWindowPosSize();
  });

  // メインウィンドウが閉じられたときの処理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

//  APP初期化が完了したときウィンドウ作成
//app.on('ready', createWindow);
app.whenReady().then(() => {
  createWindow();
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  })
});

//================== createWindow End =====================
//=========================================================



// 全てのウィンドウが閉じたときの処理
app.on('window-all-closed', () => {
  // macOSのとき以外はアプリケーションを終了させます
  if (!isMac) {
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

/**
 * ウィンドウの中央の座標を返却
 *
 * @return {array}
 */
function getCenterPosition(){
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const x = Math.floor( (width - DEFAULT_SIZE.width) / 2)
  const y = Math.floor( (height - DEFAULT_SIZE.height) / 2)
  return([x, y]);
}

/**
 * ウィンドウの座標とサイズを保存
 *
 * @return {void}
 */
function setWindowPosSize(){
  if (!store.get('maximize')) {
    store.set('window.pos', mainWindow.getPosition());
    store.set('window.size', mainWindow.getSize());
  }
}
