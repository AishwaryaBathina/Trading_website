const model = require('../models/trade');
const userModel = require('../models/user');
const offerModel = require('../models/offer');
const watchModel = require('../models/watchlist');
const { profile } = require('./userController');

const defaultImageUrl = "https://7esl.com/wp-content/uploads/2018/01/sports-and-games.jpg"

exports.index = (req, res, next) => {
    let categories = model.distinct("category")
    categories.then(categories => {
        model.find()
            .then(gamesAndSports => res.render('./trade/index', { gamesAndSports, categories }))
            .catch(err => next(err))
    })
        .catch(err => next(err))
};

exports.new = (req, res) => {
    res.render('./trade/new');
};

exports.create = (req, res, next) => {
    let trade = new model(req.body);
    if (!trade.image) {
        trade.image = defaultImageUrl
    }
    trade.author = req.session.user;
    trade.save()
        .then(trade => res.redirect('/trade'))
        .catch(err => {
            if (err.name === 'ValidationError') {
                err.status = 400;
            }
            next(err);
        });
};

exports.show = async (req, res, next) => {
    let id = req.params.id;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        let err = new Error('Invalid trade ID');
        err.status = 400;
        return next(err);
    }

    try {
        const equipment = await model.findById(id);

        if (equipment) {
            equipment.currentUser = String(req.session.user);
            equipment.offeredByMe = await isOfferedByMe(equipment.id, equipment.currentUser);
            equipment.status = await getProductStatus(equipment.id);
            equipment.watchedByMeId = await isWatchedByMe(equipment.id, req.session.user);

            if (equipment.currentUser !== equipment.author) {
                equipment.myProducts = await getMyAvailableProducts(equipment.currentUser);
            } else {
                equipment.myProducts = [];
            }

            if (equipment.status == 'pending') {
                equipment.offers = await getIncomingOffers(id);
                equipment.madeOffers = await getOutgoingOffers(id);
            }

            return res.render('./trade/show', { equipment });
        } else {
            let err = new Error('Cannot find equipment with id ' + id);
            err.status = 404;
            next(err);
        }
    } catch (err) {
        next(err);
    }
};

async function isWatchedByMe(id, userId) {
    var records = await watchModel.find({ trade: id, user: userId }).exec();

    return records.length > 0 ? records[0].id : '';
}

async function getIncomingOffers(itemId) {
    var items = await offerModel.find({ trade: itemId, status: 'pending' }).exec();

    for (var i = 0, len = items.length, item; i < len; i++) {
        item = items[i];

        let details = await model.findById(item.offer).exec();
        item.offerName = details.name;

        details = await userModel.findById(item.user).exec();
        item.authorName = details.firstName + ' ' + details.lastName;
    }

    return items;
}

async function getOutgoingOffers(id) {
    var items = await offerModel.find({ offer: id, status: 'pending' }).exec();

    for (var i = 0, len = items.length, item; i < len; i++) {
        item = items[i];

        let details = await model.findById(item.trade).exec();
        item.tradeName = details.name;

        details = await userModel.findById(details.author).exec();
        item.tradeOwnerName = details.firstName + ' ' + details.lastName;
    }

    return items;
}

async function getMyAvailableProducts(userId) {
    const myProducts = await model.find({ author: userId }).sort({ category: 1 }),
        availableProducts = [];

    for (let i = 0, len = myProducts.length; i < len; i++) {
        if (await getProductStatus(myProducts[i].id) !== 'traded') {
            availableProducts.push(myProducts[i]);
        }
    }

    return availableProducts;
}

async function isOfferedByMe(itemId, userId) {
    const records = await offerModel.find({ trade: itemId, user: userId });

    return records.length > 0;
}

async function deletePendingOffers(id) {
    let items = await offerModel.find({ status: 'pending' }).or([{ trade: id }, { offer: id }]).exec();

    for (var i = 0, len = items.length; i < len; i++) {
        await items[i].remove();
    }
}

async function removefromWatchList(id, userId) {
    let filter = { trade: id };

    if (userId) {
        filter.user = userId;
    }

    let items = await watchModel.find(filter).exec();

    for (var i = 0, len = items.length; i < len; i++) {
        await items[i].remove();
    }
}

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

exports.edit = (req, res, next) => {
    let id = req.params.id;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        let err = new Error('Invalid trade id');
        err.status = 400;
        return next(err);
    }
    model.findById(id)
        .then(equipment => {
            if (equipment) {
                res.render('./trade/edit', { equipment });
            } else {
                let err = new Error('There are no Equipments to update with that id ' + id);
                err.status = 404;
                next(err);
            }
        })
        .catch(err => next(err));
};

