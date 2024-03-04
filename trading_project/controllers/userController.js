const { validationResult } = require('express-validator');
const model = require('../models/user');
const gameAndSports = require('../models/trade');
const watchModel = require('../models/watchlist');
const offerModel = require('../models/offer');


exports.new = (req, res) => {
    console.log("Inide New")
    res.render('./user/signUp');
};

exports.create = (req, res, next) => {
    let user = new model(req.body);
    console.log("Inside Create", req.body);

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        let err = new Error(errors.array().map(x => x.msg).join('. '));

        err.status = 400;
        next(err);
    } else {
        user.save()
            .then(user => { req.flash('success', 'signed in successfully'); res.redirect('/users/login') })
            .catch(err => {
                if (err.name === 'ValidationError') {
                    req.flash('error', err.message);
                    return res.redirect('/users/new');
                }
                if (err.code === 11000) {
                    req.flash('error', 'Email has been used');
                    return res.redirect('/users/new');
                }
                next(err);
            });
    }

};

exports.getUserLogin = (req, res, next) => {
    res.render('./user/login');
}

exports.login = (req, res, next) => {
    let email = req.body.email;
    let password = req.body.password;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        let err = new Error(errors.array().map(x => x.msg).join('. '));

        err.status = 400;
        next(err);
    } else {
        model.findOne({ email: email })
            .then(user => {
                if (!user) {
                    console.log('Incorrect email address');
                    req.flash('error', 'Incorrect email address');
                    res.redirect('/users/login');
                } else {
                    user.comparePassword(password)
                        .then(result => {
                            if (result) {
                                req.session.user = user._id;
                                req.session.userName = user.firstName + ' ' + user.lastName;
                                req.flash('success', 'You have successfully logged in');
                                res.redirect('/users/profile');
                            } else {
                                req.flash('error', 'Incorrect password');
                                res.redirect('/users/login');
                            }
                        });
                }
            })
            .catch(err => next(err));
    }
};

exports.profile = (req, res, next) => {
    let id = req.session.user;

    Promise.all([
        model.findById(id),
        gameAndSports.find({ author: id }),
        getMyWatches(id),
        getOffersByMe(id),
        getReceivedOffers(id)
    ]).then(results => {
        const [user, stories, watchlist, myoffers, receivedOffers] = results;
        res.render('./user/profile', { user, stories, watchlist, myoffers, receivedOffers });
    })
        .catch(err => next(err));
};

const getMyWatches = async (userId) => {
    const list = await watchModel.find({ user: userId }).exec(),
        items = [];

    for (let i = 0, len = list.length; i < len; i++) {
        let equipment = await gameAndSports.findById(list[i].trade);

        equipment.watchId = list[i].id;
        equipment.status = await getProductStatus(equipment.id);
        items.push(equipment);
    }

    return items;
};

async function getProductStatus(itemId) {
    const records = await offerModel.find().or([{ trade: itemId }, { offer: itemId }]);

    if (!records.length) {
        return 'available';
    } else if (records.filter(x => x.status == 'traded').length) {
        return 'traded';
    } else {
        return 'pending';
    }
}

const getOffersByMe = async (userId) => {
    const items = await offerModel.find({ user: userId }).exec(),
        offers = [];

    for (var i = 0, len = items.length, item; i < len; i++) {
        item = items[i];

        let details = await gameAndSports.findById(item.trade).exec();

        if (details) {
            item.tradeName = details.name;

            details = await model.findById(details.author).exec();
            item.tradeOwnerName = details.firstName + ' ' + details.lastName;

            details = await gameAndSports.findById(item.offer).exec();

            if (details) {
                item.offerName = details.name;
                offers.push(item);
            }
        }
    }

    return offers;
};

const getReceivedOffers = async (userId) => {
    // my products
    const items = await gameAndSports.find({ author: userId }).sort({ category: 1 }),
        products = [];

    for (var i = 0, len = items.length, item; i < len; i++) {
        item = items[i];

        let offers = await offerModel.find({ trade: item.id }).exec();

        for (var j = 0, length = offers.length, offer; j < length; j++) {
            offer = offers[j];
            offer.tradeName = item.name;

            let details = await model.findById(offer.user).exec();
            offer.userName = details.firstName + ' ' + details.lastName;

            details = await gameAndSports.findById(offer.offer).exec();
            offer.offerName = details.name;

            products.push(offer);
        }
    }

    return products;
};

exports.logout = (req, res, next) => {
    req.session.destroy(err => {
        if (err)
            return next(err);
        else
            res.redirect('/');
    });

};



