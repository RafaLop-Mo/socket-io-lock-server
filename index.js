var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

const connectedSockets = [];
// This is mocking intial data coming from DB
let serverData = { name: 'Rafael', lastName: 'Lopez', country: 'Spain' };

// Sets a 3s timer, mocking a server call to save a file
const mockSaveFile = async (data) => {
  serverData = { ...serverData, ...data};
  return new Promise((resolve) => setTimeout(resolve, 3000));
};

const lockAllClients = (lockedData) => {
  connectedSockets.map((socket) => socket.emit('lock', lockedData));
};

const unLockAllClients = () => {
  connectedSockets.map((socket) => socket.emit('unlock'));
};

const broadcastNewData = () => {
  connectedSockets.map((socket) => socket.emit('newData', serverData));
};

//Socket event config
io.on('connection', function(socket) {
  console.log('new client connected');
  connectedSockets.push(socket);
  broadcastNewData();

  socket.on('saveData', (data) => {
    console.log('Data reveived form client', data);
    console.log('Activating lock and sending data to S3');
    // Lock all clients
    lockAllClients(data);
    // Save File
    mockSaveFile(data).then(() => {
      // Unlock all clients
      unLockAllClients();
      // Broadcast new data
      broadcastNewData();
    });
  });

  socket.on('disconnect', () => console.log('Client disconnected'));
});

// Listen
http.listen(3000, function() {
  console.log('listening on *:3000');
});
