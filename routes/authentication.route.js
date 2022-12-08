const express = require('express');
const router = express.Router();

//login and register, check number routes
const user = require('../controllers/authentication.controller');
router.use('/user', user);


module.exports = router;