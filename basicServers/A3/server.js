var express = require("express");
var path = require("path");

var server = express();
var hostname = process.env.HOSTNAME || 'localhost';
var port = process.env.PORT || 8080;

server.get("/", function (req, res) {
    res.redirect("index.html");
});

server.use(express.static(path.join(__dirname, 'public')));

console.log("Simple static server listening at http://" + hostname + ":" + port);

if (require.main === module) {
    server.listen(port);
} else {
    module.exports = server;
}
