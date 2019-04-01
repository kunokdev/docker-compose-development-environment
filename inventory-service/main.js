require("http")
  .createServer((req, res) => res.end("Inventory service"))
  .listen(process.env.PORT || 80, err => console.log(err || "Inventory service"));
