const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const dataStore = require("../utils/dataStore");

/**
 * 获取聊天历史记录
 * GET /api/chat/history/:targetId
 */
router.get("/history/:targetId", auth, async (req, res) => {
  try {
    const { targetId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;

    // 构建聊天记录的键
    const chatKey = `chat_${userId}_${targetId}`;

    // 从数据存储中获取聊天记录
    let chatHistory = (await dataStore.get("chatHistory")) || {};
    let messages = chatHistory[chatKey] || [];

    // 分页处理
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedMessages = messages.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: {
        messages: paginatedMessages,
        total: messages.length,
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: endIndex < messages.length,
      },
    });
  } catch (error) {
    console.error("获取聊天历史失败:", error);
    res.status(500).json({
      success: false,
      message: "获取聊天历史失败",
    });
  }
});

/**
 * 发送消息
 * POST /api/chat/send
 */
router.post("/send", auth, async (req, res) => {
  try {
    const { targetId, content, type = "text" } = req.body;
    const userId = req.user.id;

    if (!targetId || !content) {
      return res.status(400).json({
        success: false,
        message: "目标ID和消息内容不能为空",
      });
    }

    // 构建消息对象
    const message = {
      id: Date.now().toString(),
      senderId: userId,
      targetId: targetId,
      content: content,
      type: type, // text, image, file
      timestamp: new Date().toISOString(),
      status: "sent", // sent, delivered, read
    };

    // 构建聊天记录的键
    const chatKey = `chat_${userId}_${targetId}`;

    // 获取现有聊天记录
    let chatHistory = (await dataStore.get("chatHistory")) || {};
    if (!chatHistory[chatKey]) {
      chatHistory[chatKey] = [];
    }

    // 添加新消息
    chatHistory[chatKey].push(message);

    // 保持最近1000条消息
    if (chatHistory[chatKey].length > 1000) {
      chatHistory[chatKey] = chatHistory[chatKey].slice(-1000);
    }

    // 保存到数据存储
    await dataStore.set("chatHistory", chatHistory);

    // 如果是发送给客服，模拟客服自动回复
    if (targetId.startsWith("service")) {
      setTimeout(async () => {
        const autoReply = generateAutoReply(content);
        const serviceMessage = {
          id: (Date.now() + 1).toString(),
          senderId: targetId,
          targetId: userId,
          content: autoReply,
          type: "text",
          timestamp: new Date().toISOString(),
          status: "sent",
        };

        chatHistory[chatKey].push(serviceMessage);
        await dataStore.set("chatHistory", chatHistory);
      }, 1000 + Math.random() * 2000); // 1-3秒随机延迟
    }

    res.json({
      success: true,
      data: message,
      message: "消息发送成功",
    });
  } catch (error) {
    console.error("发送消息失败:", error);
    res.status(500).json({
      success: false,
      message: "发送消息失败",
    });
  }
});

/**
 * 标记消息为已读
 * PUT /api/chat/read
 */
router.put("/read", auth, async (req, res) => {
  try {
    const { targetId, messageIds } = req.body;
    const userId = req.user.id;

    if (!targetId || !messageIds || !Array.isArray(messageIds)) {
      return res.status(400).json({
        success: false,
        message: "参数错误",
      });
    }

    const chatKey = `chat_${userId}_${targetId}`;
    let chatHistory = (await dataStore.get("chatHistory")) || {};

    if (chatHistory[chatKey]) {
      chatHistory[chatKey] = chatHistory[chatKey].map((message) => {
        if (messageIds.includes(message.id) && message.senderId !== userId) {
          return { ...message, status: "read" };
        }
        return message;
      });

      await dataStore.set("chatHistory", chatHistory);
    }

    res.json({
      success: true,
      message: "消息已标记为已读",
    });
  } catch (error) {
    console.error("标记消息已读失败:", error);
    res.status(500).json({
      success: false,
      message: "标记消息已读失败",
    });
  }
});

/**
 * 获取聊天列表
 * GET /api/chat/list
 */
