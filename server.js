require("dotenv").config();
const express = require('express');
const authenticationRouter = require('./routes/authentication.route');
const cors = require('cors');


const app = express();
const PORT= process.env.PORT;
app.use(cors());
app.use(express.json());


app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE");
  res.header("Access-Control-Allow-Headers", "X-Requested-With,content-type, Authorization");
  next();
});

//welcome API
app.get("/", (req, res) => {
    res.json({ message: "Welcome to MYKASA REST API." });
  });
app.use('/', authenticationRouter);
// const router = require("./routes/contact.route")(app);
// app.use('/api', router);

app.listen(PORT, ()=>{
    console.log(`server is listening  on ${PORT}`);
});