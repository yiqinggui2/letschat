
/**
 * Module dependencies.
 */

var express = require('express') 
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server)
  , routes = require('./routes')
  , path = require('path')
  , parseSignedCookies = require('connect').utils.parseSignedCookies
  , convertToConnectStyleSignedCookie = require('express/node_modules/cookie').parse
  , util = require('./routes/util');

server.listen(8000);

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('letuschat'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
 	app.use(express.errorHandler());
}

app.get('/', function (req, res) {
  	res.sendfile(__dirname + '/index.html');
});

app.get('/error', function (req, res) {
  	res.sendfile(__dirname + '/error.html');
});

app.get('/evil', function (req, res) {
  	res.sendfile(__dirname + '/evil.html');
});

app.get('/chatroom', function(req, res) {
	var roomnumber = req.signedCookies.roomnumber;
	if(roomnumber == null) {
		res.redirect('/error');
	}
	else {
		res.sendfile(__dirname + '/chat.html');
	}
});

app.get('/createnewroom', function(req, res) {
	res.cookie('roomnumber', util.genRoomAccessCode(), { signed: true });
	res.redirect('/chatroom');
});

io.configure(function (){
  	io.set('authorization', function (handshakeData, callback) {
    	var signedCookie = convertToConnectStyleSignedCookie(handshakeData.headers.cookie);
		var decrypted_cookie = parseSignedCookies(signedCookie, 'letuschat');
		var roomnumber = decrypted_cookie['roomnumber'];
		if (roomnumber) {
			//roomnumber is verified, open a connection
			callback(null, true);
		}
		else {
			//roomnumber is not verified, refuse to open a connection
			callback(null, false);
		}
  	});
});

io.sockets.on('connection', function (socket) {
  	socket.emit('set nickname');
  	socket.on('set nickname', function (userprofile) {
    	socket.set('nickname', userprofile['nickname'], function () {
      	  socket.emit('ready');
		  //console.log('nickname: ' + userprofile['nickname']);
		  var welcome_msg = 'Hello ' + userprofile['nickname'] + '! Welcome to the CHAT ^-^';
		  socket.emit('system_msg',{msgcontent:welcome_msg});
		  socket.broadcast.emit('system_msg',{msgcontent:userprofile['nickname'] + ' has joined the chat.'});
    	});
  	});

	socket.on('send msg', function (user_msg) {
    	socket.get('nickname', function (err, name) {
      	  socket.broadcast.emit('receive msg',{msgcontent: name + ' says: ' + user_msg['msg_content']});
    	});
  	});
	
	socket.on('disconnect', function () {
    	socket.get('nickname', function (err, name) {
      	  socket.broadcast.emit('system_msg',{msgcontent: name + ' has left the chat.'});
    	});
	});
});



