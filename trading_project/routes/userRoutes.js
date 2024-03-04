const { check } = require('express-validator');
const express = require('express');

const controller = require('../controllers/userController');
const {isGuest, authenticated} = require('../middlewares/auth');
const router = express.Router();

// Validation rules.
var loginRules = [
    check('email', 'Email must be a valid one').trim().isEmail().normalizeEmail(),
    check('password').isLength({ min: 8 }).trim()
        .withMessage('Password must be at least 8 Characters')
        .withMessage('Password must be at least 8 Characters')
        .matches('[0-9]').withMessage('Password must contain a Number')
        .matches('[A-Za-z]').withMessage('Password must contain a Letter')
];

var signUpRules = [
    check('firstName').isLength({ min: 1, max: 25 }).trim().escape()
        .withMessage('First name length must be minimum 1 and maximum 25')
        .matches('[A-Za-z]').withMessage('First name can only contain alphabets'),
    check('lastName').isLength({ min: 1, max: 25 }).trim().escape()
        .withMessage('Last name length must be minimum 1 and maximum 25')
        .matches('[A-Za-z]').withMessage('Last name can only contain alphabets'),
    check('email', 'Email must be a valid one').trim().isEmail().normalizeEmail(),
    check('password').isLength({ min: 8 }).trim()
        .withMessage('Password must be at least 8 Characters')
        .matches('[0-9]').withMessage('Password must contain a Number')
        .matches('[A-Za-z]').withMessage('Password must contain a Letter')
];


//GET /users/new: send html form for creating a new user account

router.get('/new', isGuest, controller.new);

//POST /users: create a new user account

router.post('/', isGuest, signUpRules, controller.create);

//GET /users/login: send html for logging in
router.get('/login',isGuest, controller.getUserLogin);

//POST /users/login: authenticate user's login
router.post('/login',isGuest, loginRules, controller.login);

//GET /users/profile: send user's profile page
router.get('/profile', authenticated, controller.profile);

//POST /users/logout: logout a user
router.get('/logout', authenticated, controller.logout);

module.exports = router;