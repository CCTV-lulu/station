var Config = require('./config/default.json');
var async = require('async');
var request = require('request');
var crypto = require('crypto');
const EventEmitter = require('events');
var emitter = new EventEmitter();
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var http = require('http').Server(app);
var io = require('socket.io-client');
// var SerialPort = require('serialport');
var fs = require('fs');

var socket;
var sms_socket;
var port;

app.use("/", express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-type', 'Accept');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
    next();
});

app.get('/', function (req, res) {
    res.redirect('configManage.html');
});

app.get('/getConfig', function (req, res) {
    var fs1 = require('fs');
    fs1.readFile('./config/default.json', function (err, data) {
        if (err) throw err;
        var config = JSON.parse(data)
        res.send(config)
    });
});
var postCpunt = 0;
app.post('/startUpStation', function (req, res) {
    if (!emitter) {
        emitter = new EventEmitter();
    }
    if (postCpunt == 0) {
        try {
            var startConfig = JSON.parse(JSON.stringify(Config));
            startConfig['station'].status ="start";
            Config = startConfig;
            fs.writeFile('./config/default.json', JSON.stringify(startConfig));
            startStation();
        }
        catch (err) {
            res.send(false)
        }
        postCpunt++;
    } else {
        res.send('option_item')
    }
});
app.post('/stopUp', function (req, res) {
    emitter = null;
    postCpunt = 0;
    if(port){
        port.close(function () {
            console.log('串口关闭！')
        },function(err){
            console.log(err)
        });
    }
    if(socket){
        socket.disconnect();
    }
    if(sms_socket){
        sms_socket.disconnect();
    }
    var stopConfig = JSON.parse(JSON.stringify(Config));
    stopConfig['station'].status ="stop";
    Config = stopConfig
    fs.writeFile('./config/default.json', JSON.stringify(stopConfig));
    res.send(true);
});
app.post('/changeConfig', function (req, res) {
    var oldConfig = req.body;
    var stationStatus = JSON.parse(JSON.stringify(Config));
    oldConfig['station'].status =  stationStatus['station'].status;
    Config = oldConfig;
    fs.writeFile('./config/default.json', JSON.stringify(oldConfig));
    res.send(true)
});

function init(){
    if(Config['station'].status == 'start'){
        startStation()
    }
}
init();

function startStation() {
    var queueConf = Config['socket'];
    var queueConfStation = Config['station']
    socket= io.connect('http://'+queueConf.server+':'+queueConf.server_port,{query:"station="+queueConfStation.id+""});
    // sms_socket= io.connect('http://'+queueConf.server+':3332',{query:"station="+queueConfStation.id+""});
    // var logger = require("./log4js")(Config['station'].id);
    emitterOn(queueConfStation);
    // setupSerialPort(queueConf, queueConfStation);
    // setInterval(function () {
    //     sendLogFiles(queueConf);
    // }, 1000 * 2);
    sendLogFiles(queueConf);
}

function onRawData(data,queueConfStation, logger) {
    console.log('-------------data')
    // TODO calculate the hash value of this package
    var queueConfStation = Config['station']
    var pkg = {
        station: queueConfStation.id,
        data: data.toString('base64'),
        length: data.length,
        fetched_at: (new Date()).toISOString(),
        sta_id: queueConfStation.sta_id
    };
    if (emitter) {
        // logger.info(pkg);
        emitter.emit('new_pkg', pkg);
    }
}
function emitterOn(queueConfStation) {
    emitter.on('new_pkg', function (pkg) {
        console.log('-------------data')
        socket.emit(''+queueConfStation.id, pkg);
        // sms_socket.emit(''+queueConfStation.id, {status:"connect"});
        console.log('sent');
    });
}

function setupSerialPort(queueConf,queueConfStation,logger) {

    var StreamBrake =require('streambrake');
    var stream = fs.createReadStream(__dirname +'/logs_archive/hangkeyuan-01.data-2017-08-01').pipe(new StreamBrake(300));
    stream.on("data", onRawData);
    stream.on("close", function () {
       // TODO cle//anup: cl//ose log file, close
    });
    // port = new SerialPort(Config['socket'].serial_port, {
    //     baudRate: Config['socket'].baudRate
    // });
    // port.on('open', function () {
    //     port.on('data', function (data) {
    //         onRawData(data, queueConfStation, logger);
    //     });
    // });
    // port.on('error', function (err) {
    //     console.log('Error: ', err.message);
    // })
}

var status = false;
function sendLogFiles(queueConf) {
    var fsSend = require('fs')
    var gracefulFs = require('graceful-fs');
    gracefulFs.gracefulify(fsSend);
    var files = fsSend.readdirSync('./logs');
        async.eachSeries(files, function (filePath, callback) {
        if (filePath.endsWith(".log")|| status!== false) {
            return callback(null, null);
        }
        var path = '/logs/' + filePath;
        var formData = {
            // log_file: fs.createReadStream('/Users/xiaopingfeng/projects/gnss/gnss_pipeline/station/logs/beijing-fxp.log-12-29-21-25'),
            log_file: fsSend.createReadStream(__dirname + path),
            // TODO add md5 code to be sent to server
            // md5: crypto.md5()
        };
        console.log(path);
        status = true;
        request.post({
            url: 'http://101.37.150.119:' + queueConf.log_server_port + '/logs',
            formData: formData
        }, function optionalCallback(err, httpResponse, body) {
            status = false;
            if (err) {
                callback(null, null);
                return console.error('upload failed:', err);
            }
            console.log('Upload successful!  Server responded with:', body);
            fsSend.renameSync(__dirname + path, __dirname + "/logs_archive/" + filePath);
            callback(null, null);
        });
    }, function (err, results) {
            status = false;
        // results now equals an array of the existing files
    });

}
http.listen(8899, function () {
    console.log(8899);
});
