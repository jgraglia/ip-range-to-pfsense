#!/usr/bin/env nodejs
var request = require("request");
var _ = require("lodash");
var http = require('http');
var os = require("os");
var CIDR = require('cidr-js');
var nslookup = require('nslookup');

var localWebServerPort = 9615;
var cidr = new CIDR();
// GSuite
// https://support.google.com/a/answer/60764?hl=fr
// nslookup -q=TXT _netblocks.google.com 8.8.8.8
// nslookup -q=TXT _netblocks2.google.com 8.8.8.8
// nslookup -q=TXT _netblocks3.google.com 8.8.8.8
var googleCidrs = [];
_.each(['_netblocks.google.com', '_netblocks2.google.com', '_netblocks3.google.com'], function (domain) {
    googleCidrs.push(new Promise(function (resolve, reject) {
        console.log("Interrogating Google CIDR at ", domain);
        nslookup(domain)
            .server('8.8.8.8')
            .type('txt')
            .timeout(10 * 1000)
            .end(function (err, addrs) {
                if (err) reject();
                else {
                    var row = addrs[0][0];
                    var cidrs = [];
                    _.each(row.split(' '), function (token) {
                        if (token.split('ip4:').length == 2) {
                            cidrs.push(token.split('ip4:')[1]);
                        }
                    });
                    resolve(cidrs);
                }
            });
    }));
});
Promise.all(googleCidrs).then(function (values) {
    console.log(values[0].length + values[1].length + values[2].length, " Google CIDR fetched (", values[0].length, ", ", values[1].length, ", ", values[2].length, ")");
});

// AWS
var awsIPRange = "https://ip-ranges.amazonaws.com/ip-ranges.json";
request({
    url: awsIPRange,
    json: true
}, function (error, response, body) {
    if (!error && response.statusCode === 200) {
        console.log("AWS IP range successfully retrieved from ", awsIPRange, ", now converting to PFSense format");
        http.createServer(function (req, res) {
            if (req.url == '/aws/cidr') {
                res.writeHead(200, {'Content-Type': 'text/plain'});
                var content = "";
                _.each(response.body.prefixes, function (prefix) {
                    content += prefix.ip_prefix + "\r\n";
                    console.log(prefix.ip_prefix)
                });
                res.end(content);
            } else if (req.url == '/aws/ip') {
                res.writeHead(200, {'Content-Type': 'text/plain'});
                var content = "";
                _.each(response.body.prefixes, function (prefix) {
                    var ips = cidr.list(prefix.ip_prefix);
                    console.log(prefix.ip_prefix + " has generated " + ips.length + " ips");
                    _.each(ips, function (ip) {
                        res.write(ip + "\r\n")
                    })
                });
                res.end(content);
            } else if (req.url == '/google/cidr') {
                res.writeHead(200, {'Content-Type': 'text/plain'});
                var content = "";

                Promise.all(googleCidrs).then(function (values) {
                    _.each(values[0], function (cidr) {
                        res.write(cidr + "\r\n")
                    });
                    _.each(values[1], function (cidr) {
                        res.write(cidr + "\r\n")
                    });
                    _.each(values[2], function (cidr) {
                        res.write(cidr + "\r\n")
                    });
                    res.end(content);
                });
            } else if (req.url == '/exit') {
		process.exit()
            } else {
                res.writeHead(200, {'Content-Type': 'text/plain'});
                res.end("See /aws/ip and /aws/cidr and google/cidr");
            }
        }).listen(localWebServerPort);

        var address,
            ifaces = os.networkInterfaces();
        for (var dev in ifaces) {
            ifaces[dev].filter((details) => details.family === 'IPv4' && details.internal === false ? address = details.address : undefined);
            if (address != undefined) break;
        }

        console.log("OK now open PFSense Import page https://xxx/firewall_aliases_edit.php?tab=url");
        console.log("Then import this URL: http://" + address + ":" + localWebServerPort + "/aws/cidr");
        console.log("Then import this URL: http://" + address + ":" + localWebServerPort + "/aws/ip");
        console.log("Then import this URL: http://" + address + ":" + localWebServerPort + "/google/cidr");
        console.log("See https://doc.pfsense.org/index.php/Aliases#URL_Table_Aliases")
    }
});
