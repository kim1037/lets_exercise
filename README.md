# Lets Exercise 專案介紹
想打球卻找不到朋友陪你一起打嗎？或有人有球技，卻不知道要去哪裡打球嗎？這個運動揪團網通通幫你解決這些問題！

此專案是以前後端分離開發模式進行，前端使用vue.js作為框架，後端則是使用node.js express架設伺服器，搭配MySQL做資料存放。

## Prerequisites - 開發環境
* node.js - v18.15.0
* express
* mysql2 

## Installation and execution - 安裝與執行步驟
1. 開啟 Terminal, Clone 此專案至本機:
```
git clone https://github.com/kim1037/AC-expense-tracker.git
```

2. 開啟終端機(Terminal)，進入存放此專案的資料夾
```
cd lets_exercise
```

3. 安裝所需套件 - 請參見 package.json
```
npm install
```

4. 修改config中的database資訊，並在terminal中輸入依序指令建立資料庫及種子資料
```
npm run createDB  // 建立DB
npm run createTables // 建立Tables
npm run seeders // 建立種子資料
```

5. 啟動伺服器，執行 server.js 檔案
```
npm run dev
```

當 terminal 出現以下字樣，表示伺服器已啟動
```
The server is running on http://localhost:3000
```
