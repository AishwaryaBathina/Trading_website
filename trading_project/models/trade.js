const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tradeSchema = new Schema({
    name: {type: String, required: [true, 'title is required']},
    category: {type: String, required: [true, 'category is required']},
    description: {type: String, required: [true, 'details is required'],
                minLength: [35, 'Description should have atleast 35 charecters']},
    quantity: { type: Number, required: [true, 'Quantity is required'] },
    image: {type: String, required: false},
    author: {type: Schema.Types.ObjectId, ref:'User'}
},
{timestamps: true}
);

module.exports = mongoose.model('trade',tradeSchema);
