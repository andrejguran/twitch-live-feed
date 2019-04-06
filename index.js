const TwitchWebhook = require('twitch-webhook')
 
const twitchWebhook = new TwitchWebhook({
    client_id: 'vgt2b3upv59hibswis6le5sgz6rma1',
    callback: 'https://grando.serveo.net',
    secret: '1s2psa212pxs3nm7rhbc3oks5u5oe7', // default: false
    lease_seconds: 30,    // default: 864000 (maximum value)
    listen: {
        port: 8080,           // default: 8443
        host: '0.0.0.0',    // default: 0.0.0.0
        autoStart: false      // default: true
    }
});
 
// set listener for all topics
// twitchWebhook.on('*', ({ topic, options, endpoint, event }) => {
//   console.log('webhook on all');
//     // topic name, for example "streams"
//     console.log(topic)
//     // topic options, for example "{user_id: 12826}"
//     console.log(options)
//     // full topic URL, for example
//     // "https://api.twitch.tv/helix/streams?user_id=12826"
//     console.log(endpoint)
//     // topic data, timestamps are automatically converted to Date
//     console.log(event)
// })
 
// set listener for topic
twitchWebhook.on('users/follows', ({ event }) => {
  console.log('webhook on users/follows');
    console.log(event)
})

twitchWebhook.on('unsubscibe', (obj) => {
  twitchWebhook.subscribe(obj['hub.topic']);
  console.log('resubscribing', obj['hub.topic']);
})
 
// subscribe to topic
const ids = [
  12826,
  85875535, 
  181077473, 
  28633374, 
  51496027, 
  29506118, 
  38594688, 
  31688366, 
  15310631, 
  41040425, 
  100815342, 
  49207184, 
  102381201, 
  139470326, 
  22484632, 
  26991613,
  99246707
];

 ids.map((id) => {
   twitchWebhook.subscribe('users/follows', {
       first: 1,
       to_id: id
   })
   console.log('subscribe', id);
 });
 
// renew the subscription when it expires
// twitchWebhook.on('unsubscibe', (obj) => {
//   twitchWebhook.subscribe(obj['hub.topic'])
// })
 
// tell Twitch that we no longer listen
// otherwise it will try to send events to a down app
process.on('SIGINT', () => {
  // unsubscribe from all topics
  twitchWebhook.unsubscribe('*')
 
 ids.map((id) => {
  twitchWebhook.unsubscribe('users/follows', {
    first: 1,
    to_id: id
  })

  console.log('unsubscribe', id);
});
  // or unsubscribe from each one individually
  
console.log('gracefully shutting down');
 setTimeout(() => {
  console.log('bye bye')
  process.exit(0);
}, 3000);
  
})

twitchWebhook.listen();

console.log('started server');
