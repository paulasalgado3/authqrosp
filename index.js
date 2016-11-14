var fs = require('fs');
var http = require('http');
var https = require('https');
var privateKey  = fs.readFileSync('sslcert/server.key', 'utf8');
var certificate = fs.readFileSync('sslcert/server.crt', 'utf8');
var qr = require ('qr-image');
var fp = require ('fingerprintjs2');
var bodyParser = require('body-parser');

var credentials = {key: privateKey, cert: certificate};
var express = require('express');
var app = express();
var websocket = require('ws').Server;

var usuarioLogueado = '';
var HOSTIP = process.env.FQDN;
var PUERTO = process.env.PUERTO;
// your express configuration here

//var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

//httpServer.listen(8080);
httpsServer.listen(PUERTO);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
        extended: true
        }));

var wss = new websocket ( { 
	server: httpsServer, 
});

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed. 
  return true;
}

wss.on('connection', function (wss){
	//enviar algo
	wss.send('prueba');

});

function usuLogueado(){
	wss.clients.forEach(function each(client){
	client.send("usuario logueado");
	});
}

app.get(/^(.+)$/, function(req,res,next){
	switch(req.params[0]){
		case '/registro':
			var code = qr.image("https://"+ HOSTIP + "/registroRemoto", { type: 'svg' });
		        res.type('svg');
        		code.pipe(res);
			break;
		case '/login':
			var code = qr.image("https://"+ HOSTIP+"/loginRemoto", {type:'svg'});
			res.type('svg');
			code.pipe(res);
			break;
		case '/loginRemoto':
			var body="<script src='fingerprint2.js'></script><script type='text/javascript' src='https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js'></script><script>var fp = new Fingerprint2();var xhr = new XMLHttpRequest();fp.get(function(result, components){        var usuario = {                id: result        };        enviarPOST(JSON.stringify(usuario));        document.body.innerHTML = 'Login Correcto';        });function enviarPOST(json){        $.ajax({                url: 'https://"+HOSTIP+"/iniciarSesion',                type: 'POST',                dataType: 'json',                data: json,                contentType: 'application/json; charset=utf-8',                success: function (data) {                },                error: function (result) {                }        });}</script>";
			res.send(body);
			break;
		case '/registroRemoto':	
			var body=
"<script src='fingerprint2.js'></script><script type='text/javascript' src='https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js'></script><script>var fp = new Fingerprint2();var xhr = new XMLHttpRequest();fp.get(function(result, components){        var usuario = {                id: result        };        enviarPOST(JSON.stringify(usuario));        document.body.innerHTML = 'Registro correcto';        });function enviarPOST(json){        $.ajax({                url: 'https://" +HOSTIP +"/guardarRegistro',                type: 'POST',                dataType: 'json',                data: json,                contentType: 'application/json; charset=utf-8',                success: function (data) {                },                error: function (result) {                }        });}</script>"
;
			res.send(body);
			break;
		case '/inicial':
			var body=
"<script>var connection = new WebSocket('wss://"+HOSTIP+"/' , ['soap','xmpp']);connection.onmessage = function (e) {        if (e.data == 'usuario logueado'){                window.location = 'http://www.google.com';        }  console.log('Server: ' + e.data);};</script>";
			res.send(body);
			break;
		default:
			res.sendFile(__dirname + req.params[0]);		
			break;
	}
});

app.post(/^(.+)$/, function(req,res,next){
	switch(req.params[0]){
		case '/guardarRegistro':
			usuarioLogueado = req.body.id;
			console.log(req.body.id);
			break;	
		case '/iniciarSesion':
			var id = req.body.id;
			if(usuarioLogueado == id){
			//enviar notificación al browser para que vea que el usuario se logueo
			usuLogueado();
			}	
		default:
			break;
	}
});
