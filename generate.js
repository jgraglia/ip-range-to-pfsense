#!/usr/bin/env nodejs
var request = require("request")
var _ = require("lodash")
var http = require('http');
var os = require("os");

var url = "https://ip-ranges.amazonaws.com/ip-ranges.json"
var localWebServerPort = 9615

request({
    url: url,
    json: true
}, function (error, response, body) {
    if (!error && response.statusCode === 200) {
        console.log("AWS IP range successfully retrieved, now converting to PFSense format")
        http.createServer(function (req, res) {
          res.writeHead(200, {'Content-Type': 'text/plain'});
          var content = "";
          _.each(response.body.prefixes, function(prefix) {
            content += prefix.ip_prefix+"\n"
          })
          res.end(content);
        }).listen(localWebServerPort);
        console.log("OK now open PFSense Import page https://xxx/firewall_aliases_edit.php?tab=url")
        console.log("Then import this URL: http://"+os.hostname()+":"+localWebServerPort)
    }
})
