const express = require('express');
const router = express.Router();
const md5 = require('md5');
const jwt = require('jsonwebtoken');

const mysql = require('mysql');
const nodemailer = require('nodemailer');
const { Router } = require('express');

//Password recovery
const randomstring = require("randomstring");
const twilio = require('twilio');

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


router.post('/checkIfRegistered', async function (req, res, next){
  try{
    let {msisdn} = req.body;
    const sql = `SELECT COUNT(*) AS cnt FROM tblmykasausers WHERE msisdn = ?`
    con.query(
      sql, [msisdn],
      function(err,result, fields){
        if(err) {
          console.log(err);
        }else{
          // checking if the user is a PAV Sim card holder
          if(result[0].cnt > 0){  
            // if The user is a PAV Sim card holder
            res.status(200).send({
            message: `User Is registered on MyKasa:(200)`
              });
            }
            // if user is not a PAV Sim Card holder
          else{
            res.status(400).send({
              message: `User Is not registered on MyKasa:(400) `
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


router.post('/password_recovery', (req, res) => {
  const msisdn = req.body.msisdn;

  con.query('SELECT msisdn FROM tblmykasausers WHERE msisdn = ?', [msisdn], (error, results) => {
      if (error) {
          res.status(500).json({ message: 'Error in server' });
      } else if (results.length === 0) {
          res.status(404).json({ message: 'No user found with this phone number' });
      } else {
          const msisdn = results[0].msisdn;
          const tempPassword = randomstring.generate({
              length: 6,
              charset: 'alphanumeric'
          });

          // Update the user's password with the temporary password
          con.query('UPDATE tblmykasausers SET password = ? WHERE msisdn = ?', [tempPassword, msisdn], (error) => {
              if (error) {
                  res.status(500).json({ message: 'Error in server' });
              } else {
                  // Send the temporary password via SMS using Twilio
                  const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
                  client.messages.create({
                      body: `Your temporary password is ${tempPassword}. Please change your password after logging in.`,
                      from: '+19295562759',
                      to: msisdn
                  }).then((message) => {
                      res.status(200).json({ message: 'Temporary password sent to phone number' });
                  }).catch((error) => {
                      res.status(500).json({ message: 'Error in sending SMS' });
                  });
              }
          });
      }
  });
});

module.exports = router;