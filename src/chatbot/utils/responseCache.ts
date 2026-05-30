/**
 * 本地响应缓存 - 减少 LLM 调用延迟
 * 缓存常见问题的回复，提供即时响应
 */

interface CacheEntry {
  response: string;
  timestamp: number;
  hitCount: number;
}

const CACHE_DURATION = 1000 * 60 * 30; // 30分钟
const MAX_CACHE_SIZE = 50;

class ResponseCache {
  private cache: Map<string, CacheEntry> = new Map();

  // 常见问题的预设回复
  private presetResponses: Map<string, string> = new Map([
    ['你好', '你好呀！我是小柱🦕，孩子的脊柱健康小助手。有什么我可以帮您的吗？'],
    ['你好小柱', '你好呀！我是小柱🦕，孩子的脊柱健康小助手。有什么我可以帮您的吗？'],
    ['小柱', '我在呢！🦕 请问有什么可以帮您的？'],
    ['谢谢', '不客气！😊 有任何问题随时找我，我们一起守护孩子的脊柱健康！'],
    ['再见', '再见！记得定期关注孩子的体态变化哦，有问题随时找我！🦕'],
    ['拜拜', '拜拜！照顾好孩子的脊柱健康，有问题随时找我！🦕'],
    ['你是谁', '我是小柱🦕，一位专门帮助家长了解孩子脊柱健康的AI助手。我可以帮您：\n\n1. **体态筛查指导** - 教您如何在家观察孩子的脊柱状态\n2. **Adams测试** - 指导您完成专业的弯腰测试\n3. **康复建议** - 根据筛查结果提供个性化的运动建议\n4. **答疑解惑** - 解答关于脊柱侧弯、体态问题的各种疑问\n\n有什么我可以帮您的吗？'],
    ['你能做什么', '我可以帮您：\n\n1. **体态筛查** - 指导您在家为孩子做简单的脊柱检查\n2. **Adams弯腰测试** - 通过摄像头AI分析背部对称性\n3. **风险评估** - 根据问卷和测试结果评估脊柱侧弯风险\n4. **康复指导** - 提供科学的居家运动建议\n5. **报告解读** - 帮您理解筛查报告的含义\n\n您想从哪方面开始了解呢？'],
    ['脊柱侧弯是什么', '脊柱侧弯是指脊柱向侧方弯曲，同时伴有椎体旋转的一种三维畸形。简单理解：\n\n🌲 **正常脊柱** - 像一棵笔直的小树，从背后看是一条直线\n🌿 **侧弯脊柱** - 像一棵被风吹歪的小树，向一侧弯曲\n\n**常见表现**：\n- 双肩高低不平\n- 肩胛骨（蝴蝶骨）一侧突出\n- 腰部两侧褶皱不对称\n- 弯腰时背部一侧隆起（剃刀背）\n\n**重要提醒**：\n- 10-16岁是脊柱侧弯高发期\n- 女孩比男孩更容易发生\n- 早发现、早干预效果最好！\n\n您想了解一下如何在家初步筛查吗？'],
    ['怎么检查', '在家可以按以下步骤初步观察：\n\n**第一步：站立观察** 👀\n让孩子自然站立，从背后观察：\n- 双肩是否一样高？\n- 两个肩胛骨是否对称？\n- 腰部褶皱是否深浅一致？\n\n**第二步：Adams弯腰测试** 🙇\n1. 孩子双脚并拢站立\n2. 双手合十，向前弯腰90度\n3. 从背后观察背部是否对称\n4. 一侧隆起可能是脊柱侧弯的信号\n\n**第三步：使用我们的工具** 📱\n我可以帮您打开摄像头，通过AI自动分析背部对称性，比肉眼观察更准确！\n\n要不要试试？'],
    ['adams测试', 'Adams前屈测试是筛查脊柱侧弯的金标准方法！\n\n**操作步骤**：\n1. 孩子脱去上衣，双脚并拢站立\n2. 双手合十，手臂伸直\n3. 缓慢向前弯腰，直到背部与地面平行\n4. 从正后方观察背部两侧是否对称\n\n**观察要点**：\n- ✅ 对称平整 → 正常\n- ⚠️ 一侧轻微隆起 → 建议进一步检查\n- 🚨 明显隆起（剃刀背）→ 建议尽快就医\n\n我可以帮您打开摄像头，通过AI自动分析，更准确哦！要试试吗？'],
    ['孩子背痛', '⚠️ **重要提醒**：青少年脊柱侧弯通常**不会引起疼痛**！\n\n如果孩子有背痛，特别是以下情况，请务必重视：\n\n🚨 **危险信号**：\n- 夜间痛醒\n- 持续性疼痛不缓解\n- 疼痛向腿部放射\n- 伴有发热、体重下降\n\n**可能原因**：\n- 肌肉拉伤/劳损\n- 脊柱感染或炎症\n- 其他骨骼问题\n\n**建议**：\n请尽快带孩子到三甲医院骨科或康复科就诊，可能需要做MRI检查明确原因。**不要**盲目按摩或推拿！\n\n您方便描述一下疼痛的具体情况吗？'],
    ['如何预防', '预防脊柱侧弯，日常生活中可以注意以下几点：\n\n**🪑 坐姿习惯**\n- 保持"三个90度"：大腿与躯干90°、小腿与大腿90°、上臂与前臂90°\n- 避免长时间低头玩手机\n- 每30-40分钟起身活动\n\n**🎒 书包选择**\n- 双肩背包优于单肩包\n- 书包重量不超过体重的10%\n- 调整肩带使书包紧贴背部\n\n**🏃 运动建议**\n- 游泳（尤其是自由泳、仰泳）\n- 单杠悬吊\n- 核心肌群训练\n\n**🛏️ 睡眠环境**\n- 选择中等硬度床垫\n- 避免长期单侧卧睡\n\n**⚠️ 定期检查**\n- 建议每3-6个月做一次Adams测试\n- 青春期（10-16岁）更要密切观察\n\n您想深入了解哪方面呢？'],
    ['什么运动好', '对脊柱健康有益的运动：\n\n**🏊 推荐运动**\n- **游泳** - 最佳！水的浮力减轻脊柱压力，自由泳和仰泳效果最好\n- **单杠** - 悬吊拉伸脊柱，缓解压缩\n- **瑜伽** - 增强核心稳定性\n- **普拉提** - 改善体态和平衡\n\n**⚠️ 需谨慎的运动**\n- 举重、深蹲等负重训练（需专业指导）\n- 单侧发力的运动（如羽毛球长期单侧挥拍）\n\n**💡 日常小动作**\n- 猫式伸展\n- 小燕飞\n- 臀桥\n- 侧卧蚌式开合\n\n我可以为您提供具体的动作指导，需要吗？'],
    ['需要手术吗', '是否需要手术取决于侧弯的严重程度：\n\n**📊 Cobb角分级**\n- **< 20°**（轻度）→ 观察+康复训练，通常不需要手术\n- **20-40°**（中度）→ 支具矫正+康复训练\n- **40-50°**（重度）→ 可能需要手术评估\n- **> 50°**（极重度）→ 通常需要手术\n\n**🎯 手术指征**：\n- Cobb角>45-50°且持续进展\n- 支具治疗无效\n- 影响心肺功能\n- 严重影响外观和心理健康\n\n**💡 重要提醒**：\n大多数脊柱侧弯（约90%）不需要手术！早期发现、科学干预是关键。\n\n您孩子的具体情况是怎样的？我可以帮您评估一下风险等级。'],
  ]);

  get(key: string): string | null {
    // 先检查预设回复
    const normalizedKey = key.trim().toLowerCase();
    
    for (const [presetKey, response] of this.presetResponses) {
      if (normalizedKey.includes(presetKey.toLowerCase())) {
        return response;
      }
    }

    // 再检查缓存
    const cached = this.cache.get(normalizedKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      cached.hitCount++;
      return cached.response;
    }

    return null;
  }

  set(key: string, response: string): void {
    // 清理过期缓存
    this.cleanup();

    // 限制缓存大小
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key.trim().toLowerCase(), {
      response,
      timestamp: Date.now(),
      hitCount: 1,
    });
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }

  // 获取缓存统计
  getStats(): { size: number; presetSize: number } {
    return {
      size: this.cache.size,
      presetSize: this.presetResponses.size,
    };
  }
}

export const responseCache = new ResponseCache();
