import React, { Component, useState, useEffect, useReducer } from "react";
import { BrowserRouter as Router, Route, Link } from "react-router-dom";

const appReducer = (state, action) => {
  if (action.type === "newFollow") {
    let newState = state.slice(0, 9);
    newState.unshift(action.data);
    return newState;
  }

  return state;
};

function FollowLead({ channelId }) {
  const [state, dispatch] = useReducer(appReducer, []);
  useEffect(() => {
    let webSocket = new WebSocket("ws://"+window.location.hostname+(window.location.port ? ':'+window.location.port: '')+"/ws/" + channelId);
    webSocket.onmessage = function(event) {
      dispatch({ type: "newFollow", data: JSON.parse(event.data) });
    };
  }, []);

  const follows = state.map((follow, i) => {
    return (
      <div key={i}>
        {new Date(follow.followed_at).toLocaleTimeString()} - {follow.from_name}
      </div>
    );
  });

  return (
    <div>
      10 Newest followers
      <hr />
      {follows}
    </div>
  );
}

function FollowBoard({ channelName }) {
  const [channelId, setChannelId] = useState(null);
  useEffect(() => {
    fetch("/twitch/channel/" + channelName)
      .then(response => {
        if (response.status === 200) {
          return response.json();
        } else {
          return Promise.reject(response.status);
        }
      })
      .then(data => {
        setChannelId(data.channelId);
      })
      .catch(error => {
        setChannelId(false);
      });
  }, []);

  return (
    <div>
      {channelId === null ? <span>Loading...</span> : null}
      {channelId === false ? <span>Channel not found</span> : null}
      {channelId ? <FollowLead channelId={channelId} /> : null}
    </div>
  );
}

function TwitchChat({ channelName }) {
  return (
    <iframe
      frameborder="0"
      scrolling="no"
      id="chat_embed"
      src={"https://www.twitch.tv/embed/" + channelName + "/chat"}
      height="427"
      width="285"
    />
  );
}

function TwitchVideo({ channelName }) {
  return (
    <iframe
      src={"https://player.twitch.tv/?channel=" + channelName}
      height="427"
      width="570"
      frameborder="1"
      scrolling="no"
      allowfullscreen="no"
    />
  );
}

function Index() {
  const [channelName, setChannelName] = useState("");

  return (
    <div class="jumbotron jumbotron-fluid">
      <div class="container">
        <h1 class="display-4">Welcome to Twitch live feed!</h1>
        <p class="lead">
          Please enter a twitch username of your favourite streamer
        </p>
        <input
          type="text"
          onChange={event => setChannelName(event.target.value)}
        />
        <br />
        <br />
        {channelName ? (
          <Link
            className="btn btn-primary btn-lg"
            to={"/channel/" + channelName}
          >
            Watch {channelName} »
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function Channel({ match }) {
  const channelName = match.params.channelName;

  return (
    <div class="container">
      <h1 class="display-4">Channel - {channelName}</h1>

      <Link to="/">« back home</Link>
      <hr />
      <div class="row">
        <div class="col-3">
          <FollowBoard channelName={channelName} />
        </div>
        <div class="col-6">
          <TwitchVideo channelName={channelName} />
        </div>
        <TwitchChat channelName={channelName} />
        <div class="col-3" />
      </div>
    </div>
  );
}

class App extends Component {
  render() {
    return (
      <Router>
        <Route path="/" exact component={Index} />
        <Route path="/channel/:channelName" component={Channel} />
      </Router>
    );
  }
}

export default App;
