const express = require('express');
const router = express.Router();
const controller = require('../controllers/mainController');


//GET /: redirects to the home page
router.get('/', controller.index);

//GET /contact: redirects to the contact page
router.get('/contact', controller.contact);

//POST /about: redirects to the about page
router.get('/about', controller.about);

module.exports=router;  