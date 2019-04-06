### Setup

client
```
cd client
npm install
npm run build
```

server
```
cd ..
npm install
CLIENT_ID="XXX" CALLBACK_URL="https://example.com/twitch/webhook" CLIENT_SECRET="YYY" node app.js
```

### Demo
http://165.227.146.243:3000

![](/demo.gif?raw=true)

### Scaling

8 core / 30 GB machine can handle ~0.5mil websocket connections. To scale current application model above that can be problematic due to the fact that every new machine would have different twitch webhook callback url and we can scale only until we hit twitch api limits (documentation currently doesn't say anything about the limits on cb urls).
To scale without this limitation I propose spliting current logic into two different lambda functions responsible for handling twitch webhooks and sending messages to connected clients. With lambda solution we should be able to handle way over the 900mil clients / day.

### AWS diagram
![](/diagram.jpg?raw=true)
