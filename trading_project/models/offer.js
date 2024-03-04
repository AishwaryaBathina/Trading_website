const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    trade: { type: Schema.Types.ObjectId, ref: 'trade' },
    offer: { type: Schema.Types.ObjectId, ref: 'trade' },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    status: {
        type: String,
        default: 'pending' 
    }
});

module.exports = mongoose.model('Offer', schema);
