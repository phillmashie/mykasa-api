const express = require('express');
const router = express.Router();
const md5 = require('md5');
const jwt = require('jsonwebtoken');

const mysql = require('mysql');
const nodemailer = require('nodemailer');
const { Router } = require('express');

const con = mysql.createPool({
  connectionLimit: process.env.CONNECTION_LIMIT,    // the number of connections node.js will hold open to our database
  password: process.env.DB_PASS,
  user: process.env.DB_USER,
  database: process.env.MYSQL_DB,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT
});


/* GET users listing. */
router.post('/register', async function (req, res, next) {
  try {
    let { full_names, date_of_birth, province, city, gender,msisdn, password, smartclubtoken } = req.body; 
   
    const hashed_password = md5(password.toString())

    const checkMSISDN = `Select msisdn FROM tblmykasausers WHERE msisdn = ?`
    con.query(checkMSISDN, [msisdn], (err, result = [], fields) => {
      if(!result.length){
        const sql = `Insert Into tblmykasausers (full_names, date_of_birth, province, city, gender, msisdn, password, smartclubtoken) VALUES (?, ?, ?, ?, ?, ?,?, ? )`
        con.query(
          sql, [full_names, date_of_birth, province, city, gender, msisdn, hashed_password, smartclubtoken],
        function(err, result, fields) {
          if(err){
            res.send({ status: 0, data: err });
          }else{
            let token = jwt.sign({ data: result }, 'secret')
            res.send({ status: 1, data: result, token : token });
           
          }
         
        })
      }
    });

    

   
  } catch (error) {
    res.send({ status: 0, error: error });
  }
});

router.post('/login', async function (req, res, next) {
  try {
    let { msisdn, password } = req.body; 
   
    const hashed_password = md5(password.toString())
    const sql = `SELECT * FROM tblmykasausers WHERE msisdn = ? AND password = ?`
    con.query(
      sql, [msisdn, hashed_password],
    function(err, result, fields){
      if(err){
        res.send({ status: 0, data: err });
      }else{
        let token = jwt.sign({ data: result }, 'secret')
        res.send({ status: 1, data: result, token: token });
      }
     
    })
  } catch (error) {
    res.send({ status: 0, error: error });
  }
});

//adding token and saving it
//the token to smart card is thebest 

router.post('/checkMobile', async function (req, res, next){
  try{
    let {MSISDN} = req.body;
    const sql = `SELECT COUNT(*) AS cnt FROM tblcustomerloyalty WHERE MSISDN = ?`
    con.query(
      sql, [MSISDN],
      function(err,result, fields){
        if(err) {
          console.log(err);
        }else{
          // checking if the user is a PAV Sim card holder
          if(result[0].cnt > 0){  
            // if The user is a PAV Sim card holder
            res.status(200).send({
            message: `Found status:(200)`
              });
            }
            // if user is not a PAV Sim Card holder
          else{
            res.status(400).send({
              message: `Not found status:(400) `
               });
          }
          
        }
      }
    )
  }
  catch(error) {
    res.send({status: 0, error: error});
  }
})

var transport = nodemailer.createTransport({
  service: 'gmail',
  auth:{
    user: process.env.EMAIL,
    pass: process.env.PASSWORD
  }
})

router.post('/forgotPassword', (req, res, next) => {
  const user = req.body;
  query = "select msisdn, password from tblmykasausers where msisdn=?";
  con.query(query,[user.msisdn],(err, results) => {
    if(!err){
      if(results.length <= 0)
      {
        return res.status(200).json({message:" Password send successfully to your email. "});
      }
      else{
        var mailOptions = {
          from: process.env.EMAIL,
          to: results[0].msisdn,
          subject: 'Password by Mykasa App',
          html: '<p><b>Your Login details for MyKasa App</b><br><b>Email: </b>'+results[0].msisdn+'<br><b>Password: </b>'+results[0].password+'<br><a href="https://mykasa.herokuapp.com/user/login">Click here to login</a></p>'
        };
        transport.sendMail(mailOptions, function(error, info){
          if(error) {
            console.log(error);
          }
          else{
            console.log('Email sent: '+info.response);
          }
        });
        return res.status(200).json({message:" Password send successfully to your email. "});
      }
    }
    else{
      return res.status(500).json(err);
    }
  })
})

module.exports = router;