router.get("/list", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    let chatHistory = (await dataStore.get("chatHistory")) || {};
    let chatList = [];

    // 遍历所有聊天记录，找到用户相关的聊天
    for (const [chatKey, messages] of Object.entries(chatHistory)) {
      if (chatKey.includes(userId) && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        const targetId = chatKey.replace(`chat_${userId}_`, "");

        // 计算未读消息数
        const unreadCount = messages.filter(
          (msg) => msg.senderId !== userId && msg.status !== "read"
        ).length;

        chatList.push({
          targetId: targetId,
          targetName: getTargetName(targetId),
          targetAvatar: getTargetAvatar(targetId),
          lastMessage: {
            content: lastMessage.content,
            timestamp: lastMessage.timestamp,
            type: lastMessage.type,
          },
          unreadCount: unreadCount,
          updatedAt: lastMessage.timestamp,
        });
      }
    }

    // 按最后更新时间排序
    chatList.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    res.json({
      success: true,
      data: chatList,
    });
  } catch (error) {
    console.error("获取聊天列表失败:", error);
    res.status(500).json({
      success: false,
      message: "获取聊天列表失败",
    });
  }
});

/**
 * 删除聊天记录
 * DELETE /api/chat/:targetId
 */
router.delete("/:targetId", auth, async (req, res) => {
  try {
    const { targetId } = req.params;
    const userId = req.user.id;

    const chatKey = `chat_${userId}_${targetId}`;
    let chatHistory = (await dataStore.get("chatHistory")) || {};

    if (chatHistory[chatKey]) {
      delete chatHistory[chatKey];
      await dataStore.set("chatHistory", chatHistory);
    }

    res.json({
      success: true,
      message: "聊天记录删除成功",
    });
  } catch (error) {
    console.error("删除聊天记录失败:", error);
    res.status(500).json({
      success: false,
      message: "删除聊天记录失败",
    });
  }
});

/**
 * 生成自动回复内容
 * @param {string} userMessage 用户消息
 * @returns {string} 自动回复内容
 */
function generateAutoReply(userMessage) {
  const message = userMessage.toLowerCase();

  if (message.includes("订单") || message.includes("order")) {
    return '关于订单问题，您可以在"我的订单"中查看订单状态。如需取消订单，请在订单详情页面操作。有其他订单相关问题请详细描述，我会为您解答。';
  } else if (message.includes("退款") || message.includes("退货")) {
    return '退款退货流程：1. 进入"我的订单"找到相应订单；2. 点击"申请退款"；3. 填写退款原因；4. 等待审核。一般3-7个工作日处理完成。';
  } else if (message.includes("物流") || message.includes("快递")) {
    return '您可以在"我的订单"中点击"查看物流"来跟踪包裹状态。如果物流信息长时间未更新，请提供订单号，我来帮您查询。';
  } else if (message.includes("优惠券") || message.includes("coupon")) {
    return '优惠券使用说明：1. 在结算页面选择可用优惠券；2. 注意使用条件和有效期；3. 部分商品可能不支持优惠券。更多优惠券可在"优惠券中心"领取。';
  } else if (message.includes("账户") || message.includes("密码")) {
    return '账户相关问题：忘记密码可通过"找回密码"功能重置；账户安全问题请及时联系客服；个人信息可在"个人资料"中修改。';
  } else if (message.includes("支付") || message.includes("付款")) {
    return "支付相关问题：我们支持微信支付、支付宝等多种支付方式。如遇支付失败，请检查网络连接或更换支付方式。如有扣款但订单未生成，请联系客服处理。";
  } else if (message.includes("商品") || message.includes("产品")) {
    return "商品相关咨询：您可以在商品详情页查看详细信息、用户评价等。如需了解库存、规格等具体问题，请提供商品名称或链接，我来为您查询。";
  } else if (
    message.includes("你好") ||
    message.includes("hello") ||
    message.includes("hi")
  ) {
    return "您好！很高兴为您服务。请问有什么可以帮助您的吗？您可以咨询订单、退款、物流、商品等相关问题。";
  } else {
    return "感谢您的咨询！我已收到您的问题，正在为您查询相关信息。如果问题比较复杂，建议您拨打客服热线400-123-4567，我们的人工客服会为您详细解答。";
  }
}

/**
 * 获取目标名称
 * @param {string} targetId 目标ID
 * @returns {string} 目标名称
 */
function getTargetName(targetId) {
  if (targetId.startsWith("service")) {
    return "客服小助手";
  }
  return "用户";
}

/**
 * 获取目标头像
 * @param {string} targetId 目标ID
 * @returns {string} 头像路径
 */
function getTargetAvatar(targetId) {
  if (targetId.startsWith("service")) {
    return "/static/images/avatar/service.png";
  }
  return "/static/images/avatar/user.png";
}

module.exports = router;
