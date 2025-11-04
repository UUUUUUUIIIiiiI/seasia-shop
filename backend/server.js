import express from "express";
import fs from "fs";
import cors from "cors";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import qrcode from "qrcode-terminal";

import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5001;
const DATA_FILE = path.join(__dirname, "products.json");
const UPLOADS_DIR = path.join(__dirname, "uploads");

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(UPLOADS_DIR));

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

// WhatsApp 客户端初始化
let isReady = false;
const client = new Client({
  authStrategy: new LocalAuth(),
});

client.on("qr", (qr) => {
  console.log("📱 请用手机扫描二维码登录 WhatsApp:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("✅ WhatsApp 客户端已连接");
  isReady = true;
});

client.on("auth_failure", () => {
  console.log("❌ WhatsApp 登录失败，请重新扫码");
});

client.initialize();

const adminNumber = "8562091679831@c.us"; // ⚠️ 替换为你的真实 WhatsApp 号码，格式：国家码+手机号+@c.us

// multer 上传配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// 获取商品列表接口
app.get("/api/products", (req, res) => {
  if (!fs.existsSync(DATA_FILE)) return res.json([]);
  const products = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  res.json(products);
});

// 提交订单接口
app.post("/api/orders", async (req, res) => {
  const { cart, total, buyer } = req.body;

  if (!cart || !cart.length || !buyer?.name || !buyer?.phone) {
    return res.status(400).json({ success: false, message: "缺少订单信息" });
  }

  if (!isReady) {
    return res.status(500).json({ success: false, message: "WhatsApp 尚未连接" });
  }

  // 追加订单写入本地 orders.json
  const ordersFile = path.join(__dirname, "orders.json");
  let orders = [];
  if (fs.existsSync(ordersFile)) {
    try {
      orders = JSON.parse(fs.readFileSync(ordersFile, "utf-8"));
    } catch (e) {
      console.error("读取订单文件失败:", e);
    }
  }

  const newOrder = {
    id: Date.now(),
    buyer,
    cart,
    total,
    time: new Date().toISOString(),
  };
  orders.push(newOrder);
  fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2));

  // 构造 WhatsApp 消息文本
  const message = `
📦 新订单通知
👤 客户：${buyer.name}
📞 电话：${buyer.phone}
🛒 商品：
${cart.map(i => `- ${i.name} × ${i.quantity}`).join("\n")}
💰 总价：¥${total}
🕒 时间：${new Date().toLocaleString()}
`;

  try {
    await client.sendMessage(adminNumber, message);
    console.log("✅ WhatsApp 消息发送成功");
    res.json({ success: true, message: "订单已提交，客服会通过 WhatsApp 联系您" });
  } catch (err) {
    console.error("❌ WhatsApp 发送失败:", err);
    res.status(500).json({ success: false, message: "发送 WhatsApp 消息失败" });
  }
});

// 启动服务
app.listen(PORT, () => {
  console.log(`✅ 服务器运行中：http://localhost:${PORT}`);
});
