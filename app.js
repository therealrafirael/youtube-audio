/*
var http = require('http'),
    httpProxy = require('http-proxy');
//
// Create your proxy server and set the target in the options.
//
httpProxy.createProxyServer({
    target: 'http://localhost:'+app.get('port')
}).listen(8000);

//
// Create your target server
//
http.createServer(function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/plain'
    });
    res.write('request successfully proxied!' + '\n' + JSON.stringify(req.headers, true, 2));
    res.end();
}).listen(app.get('port'));
*/

var express = require('express');
var proxy = require('express-http-proxy');
var urlExists = require('url-exists');

var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
    response.render('index');
});

app.get('/exists/:b64url', function (req, res) {
    var rawUrl = new Buffer(req.params.b64url, 'base64').toString('ascii');
    if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
        rawUrl = 'http://' + rawUrl;
    }
    urlExists(rawUrl, function (err, exists) {
        res.status(200).json({
            exists: exists
        });
    });
});

// Where the magic happens
app.get('/site/:b64url', function(req, res) {
    var rawUrl = new Buffer(req.params.b64url, 'base64').toString('ascii');
    if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
        rawUrl = 'http://' + rawUrl;
    }
    urlExists(rawUrl, function(err, exists) {
        if (exists) {
            var urlObject = require('url').parse(rawUrl);
            var urlHost = urlObject.protocol + (urlObject.slashes ? '//' : '') + urlObject.host;
            proxy(urlHost, {
                forwardPath: function(req, res) {
                    return urlObject.path;
                }
            })(req, res);
        } else {
            res.render('index');
        }
    });
});

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
