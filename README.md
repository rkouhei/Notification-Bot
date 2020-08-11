# Notification-Bot

![node version](https://img.shields.io/badge/node_version->=10-informational)
![LICENSE](https://img.shields.io/github/license/rkouhei/Notification-Bot)

## DEMO
<img width="487" alt="notification-bot-demo1" src="https://user-images.githubusercontent.com/32559426/89857427-fea60980-dbd6-11ea-99ed-15380dd72f05.png">
<img width="487" alt="notification-bot-demo2" src="https://user-images.githubusercontent.com/32559426/89857449-18475100-dbd7-11ea-9fc9-fffbb17fa56f.png">

## 概要
*世の中には30分ごとにWebサイトを監視するという謎のバイトがあるらしい*🤔

Notification-Bot(以下、本Bot)は、任意の時間間隔でWebサイト/Twitterアカウントの更新を監視し、[LINE BOT](https://developers.line.biz/ja/services/messaging-api/)で通知することができる。また、サイトのどの箇所が更新したかも通知することができる。

また本Botは定期実行する必要があり、Hostingサービスとして[Firebase](https://firebase.google.com/?hl=ja)を使用する前提で作成している。

## デプロイまでの流れ

1. LINE BOTを作成する
2. Twitter APIトークンを作成する
3. Firebase Projectを作成する(Blazeプラン)
4. [Realtime Databaseの設計を行う](#Realtime-Databaseの設計)
5. [必要に応じてファイル内容の変更を行う](#変更が必要な箇所)
6. firebaseへデプロイする

### Realtime Databaseの設計

```json
"db": {
  "HTML": {
    "1": {
      "body": "dummy",
      "id": 1,
      "mode": "dummy",
      "url": "dummy"
    },
    "2": {
      "body": "dummy",
      "id": 2,
      "mode": "dummy",
      "url": "dummy"
    }
  },
  "TWITTER": {
    "1": {
      "id": 1,
      "time": "dummy",
      "twitterid": "dummy"
    },
    "2": {
      "id": 2,
      "time": "dummy",
      "twitterid": "dummy"
    }
  },
  "USERID": {
    "1": {
      "id": 1,
      "userid": "dummy"
    },
    "2": {
      "id": 2,
      "userid": "dummy"
    }
  }
}
```

### 変更が必要な箇所

functions/ | 変更内容
-----------| ------
index.js | module.exportsにて、監視開始時間/監視終了時間/定期監視時間を変更する

functions/data/ | 変更内容
--------------- | ------
site.json | 監視したいURL/Twitterアカウントを記述する
template_message.json | メッセージを変更する

functions/env/ | 変更内容
-------------- | ------
db-url.json | Firebase realtime databaseのurlを記載する
firebase-project.json | Firebaseプロジェクトの情報を記載する
linebot.json | LineBotのアカウント情報を記載する
twitter_api_token.json | Twitterトークン情報を記載する

## ローカルでの実行、デプロイ
上記のファイルを変更した後、ローカルでの実行やデプロイが可能となる。
```
~Notification-Bot/
> firebase deploy
```

### ローカルでの実行
1. node_modulesをインストールする
```
~Notification-Bot/
> cd functions

~Notification-Bot/functions/
> npm install
```

2. funtionsのserve
```
~Notification-Bot/functions/
> cd ..

~Notification-Bot/
> firebase serve --only hosting,functions
```

3. ngrokを使いトンネリング(好みのポートで)
```
~
> ngrok http 8000
```

4. Webhookの設定
LINE DevelopersのBotのWebhook settingsに、ngrokが発行したURLを登録する

## 注意

- 本BotはFirebaseのBlazeプランで動かす前提となっている。Blazeプランは従量課金制となっているため、注意すること。
    - 参考文献
        - https://firebase.google.com/pricing?hl=ja

- 実行時にメモリ不足のエラーが出た場合は、firebase functionsのメモリを増設する必要がある

## Contributor
- [rkouhei](https://github.com/rkouhei)
- [closekn](https://github.com/closekn)

## License
"Notification-Bot" is under [MIT license](https://en.wikipedia.org/wiki/MIT_License).