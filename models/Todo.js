const {Schema, model} = require("../db/connection") // import Schema & model

// User Schema
const TodoSchema = new Schema({
    username: {type: String, required: true},
    reminder: {type: String, required: true},
    completed: {type: Boolean, required: true, default: false}
})

// User model
const Todo = model("Todo", TodoSchema)

module.exports = Todo