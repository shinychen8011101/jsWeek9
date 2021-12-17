

let orderData = [];
const orderList = document.querySelector(".js-orderList");

function init() {
    getOrderList();
}

init();

//c3 圖表
function renderC3() {
    console.log(orderData);

    // 物件資料蒐集
    let total = {};
    orderData.forEach(function (item) {
        item.products.forEach(function (productItem) {
            // 假如等於 undefined(沒有分類) 就直接 加總
            if (total[productItem.category] == undefined) {
                total[productItem.category] = productItem.price * productItem.quantity;
            } else { //否則把每個 分類的 價錢 price * 數量 quantity
                total[productItem.category] += productItem.price * productItem.quantity;
            }
        })
    })
    console.log(total); //{床架: 15780, 收納: 780}

    //做出資料關聯
    let categoryAry = Object.keys(total);
    console.log(categoryAry);
    let newData = [];
    categoryAry.forEach(function (item) {
        let ary = [];
        ary.push(item);
        ary.push(total[item]);
        newData.push(ary);
    })
    console.log(newData);

    let chart = c3.generate({
        bindto: '#chart', // HTML 元素綁定
        data: {
            columns: newData,
            type: "pie"
        }
    });

}

function renderC3_lv2() {
    //資料蒐集
    let obj = {};
    orderData.forEach(function (item) {
        item.products.forEach(function (productItem) {
            if (obj[productItem.title] === undefined) {
                obj[productItem.title] = productItem.quantity * productItem.price;
            } else {
                obj[productItem.title] += productItem.quantity * productItem.price;

            }
        })
    });
    console.log(obj);

    // 拉出資料關聯
    let originAry = Object.keys(obj);
    console.log(originAry);
    // 透過 originAry，整理成 C3 格式
    let rankSortAry = [];

    originAry.forEach(function (item) {
        let ary = [];
        ary.push(item);
        ary.push(obj[item]);
        rankSortAry.push(ary);
    });
    console.log(rankSortAry);


    // 比大小，降冪排列（目的：取營收前三高的品項當主要色塊，把其餘的品項加總起來當成一個色塊）
    // sort: https://developer.mozilla.org/zh-TW/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
    rankSortAry.sort(function (a, b) {
        return b[1] - a[1];
        // b-a，降冪排列，金額最大的在最前面，依序排序
        //b[1]-a[1]，因為陣列不能跟陣列比較，所以要取索引值[1]的數字來比較
    })

    // 如果筆數超過 4 筆以上，就統整為其它
    // 如果小於 3，就直接印出圖表即可
    if (rankSortAry.length > 3) {
        let otherTotal = 0;
        rankSortAry.forEach(function (item, index) {
            // 假如訂單有 5 筆資料，(index > 2)，就是第 3 筆以後的資料都加總其他，index 是索引值，從 0 開始
            if (index > 2) {
                otherTotal += rankSortAry[index][1]; //資料格式 ['Louvre 雙人床架／雙人加大', 18000]
            }
        })
        rankSortAry.splice(3, rankSortAry.length - 1); //把第 4 筆資料移除
        rankSortAry.push(['其他', otherTotal]); // 產生一個 其他  分類的資料

    }


    // 超過三筆後將第四名之後的價格加總起來放在 otherTotal
    // c3 圖表
    c3.generate({
        bindto: '#chart',
        data: {
            columns: rankSortAry,
            type: 'pie',
        },
        color: {
            pattern: ["#301E5F", "#5434A7", "#9D7FEA", "#DACBFF"]
        }
    });
}


//取得購物車訂單列表
function getOrderList() {
    axios.get(`https://livejs-api.hexschool.io/api/livejs/v1/admin/${api_path}/orders`, {
        headers: {
            'Authorization': token, //產品金鑰
        }
    })
        .then(function (response) {
            orderData = response.data.orders;

            let str = "";
            orderData.forEach(function (item) {
                // 組時間字串
                // new date(毫秒)，要有13碼才會轉換，所以要 * 1000
                // getMonth() 從 0 開始，所以要 +1
                const timeStamp = new Date(item.createdAt * 1000);
                const orderTime = `${timeStamp.getFullYear()}/${timeStamp.getMonth() + 1}/${timeStamp.getDate()}`;

                // 組產品字串
                let productStr = "";
                item.products.forEach(function (productItem) {
                    productStr += `<p>${productItem.title} x ${productItem.quantity}</p>`
                })

                //判斷訂單處理狀態
                let orderStatus = "";
                if (item.paid == true) {
                    orderStatus = "已處理";
                } else {
                    orderStatus = "未處理";
                }

                // 組訂單字串
                str += `  <tr>
                <td>${item.id}</td>
                <td>
                    <p>${item.user.name}</p>
                    <p>${item.user.tel}</p>
                </td>
                <td>${item.user.address}</td>
                <td>${item.user.email}</td>
                <td>
                    ${productStr}
                </td>
                <td>${orderTime}</td>
                <td class="js-orderStatus">
                    <a href="#" class="orderStatus" data-status="${item.paid}" data-id="${item.id}">${orderStatus}</a>
                </td>
                <td>
                    <input type="button" class="delSingleOrder-Btn js-orderDelete" data-id="${item.id}" value="刪除">
                </td>
            </tr>`;
            })

            orderList.innerHTML = str;
            renderC3_lv2(); //再一次渲染 c3 圖表

        })
}


//處理狀態、刪除
orderList.addEventListener("click", function (e) {
    e.preventDefault();
    const tagetClass = e.target.getAttribute("class");
    let id = e.target.getAttribute("data-id");

    //刪除訂單
    if (tagetClass == "delSingleOrder-Btn js-orderDelete") {
        deletOrderItem(id);
        return;
    }

    ///處理狀態
    if (tagetClass == "orderStatus") {
        let status = e.target.getAttribute("data-status");
        changeOrderStatus(status, id);
        return;
    }
})


//訂單處理狀態
function changeOrderStatus(status, id) {
    console.log(status, id);

    //轉換訂單狀態
    //因為未處理點擊後要變 已處理
    let newStatus;
    if (status == true) { //假如 status 等於 true (已處理)
        newStatus = false; //要變成 false (未處理)
    } else {
        newStatus = true;
    }

    axios.put(`https://livejs-api.hexschool.io/api/livejs/v1/admin/${api_path}/orders`, {
        "data": {
            "id": id,
            "paid": newStatus
        }
    },
        {
            headers: {
                'Authorization': token, //產品金鑰
            }
        })
        .then(function (response) {
            alert("修改訂單狀態成功");
            getOrderList();
        })
}

//刪除訂單
function deletOrderItem(id) {
    axios.delete(`https://livejs-api.hexschool.io/api/livejs/v1/admin/${api_path}/orders/${id}`, {
        headers: {
            'Authorization': token, //產品金鑰
        }
    })
        .then(function (response) {
            alert("刪除該筆訂單成功");
            getOrderList();
        })
}

const discardAllBtn = document.querySelector(".discardAllBtn");
discardAllBtn.addEventListener("click", function (e) {
    e.preventDefault();
    axios.delete(`https://livejs-api.hexschool.io/api/livejs/v1/admin/${api_path}/orders`, {
        headers: {
            'Authorization': token, //產品金鑰
        }
    })
        .then(function (response) {
            alert("刪除全部訂單成功");
            getOrderList();
        })
})


