import express from "express";
import bodyParser from "body-parser";
import path from "path";
import twilio from "twilio";

const __dirname = path.resolve();
const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "frontend")));

// ✅ 配置 Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

// ✅ 接收前端订单信息并推送到 WhatsApp
app.post("/api/order", async (req, res) => {
  try {
    const { name, product, price } = req.body;

    const message = `
📦 *新订单提醒*
👤 姓名：${name}
🛒 商品：${product}
💰 价格：${price}₭
时间：${new Date().toLocaleString("zh-CN", { timeZone: "Asia/Bangkok" })}
`;

    // ✅ 发送 WhatsApp 消息
    await client.messages.create({
      from: "whatsapp:++17159898118", // Twilio 官方测试号
      to: "whatsapp:+8562091679831",   // ⚠️ 你的 WhatsApp 号码（含国家区号）
      body: message
    });

    res.json({ success: true, message: "订单已发送到 WhatsApp！" });
  } catch (error) {
    console.error("❌ 发送失败:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ 渲染前端主页
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
