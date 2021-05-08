const db = require('../config/connection');
const collections = require('../config/collections');
const bcrypt = require('bcrypt');
const { resolve, reject } = require('promise');
const ObjectId = require('mongodb').ObjectID;
const Razorpay = require('razorpay')
var instance = new Razorpay({
    key_id: 'rzp_test_k1qFxX7HFQCaCb',
    key_secret: 'nNbqLMDYHCL6IpZzkoFdpM0A'
  });
module.exports = {
    addUser : (Userdata)=>
    {
        return new Promise(async(resolve,reject)=>
        {
            Userdata.password = await bcrypt.hash(Userdata.password,10);
            db.get().collection(collections.USER_COLLECTION).insertOne(Userdata).then((data)=>
            {
                resolve(data.ops[0]);
            })
        })
    },
    validateUser:(enteredData)=>
    {
        return new Promise(async(resolve,reject)=>
        {
           let status = false;
           let response = {};
           let user = await db.get().collection(collections.USER_COLLECTION).findOne({Email:enteredData.Email}); 
           if(user)
           {
               bcrypt.compare(enteredData.password,user.password).then((statuse)=>
               {
                    if(statuse)
                    {
                        response.user = user;
                        response.status = true;
                        resolve(response);
                    }
                    else
                    {
                        resolve({status:false});
                    }
               })
               //using async & await
            //    let status = await bcrypt.compare(enteredData.password,user.password);
               
            //    if(status)
            //        console.log("Login success");
            //    else
            //        console.log("login failed");
        }
           else
           {
             resolve({status:false});
           }
        
        })
    },
    addToCart:(proId,userId)=>
    {
        let proObj = {
            item:ObjectId(proId),
            quantity:1
        }
        return new Promise(async(resolve,reject)=>
        {
            let userCart = await db.get().collection(collections.CART_COLLECTION).findOne({user:ObjectId(userId)});

            if(userCart)
            {
                let proExist = userCart.products.findIndex(product =>product.item==proId)
                if(proExist != -1)
                {
                    db.get().collection(collections.CART_COLLECTION).updateOne({user:ObjectId(userId),'products.item':ObjectId(proId)},
                    {
                        $inc:{'products.$.quantity':1}
                    }
                    ).then(()=>
                    {
                        resolve()
                    })
                }
                else
                {
                db.get().collection(collections.CART_COLLECTION).updateOne({user:ObjectId(userId)},
                {
                    $push:{products:proObj}
                }
                ).then((res)=>
                {
                    resolve();
                })
            }
            }
            else
            {
                let cartObj = {
                    user:ObjectId(userId),
                    products:[proObj]
                }
                db.get().collection(collections.CART_COLLECTION).insertOne(cartObj).then((res)=>
                {
                    resolve();
                })
            }
        })
    },
    getCart:(userId)=>
    {
        return new Promise(async(resolve,reject)=>
        {
            let cartItems = await db.get().collection(collections.CART_COLLECTION).aggregate([
                {
                    $match:{user:ObjectId(userId)}

                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collections.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'products'
                    }
                },
                {
                    $project:{
                    item:1,quantity:1,
                    products:{$arrayElemAt:['$products',0]}
            }
        }
                // {
                //     $lookup:{
                //         from:collections.PRODUCT_COLLECTION,
                //         //recieved product as array so need to convert to object
                //         let:{prodList:'$products'},
                //         pipeline:[
                //             {
                //                 $match:{
                //                     $expr:{
                //                         $in:['$_id',"$$prodList"]
                //                     }

                //                 }
                //             }
                //         ],
                //         as:'cartItems'
                //     }
                // }

            ]).toArray()
            resolve(cartItems)
            
        })
    },

    getCount:(userId)=>
    {
        return new Promise(async(resolve,reject)=>
        {
            let cartCount = 0;
            let cart = await db.get().collection(collections.CART_COLLECTION).findOne({user:ObjectId(userId)});
            if(cart)
            {
                cartCount = cart.products.length; 
            }
            resolve(cartCount);  
        })
    },

    updateQuantity:(Details)=>
    {
        let count = parseInt(Details.count);
        let quantity = parseInt(Details.quantity);
        return new Promise((resolve,reject)=>
        {
            if(count == -1 && quantity == 1){
            db.get().collection(collections.CART_COLLECTION).updateOne({_id:ObjectId(Details.cart)},
                    {
                        $pull:{products:{item:ObjectId(Details.product)}}
                    }
                    ).then((response)=>
                    {
                        resolve({removeProduct:true})
                    })
            }
            else
            {
                db.get().collection(collections.CART_COLLECTION).updateOne({_id:ObjectId(Details.cart),'products.item':ObjectId(Details.product)},
                    {
                        $inc:{'products.$.quantity':count}
                    }
                    ).then((response)=>
                    {
                        //console.log(response);
                        resolve({status:true})
                    })
            }
        })
    },
    removeCart:(details)=>
    {
        //console.log(details.cartId,details.proId)
        return new Promise((resolve,reject)=>
        {
            db.get().collection(collections.CART_COLLECTION).updateOne({_id:ObjectId(details.cartId)},
                    {
                        $pull:{products:{item:ObjectId(details.proId)}}
                    }
                    ).then((response)=>
                    {
                        resolve(true)
                    })
            }
        )
    },

    getTotalAmount:(userId)=>
    {

        return new Promise(async(resolve,reject)=>
        {
            let total = await db.get().collection(collections.CART_COLLECTION).aggregate([
                {
                    $match:{user:ObjectId(userId)}

                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity',
                    }
                },
                {
                    $lookup:{
                        from:collections.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'products'
                    }
                },
                {
                    $project:{
                    item:1,quantity:1,
                    products:{$arrayElemAt:['$products',0]}
            }
            },
        {
            $group:{
                _id:null,
                total:{$sum:{$multiply:['$quantity','$products.Price']}}
            }
        }
            ]).toArray()
            resolve(total[0].total)
            console.log(total[0].total)
            
        })
    },
    placeOrder:(order,products,total)=>
    {
        return new Promise((resolve,reject)=>
        {
            let status = order['payment-method'] === 'COD'?'Placed':'Pending';

            let orderObj = {
                deliveryDetails:{
                    mobile:order.mobile,
                    address:order.address,
                    firstname:order.firstname,
                    totalAmount:total
                },

                    userId:ObjectId(order.userId),
                    paymentMethod:order['payment-method'],
                    products:products,
                    status:status,
                    date:new Date()
                    
            }

            db.get().collection(collections.ORDER_COLLECTION).insertOne(orderObj).then((response)=>
            {
                db.get().collection(collections.CART_COLLECTION).removeOne({user:ObjectId(order.userId)})
                resolve(response.ops[0]._id);
            })

        })
    },
    getCartProductList:(userId)=>
    {
        return new Promise(async(resolve,reject)=>
        {
            let cart = await db.get().collection(collections.CART_COLLECTION).findOne({user:ObjectId(userId)});
            resolve(cart);
        })
    },
    getOrders:(userId)=>
    {
        return new Promise(async(resolve,reject)=>
        {
            let orders = await db.get().collection(collections.ORDER_COLLECTION).find({userId:ObjectId(userId)}).toArray()
            //console.log(orders);
            resolve(orders);
        })
    },

    getOrderedProducts:(orderId)=>
    {
        return new Promise(async(resolve,reject)=>
        {
            let orderItem = await db.get().collection(collections.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:ObjectId(orderId)}

                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.products.item',
                        quantity:'$products.products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collections.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'products'
                    }
                },
                {
                    $project:{
                        item:1,quantity:1,products:'$products'
                    }
                }
            ]).toArray()
            console.log("order item"+orderItem)
            resolve(orderItem)
        })
    },

    generateRazorpay:(orderId,total)=>
    {
        return new Promise((resolve,reject)=>
        {
            var options = {
                amount: total*100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: ""+orderId
              };
              instance.orders.create(options, function(err, order) {
                if(err)
                {
                    console.log(err);
                }
                else{
                console.log("New Order",order);
                resolve(order);
                }
              });

        })
    },

    verifyPayment:(details)=>
    {
        console.log("paymnt Details");
        return new Promise(async(resolve,reject)=>
        {
            const {
                createHmac,
              } = await import('crypto');
            let hmac = createHmac('sha256','nNbqLMDYHCL6IpZzkoFdpM0A');
            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
            hmac = hmac.digest('hex')
            if(hmac == details['payment[razorpay_signature]'])
            {
                resolve()
            }
            else
            {
                reject()
            }

        })
    },

    changePaymentStatus:(orderId)=>
    {
        return new Promise((resolve,reject)=>
        {
            db.get().collection(collections.ORDER_COLLECTION)
            .updateOne({_id:ObjectId(orderId)},
            {
                $set:{
                    status:'Placed'
                }
            }).then(()=>
            {
                resolve()
            })
        })
    }
}



// db.get().collection(collections.CART_COLLECTION).updateOne({_id:ObjectId(Details.cart),'products.item':ObjectId(Details.product)},
//                     {
//                         $inc:{'products.$.quantity':count}
//                     }
//                     ).then((response)=>
//                     {
//                         //console.log(response);
//                         resolve()
//                     })