async function fetchProducts(){
  const res = await fetch("http://localhost:3000/api/products");
  return await res.json();
}

async function fetchOrders(){
  const res = await fetch("http://localhost:3000/api/orders");
  return await res.json();
}

// 商品管理
const productList = document.getElementById("product-list");
if(productList){
  async function renderProducts(){
    const products = await fetchProducts();
    productList.innerHTML = products.map(p=>`<div>${p.name} ¥${p.price} 库存:${p.stock} <button onclick="deleteProduct(${p.id})">删除</button></div>`).join("");
  }
  window.deleteProduct = async id=>{
    await fetch(`http://localhost:3000/api/products/${id}`,{method:"DELETE"});
    renderProducts();
  }
  document.getElementById("addProduct")?.addEventListener("click",async ()=>{
    const name=document.getElementById("pname").value;
    const price=Number(document.getElementById("pprice").value);
    const stock=Number(document.getElementById("pstock").value);
    await fetch("http://localhost:3000/api/products",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,price,stock})});
    renderProducts();
  });
  renderProducts();
}

// 订单管理
const orderList = document.getElementById("order-list");
if(orderList){
  let lastLen = 0;
  async function renderOrders(){
    const orders = await fetchOrders();
    if(orders.length>lastLen){ document.getElementById("notify").play(); lastLen = orders.length;}
    orderList.innerHTML = orders.map((o,i)=>`<div>
      <strong>订单 ${o.id}</strong><br>
      买家: ${o.buyer.name} 电话: ${o.buyer.phone} 地址: ${o.buyer.address}<br>
      商品: ${o.items.map(it=>it.name+"×"+it.quantity).join(", ")}<br>
      总价: ¥${o.total} 状态: ${o.status} <button onclick="confirmOrder('${o.id}')">确认</button>
    </div>`).join("");
  }
  window.confirmOrder = async id=>{
    await fetch(`http://localhost:3000/api/orders/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"已确认"})});
    renderOrders();
  }
  setInterval(renderOrders,5000);
  renderOrders();
}
