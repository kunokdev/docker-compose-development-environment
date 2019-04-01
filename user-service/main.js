require("http")
  .createServer((req, res) => res.end("User service"))
  .listen(process.env.PORT || 80, err => console.log(err || "User Service"));
