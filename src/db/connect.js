const mongoose = require('mongoose');

const dotenv = require("dotenv")

dotenv.config({path: "./src/config.env"})


const DATABASE_URI = 'mongodb+srv://rhipfactory:DAOC0sBNoqPiBoe6@cluster0.ugmbsgq.mongodb.net/healthmeeting?retryWrites=true&w=majority'


const connectDB = async () => {
    try {
        await mongoose.connect(DATABASE_URI, {
            useNewUrlParser: true,
        }).then(()=>{
            console.log('⚡️:: Connected to MongoDB!')
        }).catch(err =>{
            console.error(`Can't connect to MongoDB ${err} `)
        })
    } catch (err) {
        console.error(err);
    }
}

module.exports = connectDB;