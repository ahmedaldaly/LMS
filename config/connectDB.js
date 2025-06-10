const mongoose = require('mongoose');
const connectDB = async ()=>{
    try{
        mongoose.connect(process.env.DB)
        console.log('DB is connected')
    }catch(err){console.log(`cant connected to database ${err}`)}
}
module.exports = connectDB;