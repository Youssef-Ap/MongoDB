const mongoose = require("mongoose");

const objectSchema = new mongoose.Schema({
    id: Number,
    name: String,
    birthdate: String,
    abilities: [String],
    rarity: String,
    active: Boolean,
    image: String,
    description: String
});

module.exports = mongoose.model("Object", objectSchema);