exports.update = (req, res, next) => {
    let id = req.params.id;
    let equipment = req.body;
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        let err = new Error('Invalid trade id');
        err.status = 400;
        return next(err);
    }
    model.findByIdAndUpdate(id, equipment, { useFindAndModify: false, runValidators: true })
        .then(equip => {
            if (equip) {
                res.redirect('/trade/' + id);
            } else {
                let err = new Error('There are no Equipments to update with that id' + id);
                err.status = 404;
                next(err);
            }
        })
        .catch(err => {
            if (err.name === 'ValidationError') {
                err.status = 400;
            }
            next(err);
        });
};

exports.delete = async (req, res, next) => {
    let id = req.params.id,
        status,
        item;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        let err = new Error('Invalid trade id');
        err.status = 400;
        return next(err);
    }

    try {
        item = await model.findById(id).exec();

        if (item) {
            status = await getProductStatus(id);

            if (status === 'traded') {
                let err = new Error('Traded equipment can not be deleted');
                err.status = 400;
                next(err);
            } else {
                if (status == 'pending') {
                    await deletePendingOffers(id);
                }

                await item.remove(id);
                await removefromWatchList(id);
                res.redirect('/trade');
            }
        } else {
            let err = new Error('There are no equipments to delete' + id);
            err.status = 404;
            next(err);
        }
    } catch (ex) {
        next(err);
    }
}

exports.addWatch = async (req, res, next) => {
    let id = req.params.id,
        item;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        let err = new Error('Invalid equipment id');
        err.status = 400;
        return next(err);
    }

    try {
        item = await model.findById(id).exec();

        if (item) {
            item = new watchModel({
                trade: id,
                user: req.session.user
            });

            await item.save();
            req.flash('success', 'Trade watched Successfully')
            res.redirect('/trade/' + id);  // profile is having equipment id
        } else {
            let err = new Error('There are no equipment to watch with id: ' + id);
            err.status = 404;
            next(err);
        }
    } catch (ex) {
        next(err);
    }
}

exports.deleteWatch = async (req, res, next) => {
    let id = req.params.id,
        item;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        let err = new Error('Invalid watch id');
        err.status = 400;
        return next(err);
    }

    try {
        item = await watchModel.findById(id).exec();

        if (item) {
            await item.remove();

            if (req.params.navigation == 'profile') {
                req.flash('success', 'Trade deleted Successfully')
                res.redirect('/users/profile');
            } else {
                res.redirect('/trade/' + req.params.navigation);  // navigation is having trade id
            }
        } else {
            let err = new Error('There are no watch record to delete with id: ' + id);
            err.status = 404;
            next(err);
        }
    } catch (ex) {
        next(err);
    }
}

exports.offer = async (req, res, next) => {
    let id = req.params.id,
        rec;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        let err = new Error('Invalid trade id');
        err.status = 400;
        return next(err);
    }

    try {
        const equipment = await model.findById(id);

        if (equipment) {
            rec = new watchModel({
                trade: id,
                user: req.session.user
            });

            await rec.save();

            rec = new offerModel({
                trade: id,
                offer: req.body.offerItem,
                user: req.session.user
            });

            await rec.save();
            req.flash('success', 'Trade offered Successfully')
            return res.redirect('/trade/' + id);
        } else {
            let err = new Error('Cannot find equipment with id ' + id);
            err.status = 404;
            next(err);
        }
    } catch (ex) {
        next(err);
    }
}

exports.accept = async (req, res, next) => {
    let id = req.params.id,
        equipmentId = req.params.itemId,
        item;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        let err = new Error('Invalid trade id');
        err.status = 400;
        return next(err);
    }

    try {
        item = await offerModel.findById(id).exec();

        if (item) {
            await item.updateOne({ status: 'traded' });
            await deletePendingOffers(item.trade);
            await deletePendingOffers(item.offer);
            
            if (equipmentId == 'profile') {
                req.flash('success', 'Trade accepted Successfully')
                res.redirect('/users/profile');
            } else {
            req.flash('success', 'Trade accepted Successfully')
                res.redirect('/trade/' + equipmentId);  // profile is having trade id
            }
        } else {
            let err = new Error('There are no offer to accept' + id);
            err.status = 404;
            next(err);
        }
    } catch (ex) {
        next(err);
    }
}

exports.reject = async (req, res, next) => {
    let id = req.params.id,
        equipmentId = req.params.itemId,
        item;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        let err = new Error('Invalid trade id');
        err.status = 400;
        return next(err);
    }

    try {
        item = await offerModel.findById(id).exec();

        if (item) {
            if (item.user == req.session.user) {
                // remove item from watch list
                await removefromWatchList(item.trade, item.user);
            }

            item.remove();

            if (equipmentId == 'profile') {
                req.flash('success', 'Trade rejected Successfully')
                res.redirect('/users/profile');
            } else {
                req.flash('success', 'Trade rejected Successfully')
                res.redirect('/trade/' + equipmentId);  // profile is having trade id
            }
        } else {
            let err = new Error('There are no offer to reject' + id);
            err.status = 404;
            next(err);
        }
    } catch (ex) {
        next(err);
    }
}