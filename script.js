let cart = JSON.parse(localStorage.getItem("cart") || "[]");

async function fetchProducts() {
  const res = await fetch("http://localhost:3000/api/products");
  return await res.json();
}

function renderProducts(products) {
  const list = document.getElementById("product-list");
  if (!list) return;
  list.innerHTML = products.map(p=>`
    <div>
      <h3>${p.name}</h3>
      <p>¥${p.price}</p>
      <button onclick="addToCart(${p.id},'${p.name}',${p.price})">加入购物车</button>
    </div>`).join("");
}

function renderCart() {
  const cartDiv = document.getElementById("cart");
  if (!cartDiv) return;
  if (cart.length === 0) { cartDiv.innerHTML="<p>购物车为空</p>"; return; }
  cartDiv.innerHTML = cart.map(c=>`<div>${c.name} × ${c.quantity} = ¥${c.price*c.quantity}</div>`).join("");
}

function addToCart(id,name,price){
  const exist = cart.find(c=>c.id===id);
  if(exist) exist.quantity++; else cart.push({id,name,price,quantity:1});
  localStorage.setItem("cart",JSON.stringify(cart));
  alert("已加入购物车");
}

const checkoutBtn = document.getElementById("checkout");
if(checkoutBtn){
  checkoutBtn.onclick = async ()=>{
    const name=document.getElementById("name").value;
    const phone=document.getElementById("phone").value;
    const address=document.getElementById("address").value;
    if(!name||!phone||!address||cart.length===0){ alert("请完整填写信息和购物车"); return;}
    const res = await fetch("http://localhost:3000/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({buyer:{name,phone,address},items:cart,total:cart.reduce((a,b)=>a+b.price*b.quantity,0)})});
    const result = await res.json();
    if(result.success){ alert("✅ 下单成功"); cart=[]; localStorage.removeItem("cart"); renderCart();}
    else alert("❌ 下单失败");
  }
}

fetchProducts().then(renderProducts);
renderCart();
