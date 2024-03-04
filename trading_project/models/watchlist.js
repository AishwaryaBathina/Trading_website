const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    trade: { type: Schema.Types.ObjectId, ref: 'trade' },
    user: { type: Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('watchlist', schema);
