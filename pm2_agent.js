const http = require('http');
const url = require('url');
const pm2 = require('pm2');

// 创建服务器
http.createServer(function (req, res) {
    let pathname = url.parse(req.url).pathname;
    res.writeHead(200);
    if ('/metrics' === pathname) {
        pm2.list(function (err, list) {
            try {
                for (let i = 0; i < list.length; i++) {
                    let pm2Info = list[i];
                    let nodeName = pm2Info.name;
                    let pid = pm2Info.pid;
                    let pm2Env = pm2Info.pm2_env;
                    let axmMonitor = pm2Env.axm_monitor;
                    let metrics = {};
                    for (let key in axmMonitor) {
                        if (axmMonitor.hasOwnProperty(key)) {
                            let val = axmMonitor[key].value + '';
                            key = key.replace(new RegExp(' ', 'g'), '_');
                            let helpType = key;
                            if (val) {
                                val = val.match(/-{0,1}\d+\.{0,1}\d*/)[0];
                            } else {
                                val = -9;
                            }

                            if (key.lastIndexOf(',}') === key.length - 2) {
                                helpType = key.substr(0, key.indexOf('{'));
                                key = key.substr(0, key.length - 1);
                                key = key + 'nodeName="' + nodeName + '",pid="' + pid + '",}';
                            } else {
                                key = key + '{nodeName="' + nodeName + '",pid="' + pid + '",}';
                            }

                            if (!metrics[helpType]) {
                                metrics[helpType] = 'default';
                                let HELP = '# HELP ' + helpType + ' HELP.\n';
                                let TYPE = '# TYPE ' + helpType + ' gauge\n';
                                res.write(HELP);
                                res.write(TYPE);
                            }
                            let record = key + ' ' + val + '\n';
                            res.write(record)
                        }
                    }
                }
            } catch (error) {
                console.error('metrics error %s', error);
            }
            res.end();
        });
    } else if ('/pm2' === pathname) {
        pm2.list(function (err, list) {
            res.write(JSON.stringify(list));
            res.end();
        });
    } else {
        res.write('welcome');
        res.end();
    }
}).listen(8080);
// 控制台会输出以下信息
console.log('Server running at http://127.0.0.1:8080/');