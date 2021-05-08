var express = require('express');
var router = express.Router();
var multer  = require( 'multer' );
var dbhandler = require('../dbhandler/dbhandler');
const { route } = require('./user');
var storage = multer.diskStorage(
    {
        destination: './public/Images',
        filename: function ( req, file, cb ) {
            //req.body is empty...
            //How could I get the new_file_name property sent from client here?
            cb( null, file.originalname+ '-' + Date.now()+".jpg");
        }
    }
);

var upload = multer( { storage: storage } );

/* GET users listing. */
router.get('/',function(req, res, next) {
  dbhandler.getAllProducts().then((products)=>
  {
    res.render('admin/view-products',{products,admin:true})
  })
});

router.get('/add-products',(req,res)=>
{
  res.render('admin/add-products',{admin:true});
})

router.post('/add-products',upload.single('Image'),(req,res)=>
{
  //res.send('Yeah!!!!')
  req.body.img = '/Images/'+req.file.filename;
  dbhandler.addProducts(req.body);
  res.redirect('/admin');
})

router.get('/delete-product/:id',(req,res)=>
{
  // let proId = req.query.id;
  // console.log(proId);
  // console.log(req.query.name);
  let proId = req.params.id;
  dbhandler.deleteProduct(proId).then((response)=>
  {
    console.log(response);
    res.redirect('/admin/');
  })
})

router.get('/edit-products/:id',(req,res)=>
{
   let proId = req.params.id;
   
  dbhandler.getOneProduct(proId).then((product)=>
  {
    //console.log(product);
    res.render('admin/edit-products',{product,admin:true});
  })
})

router.post('/edit-products/:id',upload.single('Image'),(req,res)=>
{
  //console.log(req.params.id);
  req.body.img = '/Images/'+req.file.filename;
  dbhandler.updateProduct(req.params.id,req.body).then((product)=>
  {
    console.log("prouct is"+product)
    res.redirect('/admin',{admin:true});
  })
})



module.exports = router;
