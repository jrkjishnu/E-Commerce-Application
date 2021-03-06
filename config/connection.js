const mongoClient = require('mongodb').MongoClient;
const state = {
    db:null
}
module.exports.connect = (callback)=>
{
    const url = 'mongodb://localhost:27017';
    const dbname = 'shoppings';

    mongoClient.connect(url,{ useUnifiedTopology: true },(err,data)=>
    {
        if(err)
            return callback(err);
        state.db = data.db(dbname);
        callback();

    })
}

module.exports.get = ()=>
{
    return state.db;
}