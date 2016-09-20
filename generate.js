#!/usr/bin/env nodejs
var request = require("request")
var _ = require("lodash")
var http = require('http');
var os = require("os");
var CIDR = require('cidr-js');

var url = "https://ip-ranges.amazonaws.com/ip-ranges.json"
var localWebServerPort = 9615
var cidr = new CIDR();

request({
    url: url,
    json: true
}, function (error, response, body) {
    if (!error && response.statusCode === 200) {
        console.log("AWS IP range successfully retrieved, now converting to PFSense format")
        http.createServer(function (req, res) {
          if(req.url=='/cidr') {
            res.writeHead(200, {'Content-Type': 'text/plain'});
            var content = "";
            _.each(response.body.prefixes, function(prefix) {
              content += prefix.ip_prefix+"\r\n"
              console.log(prefix.ip_prefix)
            })
            res.end(content);
          } else if (req.url=='/ip'){
            res.writeHead(200, {'Content-Type': 'text/plain'});
            var content = "";
            _.each(response.body.prefixes, function(prefix) {
              var ips = cidr.list(prefix.ip_prefix);
              console.log(prefix.ip_prefix+" has generated "+ips.length+" ips")
              _.each(ips, function(ip) {
                res.write(ip+"\r\n")
              })
            })
            res.end(content);
          } else{
            res.writeHead(200, {'Content-Type': 'text/plain'});
            res.end("See /ip and /cidr");
          }
        }).listen(localWebServerPort);
        console.log("OK now open PFSense Import page https://xxx/firewall_aliases_edit.php?tab=url")
        console.log("Then import this URL: http://"+os.hostname()+":"+localWebServerPort+"/cidr")
        console.log("Then import this URL: http://"+os.hostname()+":"+localWebServerPort+"/ip")
        console.log("See https://doc.pfsense.org/index.php/Aliases#URL_Table_Aliases")
    }
})
