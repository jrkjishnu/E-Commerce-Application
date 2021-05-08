const { reject, resolve } = require('promise');
const db = require('../config/connection');
const collections = require('../config/collections');
const ObjectId = require('mongodb').ObjectID;

module.exports= {
    addProducts:(product)=>
    {
        console.log(product.Price);
        product.Price = parseInt(product.Price);
        db.get().collection(collections.PRODUCT_COLLECTION).insertOne(product).then((data)=>
        {
            //callback(true);
        })
    },
    getAllProducts:()=>
    {
        return new Promise(async(resolve,reject)=>
        {
            let products =await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray();
            //console.log(products);
            resolve(products);

        })
    },

    deleteProduct:(id)=>
    {
        console.log("delete Product");
        return new Promise((resolve,reject)=>
        {
            db.get().collection(collections.PRODUCT_COLLECTION).removeOne({_id:ObjectId(id)}).then((response)=>
            {
                //console.log("response is"+response);
                resolve(response);
            });
        })
    },
    getOneProduct:(id)=>
    {
        return new Promise((resolve,reject)=>
        {
            db.get().collection(collections.PRODUCT_COLLECTION).findOne({_id:ObjectId(id)}).then((product)=>
            {
                resolve(product);
            })
        })
    },

    updateProduct:(Id,updatedProduct)=>
    {
        console.log(Id);
        console.log(updatedProduct.Name);
        return new Promise((resolve,reject)=>
        {
            db.get().collection(collections.PRODUCT_COLLECTION).updateOne({_id:ObjectId(Id)},
                {$set:{
                    Name:updatedProduct.Name,
                    Price:updatedProduct.Price,
                    Description:updatedProduct.Description,
                    Category:updatedProduct.Category,
                    img:updatedProduct.img
                }
            }).then((product)=>
            {
                resolve(product)
            })
        })
    }
}