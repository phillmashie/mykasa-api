const express = require('express');
const router = express.Router();

//login and register, check number routes,password_recovery
const user = require('../controllers/authentication.controller');
router.use('/user', user);


module.exports = router;