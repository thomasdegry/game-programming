var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    colors = require ('colors');
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

io.set('log level', 2);

io.sockets.on('connection', function (socket) {

    socket.on('game:start', function (data) {
        socket.join(data.code);
        socket.code = data.code;

        console.log('created room', data.code);
    });

    socket.on('join:request', function (data) {
        if(data.code.length !== 0){
            var room = io.sockets.clients(data.code);

            console.log('received join request for room: ', data.code, '(',room.length,' members)');
            switch(room.length){
                case 0:
                    console.log('This game does not exists');
                    // io.sockets.clients(socket.code)[0].emit('code:wrong');
                    socket.emit('code:wrong');
                    break;
                case 1:
                    //join first player
                    socket.join(data.code);
                    socket.code = data.code;
                    console.log('first player joining room: ', data.code);
                    io.sockets.in(data.code).emit('join:accept', {code: data.code, player:1});
                    break;
                case 2:
                    //player2 joined the game
                    console.log('seccond player joining room: ',data.code);
                    socket.join(data.code);
                    socket.code = data.code;
                    socket.emit('join:accept',{code: data.code, player:2});
                    io.sockets.in(data.code).emit('join:player2', data.code);
                    break;
                default:
                    //room full
                    console.log('attemt to join room ',data.code,' but it\'s full');
                    socket.emit('code:full');
                    break;
            }
        }else{
            console.log('no code!'.redBG);
        }
    });

    socket.on('gameplay:restart', function() {
        console.log('[SERVER] Emit gameplay:restart'.yellow);
        io.sockets.in(socket.code).emit('gameplay:restart');
        // socket.broadcast.to(socket.code).emit('gameplay:restart');
    })

    socket.on('gameplay:start', function () {
        console.log('[SERVER] Emit gameplay:start'.yellow);
        socket.broadcast.to(socket.code).emit('gameplay:start');
    });

    socket.on('gameplay:stop', function () {
        console.log('[SERVER] Emit gameplay:stop'.yellow);
        socket.broadcast.to(socket.code).emit('gameplay:stop');
    });

    socket.on('move', function (data) {
        io.sockets.clients(socket.code)[0].emit('move', data);
    });

    socket.on('speed:change', function (data) {
        io.sockets.clients(socket.code)[0].emit('speed:change', data);
    });

    //deprecated i think...
    socket.on('speed:updated', function(data) {
        // io.sockets.clients(socket.code)[0].emit('speed:updated', data);
        io.sockets.in(data.code).emit('speed:updated', data);
    });
});