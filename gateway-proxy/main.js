require("http")
  .createServer((req, res) => res.end("Gateway proxy"))
  .listen(process.env.PORT || 80, err => console.log(err || "Gateway proxy"));
