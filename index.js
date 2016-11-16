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
//var HOSTIP = process.env.FQDN;
var HOSTIP = "10.105.231.63";
//var PUERTO = process.env.PUERTO;
var PUERTO = 8443; 
// your express configuration here
var PKGCLOUD = "10.105.231.23";

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

var login = qr.image("https://"+HOSTIP+":8443/loginRemoto" , {type: 'png'});
login.pipe(require('fs').createWriteStream('login.png'));
var registro = qr.image("https://"+HOSTIP+":8443/registroRemoto" , {type: 'png'});
registro.pipe(require('fs').createWriteStream('registro.png'));

app.get(/^(.+)$/, function(req,res,next){
	switch(req.params[0]){
		case '/':
			var body="<script>var connection = new WebSocket('wss://"+HOSTIP+":8443/' , ['soap','xmpp']);connection.onmessage = function (e) {        if (e.data == 'usuario logueado'){window.location = 'http://www.google.com';}console.log('Server: ' + e.data);};</script><table><tbody><tr><td align='center' style='width:10%'>Login</td><td align='center'style='width:10%'>Registrarse</td></tr><tr><td><img src='login.png' style='display:block;  margin:auto; width:30%'></td><td><img src='registro.png' style='display:block;  margin:auto; width:30%'></td></tr></tbody></table>";

			res.send(body);
			break;
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
			var body="<script src='fingerprint2.js'></script><script type='text/javascript' src='https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js'></script><script>var fp = new Fingerprint2();var xhr = new XMLHttpRequest();fp.get(function(result, components){        var usuario = {                id: result        };        enviarPOST(JSON.stringify(usuario));        document.body.innerHTML = 'Login Correcto';        });function enviarPOST(json){        $.ajax({                url: 'https://"+HOSTIP+":8443/iniciarSesion',                type: 'POST',                dataType: 'json',                data: json,                contentType: 'application/json; charset=utf-8',                success: function (data) {                },                error: function (result) {                }        });}</script>";
			res.send(body);
			break;
		case '/registroRemoto':	
			var body="<!DOCTYPE HTML><html><script src='fingerprint2.js'></script><script type='text/javascript' src='https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js'></script><script>var fp = new Fingerprint2();var xhr = new XMLHttpRequest();var fingerprint = '';fp.get(function(result, components){      			fingerprint=result;	});	function registrarse(usuario,pass){  var usuario_json={'username':usuario,'password':pass}; console.log(usuario_json);  			enviarPOST(JSON.stringify(usuario_json)); };function guardarUsuario(token){ console.log('id:'+fingerprint + ' token:' + token.responseText);};		function enviarPOST(json){        		$.ajax({                url: 'https://" +PKGCLOUD +":3000/getToken',                type: 'POST',                dataType: 'json',                data: json,                contentType: 'application/json; charset=utf-8',                success: function (data) {   },                error: function (result) { if(result.status==200){console.log(result.status); guardarUsuario(result);}else{console.log(result.status);}      }        });}; var usuario='usuario'; var password='password';		</script>		<table><tbody><tr><td>Usuario:</td><td><input id='usuario'></td></tr><tr><td>Password:</td><td><input id='password'></td></tr><tr><td colspan='2' align='center'>	<button onClick='registrarse(document.getElementById(usuario).value,document.getElementById(password).value)'>Aceptar</button></td></tr></tbody></table></html>";
			res.send(body);
			break;
		case '/inicial':
			var body=
"<script>var connection = new WebSocket('wss://"+HOSTIP+":8443/' , ['soap','xmpp']);connection.onmessage = function (e) {        if (e.data == 'usuario logueado'){                window.location = 'http://www.google.com';        }  console.log('Server: ' + e.data);};</script>";
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
			break;	
		case '/iniciarSesion':
			var id = req.body.id;
			if(usuarioLogueado == id){
			//enviar notificación al browser para que vea que el usuario se logueo
			console.log(wss.clients);
			usuLogueado();
			}	
		default:
			break;
	}
});
