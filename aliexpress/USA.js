console.log('速卖通价格转换插件启动');

/**
 详情中间的小价格
 <span style="color: #999999;font-size: 12.0px;line-height: 1;"><em style="color: #bd1a1d;font-style: normal;font-weight: 700;" data-spm-anchor-id="2114.10010108.1000023.i0.1dc9737bNF6mAv">USD 2.05-3.63</em>/piece</span>

//详情价主价
<span id="j-sku-discount-price" class="p-price" data-spm-anchor-id="2114.10010108.1000016.i2.3c2e6347bvBgsX">4.44</span>
<span id="j-sku-discount-price" class="p-price" data-spm-anchor-id="2114.10010108.1000016.i2.3c2e6347bvBgsX"><span itemprop="lowPrice">4.23</span> - <span itemprop="highPrice">4.51</span></span>
**/
let rate = 0;//当前国家的汇率  目前先做美元

let node_all = [
    ['div', 'sale-price'],
    ['div', 'price'],
    ['span', 'value'],
    ['span', 'p-price'],
    ['span', 's-price'],
    ['b', 'notranslate'],
    ['span', 'notranslate'],
    ['span', 'current-price'],
    ['div', 'detail-price'],
    ['span', 'product-price-value'],
    ['div', 'may-like-price']
];
//====统一监听body的改变，触发总回调
let callback = function (records) {
    chrome.storage.local.get(['aliexpress_tag'],function(s){
        const {aliexpress_tag} = s
        if(aliexpress_tag){
            all();
        }else{
            console.log('aliexpress开关关闭')
        }

    })
};
let throttle_callback = _.throttle(callback, 3000);
let mo = new MutationObserver(throttle_callback);
let option = {
    'childList': true,
    'subtree': true
};
let fs_node = document.getElementsByTagName("body")[0];
try {
    mo.observe(fs_node, option);
} catch (e) {

    console.log('监听器启动失败body."');
}
function all() {
    console.log('总回调启动.');
    chrome.storage.local.get(["my_rate"], function (result) {
        //console.log(result);
        rate = result.my_rate['rate_USD'];
        //console.log(rate);
        //判断元素有无，及生成处理函数
        find_node(node_all);
        //特别处理详情页二段式价格
        P2();
        //5-20发现的详情页中新加的元素<div class="item-price"><span data-spm-anchor-id="a2g0o.detail.1000014.i14.1b0e45caMHcfQY">US $9.02</span></div>
        let p3 = document.querySelectorAll('div[class*="item-price"]');
        if (p3[0]) {
            P3(p3);
        }

    })
}
let rg2 = /^(US \$){0,1}\d{1,}(\.\d{2}){0,1}( \- \d{1,}\.\d{2}){0,1}/;

function P3(nodes){
    let rg3 = /^(US \$){0,1}\d{1,}(\.\d{2}){0,1}( \- \d{1,}\.\d{2}){0,1}$/;
    let a = nodes.length;
    for(let i = 0;i<a;i++){
        if(nodes[i].firstChild&&nodes[i].firstChild.tagName==='SPAN'){
            let b = nodes[i].firstChild.innerHTML;
            if(rg3.test(b)){
                let rmb = priceRmb(b);
                nodes[i].firstChild.innerHTML = b + `<sub style="color:green"> ￥${rmb}</sub>`;
            }
        }
    }
}   




//详情页主价二段式，特别处理
function P2() {
    let low = document.querySelectorAll('span[itemprop="lowPrice"]')[0];
    let high = document.querySelectorAll('span[itemprop="highPrice"]')[0];
    if (low) {
        if (!low.innerHTML.includes('￥') && rg2.test(low.innerHTML)) {
            console.log(low.innerHTML);
            let rmb = priceRmb(low.innerHTML);
            low.innerHTML = low.innerHTML + `<sub style="color:green"> ￥${rmb}</sub>`;
        }
    }
    if (high) {
        if (!high.innerHTML.includes('￥') && rg2.test(high.innerHTML)) {
            console.log(high.innerHTML);
            let rmb = priceRmb(high.innerHTML);
            high.innerHTML = high.innerHTML + `<sub style="color:green"> ￥${rmb}</sub>`;
        }
    }

}

//let rg1 =/^(US \$){0,1}\d{1,}\.\d{2}$/;

//let rg3 =/^(US \$){0,1}\d{1,}\.\d{2}( \(about \d{1,}%\)){0,1}( \- \d{1,}\.\d{2}){0,1}/;
//找出元素
function find_node(node_all) {
    for (let node of node_all) {
        if (document.querySelectorAll(`${node[0]}[class="${node[1]}"]`)[0]) {
            qs9(node);

        }
    }
}

//替换html
const qs9 = function (node, classname) {
    let a = document.querySelectorAll(`${node[0]}[class="${node[1]}"]`);
    let a_length = a.length;
    for (let i = 0; i < a_length; i++) {
        let s = a[i].innerHTML.trim();
        if (!rg2.test(s)) {
            continue;
        }
        if (s.includes('￥')) {
            continue;
        }
        let rmb = priceRmb(s);
        a[i].innerHTML = s + `<sub style="color:green"> ￥${rmb}</sub>`;
    }
}

const priceRmb = function (s) {
    if (s.includes('-')) {
        let ar = s.split('-');
        let p1 = ((parseFloat(ar[0].trim().replace('US $', ''))) / rate).toFixed(2);
        let p2 = (parseFloat(ar[1].trim()) / rate).toFixed(2);
        return p1 + ' - ' + p2 + '元';

    } else {
        let p = parseFloat(s.replace('US $', ''));
        let price = (p / rate).toFixed(2);
        return price;
    }
}
