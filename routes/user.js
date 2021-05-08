const { response, json } = require('express');
var express = require('express');
const session = require('express-session');
var router = express.Router();
const dbhandler = require('../dbhandler/dbhandler');
const userHandler = require('../dbhandler/userdbHandler');
/* GET home page. */
router.get('/',async function(req, res, next) {
  let user = req.session.user
  //finding cart count
  let cartCount = null;
  if(user)
  {
    cartCount = await userHandler.getCount(user._id);
  }
  dbhandler.getAllProducts().then((products)=>
  {
    res.render('user/view-products', {products,user,cartCount});
  })
});

router.get('/login',(req,res)=>
{
  if(req.session.loggedIn)
    res.redirect('/');
  else
  {
    res.render('user/login',{"logerror":req.session.logerror})
    req.session.logerror = false;}
})

router.get('/signup',(req,res)=>
{
  if(req.session.loggedIn)
    res.redirect('/');
    else
    {
      res.render('user/signup');
      req.session.loggedIn = false;
    }
})

router.post('/signup',(req,res)=>
{
  userHandler.addUser(req.body).then((response)=>
  {
    req.session.loggedIn = true;
    req.session.user = response;
    res.redirect('/');
  })
})

router.post('/login',(req,res)=>
{
  userHandler.validateUser(req.body).then((response)=>
  {
    if(response.status)
{    
  req.session.loggedIn = true;
  req.session.user = response.user;
  res.redirect('/');
}    
else
{
  req.session.logerror = "Invalid Username or Password";
  res.redirect('/login');
}
  })
})

router.get('/logout',(req,res)=>
{
  req.session.destroy();
  res.redirect('/');
})
router.get('/cart',verifyLogin,async(req,res)=>
{
  
  let products = await userHandler.getCart(req.session.user._id)
  let total = 0;
  if(products.length > 0)
  {
    total = await userHandler.getTotalAmount(req.session.user._id);
  }

  res.render('user/cart',{products,"user":req.session.user,total})

})


router.get('/add-to-cart/:id',(req,res)=>
{
  userHandler.addToCart(req.params.id,req.session.user._id).then(()=>
  {
    res.json({status:true})
  })
})

router.post('/changeProductQuantity',verifyLogin,(req,res,next)=>
{
  userHandler.updateQuantity(req.body).then(async(response)=>
  {
    let total = await userHandler.getTotalAmount(req.session.user._id);
    response.total = total;
    res.json(response)
  }
  )
})

router.get('/removecart/:id',(req,res)=>
{
  //console.log("remove cart");
  let array = req.params.id.split(',');
  let details = {cartId:array[0],
                proId:array[1]}
                console.log(details);
  userHandler.removeCart(details).then((response)=>
  {
    res.redirect('/cart');
  })
})

router.get('/checkout',verifyLogin,async(req,res)=>
{
  let total = await userHandler.getTotalAmount(req.session.user._id);
    res.render('user/checkout',{total,'user':req.session.user})
})


router.post('/placed-order',verifyLogin,async(req,res)=>
{
  req.body.userId = req.session.user._id;
  //console.log(req.body);
  let products = await userHandler.getCartProductList(req.body.userId);
  let total = await userHandler.getTotalAmount(req.session.user._id);
  userHandler.placeOrder(req.body,products,total).then((orderId)=>
  {
    if(req.body['payment-method'] === 'COD')
    {
      res.json({codSuccess:true});
    }
    else
    {
      userHandler.generateRazorpay(orderId,total).then((response)=>
      { 
        console.log(response.amount);
        res.json(response);
      })
    }
  })
})

router.get('/congrats',async(req,res)=>
{
  res.render('user/congrats',{"user":req.session.user})
})

router.get('/orders',async(req,res)=>
{
  if(req.session.user)
  {
    orders = await userHandler.getOrders(req.session.user._id);
    res.render('user/orders',{"user":req.session.user,orders})
  }
})

router.get('/view-order-products/:id',async(req,res)=>
{
  console.log(req.params.id);
  let products = await userHandler.getOrderedProducts(req.params.id)
  res.render('user/view-order-products',{user:req.session.user,products});
})

router.post('/verify-payment',(req,res)=>
{
  console.log(req.body);
  userHandler.verifyPayment(req.body)
.then(()=>
{
    userHandler.changePaymentStatus(req.body['order[receipt]']).then(()=>
    {
      res.json({status:true})
    })
}).catch((err)=>
{
  res.json({status:false})
})

})

function verifyLogin(req,res,next)
{
  if(req.session.loggedIn)
    next()
  else
    res.redirect('/login');
}

module.exports = router;
