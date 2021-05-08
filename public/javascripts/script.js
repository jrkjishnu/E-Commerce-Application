function addToCart(proId)
    {
        $.ajax({
            url:/add-to-cart/+proId,
            method:'get',
            success:(response)=>
            {
                if(response.status)
                {
                    let count = $('#cart-count').html()//cartcount id in user-header
                    count = parseInt(count)+1
                    $('#cart-count').html(count);//updating cart count value in user header

                }
            }

        })
    }