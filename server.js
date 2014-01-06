var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    development = true;

server.listen(3000);

app.use(express.static('/game/src/'));

app.get('/', function (req, res) {
    // Determine if we're accessed from a controller device
    // or from a display device
    res.sendfile(__dirname + '/public/index.html');
});

// Serve game
app.get('/game/', function (req, res) {
    var dir = (!!development) ? 'src' : 'out';
    res.sendfile(__dirname + '/game/' + dir + '/index.html');
});

// Serve game assets according to development function
app.get('/game/*', function (req, res) {
    var dir = (!!development) ? 'src' : 'out';
    res.sendfile(__dirname + req.url.replace('game/', 'game/' + dir + '/'));
});

// Serve controller
app.get('/controller/', function (req, res) {
    var dir = (!!development) ? 'src' : 'out';
    res.sendfile(__dirname + '/controller/' + dir + '/index.html');
});

// Serve controller assets according to development function
app.get('/controller/*', function (req, res) {
    var dir = (!!development) ? 'src' : 'out';
    res.sendfile(__dirname + req.url.replace('controller/', 'controller/' + dir + '/'));
});

io.sockets.on('connection', function (socket) {

    socket.on('game:start', function (data) {
        socket.join(data.code);
        socket.code = data.code;

        console.log('created room', data.code);
    });

    socket.on('join:request', function (data) {
        var room = io.sockets.clients(data.code);

        console.log('received join request for room', data.code);

        if (room.length === 1) {
            socket.join(data.code);
            socket.code = data.code;
            console.log('joining room', data.code);

            // Send accept to both controller & game
            io.sockets.in(data.code).emit('join:accept', data.code);
        } else {
            console.log('blabla ' + room.length);
            io.sockets.clients(socket.code)[0].emit('code:wrong');
        }
    });

    socket.on('gameplay:restart', function() {
        io.sockets.clients(socket.code)[0].emit('gameplay:restart');
    })

    socket.on('gameplay:start', function () {
        socket.broadcast.to(socket.code).emit('gameplay:start');
    });

    socket.on('gameplay:stop', function () {
        console.log('[SERVER] Emit gameplay:stop');
        socket.broadcast.to(socket.code).emit('gameplay:stop');
    });

    socket.on('move', function (data) {
        io.sockets.clients(socket.code)[0].emit('move', data);
    });

    socket.on('speed:change', function (data) {
        io.sockets.clients(socket.code)[0].emit('speed:change', data);
        console.log(data);
    });

    socket.on('speed:updated', function(data) {
        // io.sockets.clients(socket.code)[0].emit('speed:updated', data);
        io.sockets.in(data.code).emit('speed:updated', data);
    });
});