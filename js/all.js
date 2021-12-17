const productList = document.querySelector(".productWrap");
const productSelect = document.querySelector(".productSelect");
const cartList = document.querySelector(".shoppingCart-tableList");
let productData = []; //產品列表
let cartData = []; //購物車列表

function init() {
    getProductList();
    getCartList();
}

init();

function getProductList() {
    axios.get(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/products`)
        .then(function (response) {
            productData = response.data.products;
            renderProductList();

        })
}

// 產品列表 Li 字串
function combineProductHTMLItem(item) {
    return `<li class="productCard">
<h4 class="productType">新品</h4>
<img src="${item.images}"
    alt="">
<a href="#" class="addCardBtn" data-id="${item.id}">加入購物車</a>
<h3>${item.title}</h3>
<del class="originPrice">${toThousands(item.origin_price)}</del>
<p class="nowPrice">${toThousands(item.price)}</p>
</li>`
}

// 產品列表
function renderProductList() {
    let str = "";
    productData.forEach(function (item) {
        str += combineProductHTMLItem(item);
    })
    productList.innerHTML = str;
}

//產品列表篩選
productSelect.addEventListener("change", function (e) {
    const category = e.target.value;
    if (category == "全部") { //如果選的 category 等於 "全部" 字串的話 
        renderProductList(); //全部產品列印出來
        return; //跳出
    }

    let str = "";
    productData.forEach(function (item) {
        if (item.category == category) {
            str += combineProductHTMLItem(item);
        }
    })

    productList.innerHTML = str;
})

//產品加入購物車
productList.addEventListener("click", function (e) {
    e.preventDefault(); //防止點擊後跳到上一頁
    let addCartClass = e.target.getAttribute("class");
    //假如滑鼠點擊 不等於 addCardBtn class，就會跳出
    if (addCartClass !== "addCardBtn") {
        return;
    }

    // 產品 id
    let productId = e.target.getAttribute("data-id");
    // 預設一筆產品數量
    let numCheck = 1;
    cartData.forEach(function (item) {
        if (item.product.id === productId) {
            numCheck = item.quantity += 1;
        }
    })

    // 新增產品到購物車
    axios.post(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts`, {
        "data": {
            "productId": productId,
            "quantity": numCheck
        }
    }).then(function (response) {
        alert("加入購物車");
        getCartList(); //重新渲染
    })

})

//取得購物車列表
function getCartList() {
    axios.get(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts`)
        .then(function (response) {
            // 購物車總金額
            document.querySelector(".js-total").textContent = toThousands(response.data.finalTotal);
            cartData = response.data.carts;
            let str = "";
            cartData.forEach(function (item) {
                str += `    <tr>
                        <td>
                            <div class="cardItem-title">
                                <img src="${item.product.images}" alt="">
                                <p>${item.product.title}</p>
                            </div>
                        </td>
                        <td>NT$${toThousands(item.product.price)}</td>
                        <td>${item.quantity}</td>
                        <td>NT$${toThousands(item.product.price * item.quantity)}</td>
                        <td class="discardBtn">
                            <a href="#" class="material-icons" data-id="${item.id}">
                                clear
                            </a>
                        </td>
                        </tr>`
            });


            cartList.innerHTML = str;

        })
}

// 刪除購物車內特定產品
cartList.addEventListener("click", function (e) {
    e.preventDefault(); //取消默認行為
    const cartId = e.target.getAttribute("data-id");
    if (cartId == null) {
        alert("你點到其他東西了喔~");
        return;
    }
    console.log(cartId);
    axios.delete(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts/${cartId}`)
        .then(function (response) {
            alert("刪除單筆購物車成功")
            getCartList();
        })
})

// 刪除全部購物車流程
const discardAllBtn = document.querySelector(".discardAllBtn");

discardAllBtn.addEventListener("click", function (e) {
    e.preventDefault();
    axios.delete(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts`)
        .then(function (response) {
            alert("刪除全部購物車成功");
            getCartList();
        })
        .catch(function (response) {
            alert("購物車已清空，請勿重複點擊");
        })
})

//送出訂單

const orderInfoBtn = document.querySelector(".orderInfo-btn");
orderInfoBtn.addEventListener("click", function (e) {
    e.preventDefault();
    // 要送出資料必須購物車內要有產品
    if (cartData.length == 0) { //假如購物車陣列的長度 等於 0，表示裡面無資料
        alert("請加入購物車");
        return;
    }

    const customerName = document.querySelector("#customerName").value;
    const customerPhone = document.querySelector("#customerPhone").value;
    const customerEmail = document.querySelector("#customerEmail").value;
    const customerAddress = document.querySelector("#customerAddress").value;
    const customertradeWay = document.querySelector("#tradeWay").value;

    //偵測欄位是否都是空值
    if (customerName == "" || customerPhone == "" || customerEmail == "" ||
        customerAddress == "" || customertradeWay == "") {
        alert("請勿輸入空資訊");
        return;
    }



    axios.post(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/orders`, {
        "data": {
            "user": {
                "name": customerName,
                "tel": customerPhone,
                "email": customerEmail,
                "address": customerAddress,
                "payment": customertradeWay
            }
        }
    }).then(function (response) {
        alert("訂單建立成功");
        //value =""，讓表單送出後，欄位清空
        document.querySelector("#customerName").value = "";
        document.querySelector("#customerPhone").value = "";
        document.querySelector("#customerEmail").value = "";
        document.querySelector("#customerAddress").value = "";
        document.querySelector("#tradeWay").value = "ATM";
        getCartList();
    })

})

//mail 格式驗證
const customerEmail = document.querySelector("#customerEmail");
customerEmail.addEventListener("blur", function (e) {
    if (validateEmail(customerEmail.value) == false) {
        document.querySelector(`[data-message="Email"]`).textContent = "請填寫正確 Email 格式";
        return;
    } else {
        document.querySelector(`[data-message="Email"]`).textContent = "填寫正確";
    }
})

const customerPhone = document.querySelector("#customerPhone");
customerPhone.addEventListener("blur", function (e) {
    e.preventDefault();
    if (validatePhone(customerPhone.value) == false) {
        document.querySelector(`[data-message="電話"]`).textContent = "請填寫正確 電話 格式";
        return;
    } else {
        document.querySelector(`[data-message="電話"]`).textContent = "填寫正確";
    }
})


//util js、元件
//千分位設計
function toThousands(x) {
    let parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

// mail 格式驗證
function validateEmail(mail) {
    if (/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(mail)) {
        return true
    }
    return false;
}

//驗證手機號碼
function validatePhone(phone) {
    if (/^[09]{2}\d{8}$/.test(phone)) {
        return true
    }
    return false;
}
