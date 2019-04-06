var express = require("express");
var app = express();
var expressWs = require('express-ws')(app);
const uuidv4 = require("uuid/v4");
const request = require("request");
const TwitchWebhook = require("twitch-webhook");
const path = require("path");

let connections = {};
let channelConnections = {};
let channelIntervals = {};
const config = {
  port: process.env.PORT || 3000,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackUrl: process.env.CALLBACK_URL,
  leaseSeconds: 60 * 60
};

const twitchWebhook = new TwitchWebhook({
  client_id: config.clientId,
  callback: config.callbackUrl,
  secret: config.clientSecret,
  lease_seconds: config.leaseSeconds
});

const subscribeToChannel = (channel, connectionId) => {
  if (
    !(channel in channelConnections) ||
    Object.keys(channelConnections[channel]).length === 0
  ) {
    channelConnections[channel] = {};
    twitchWebhook.subscribe("users/follows", {
      first: 1,
      to_id: channel
    });

    if (!channelIntervals[channel]) {
      channelIntervals[channel] = setInterval(() => {
        renewLease(channel);
      }, config.leaseSeconds * 1000);
    }
  }
  channelConnections[channel][connectionId] = true;
};

const unsubscribeFromChannel = connectionId => {
  const channel = connections[connectionId].channel;
  delete connections[connectionId];
  delete channelConnections[channel][connectionId];

  if (Object.keys(channelConnections[channel]).length === 0) {
    twitchWebhook.unsubscribe("users/follows", {
      first: 1,
      to_id: channel
    });
    clearInterval(channelIntervals[channel]);
    delete channelIntervals[channel];
  }
};

const sendToChannel = event => {
  const channel = event.data[0].to_id;

  event.data.forEach(eventData => {
    const channel = eventData.to_id;
    if (channelConnections[channel]) {
      for (var id in channelConnections[channel]) {
        const ws = connections[id];
        ws.send(JSON.stringify(eventData));
      }
    } else {
      twitchWebhook.unsubscribe("users/follows", {
        first: 1,
        to_id: channel
      });
    }
  });
};

const renewLease = channel => {
  if (Object.keys(channelConnections[channel]).length !== 0) {
    twitchWebhook.subscribe("users/follows", {
      first: 1,
      to_id: channel
    });
  } else {
    clearInterval(channelIntervals[channel]);
    delete channelIntervals[channel];
  }
};

twitchWebhook.on("users/follows", ({ event }) => {
  sendToChannel(event);
});

app.get(["/", "/channel/:channelName"], function(req, res, next) {
  res.sendFile(path.join(__dirname + "/client/build/index.html"));
});

app.use(express.static(path.join(__dirname, "client/build")));

app.all("/twitch/webhook", twitchWebhook._requestListener.bind(twitchWebhook));

app.get("/twitch/channel/:channelName", function(req, res) {
  const options = {
    url: "https://api.twitch.tv/kraken/users?login=" + req.params.channelName,
    method: "GET",
    headers: {
      Accept: "application/vnd.twitchtv.v5+json",
      "Client-ID": config.clientId
    }
  };
  request(options, function(error, response, body) {
    let json = JSON.parse(body);
    if (json._total > 0) {
      res.send({ channelId: json.users[0]._id });
    } else {
      res.status(404).end();
    }
  });
});

app.ws("/ws/:channelId", function(ws, req) {
  const connectionId = uuidv4();
  const channel = req.params.channelId;

  ws.id = connectionId;
  ws.channel = channel;
  connections[ws.id] = ws;

  subscribeToChannel(channel, connectionId);

  ws.on("close", function() {
    unsubscribeFromChannel(connectionId);
  });
});

app.listen(config.port);
console.log("started on port "+config.port);

process.on("SIGINT", () => {
  console.log("gracefully shutting down");

  for (var channel in channelIntervals) {
    clearInterval(channelIntervals[channel]);
  }

  for (var channel in channelConnections) {
    twitchWebhook.unsubscribe("users/follows", {
      first: 1,
      to_id: channel
    });
  }

  setTimeout(() => {
    console.log("bye bye");
    process.exit(0);
  }, 1500);
});
