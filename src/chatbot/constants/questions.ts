/**
 * 家长端 Chatbot 对话文案
 *
 * 面向人群：家长（为孩子做脊柱健康筛查）
 * 所有用户可见的中文文案集中管理，方便未来 i18n
 */

export const QUESTIONS = {
  greeting: [
    '你好！我是小柱 🧒，儿童脊柱健康小助手',
    '花大约 2 分钟，帮您了解一下孩子的脊柱侧弯风险。',
    '准备好了吗？',
  ],

  name: ['先告诉我孩子的名字或小名吧。'],

  gender: ['孩子的性别是？'],

  age: ['孩子今年的年龄是？（脊柱侧弯在 10-16 岁最高发，早发现早干预）'],

  growth_spurt: ['最近一年，孩子身高长得快吗？'],

  family_scoliosis: [
    '家里人（父母、兄弟姐妹）有被诊断过脊柱侧弯吗？',
    '（家族史是最重要的参考因素之一）',
  ],

  back_pain: ['最近几个月，孩子有没有说过背部疼或者酸？'],

  pain_level: ['如果 0 是完全不疼，10 是疼得受不了，孩子大概有几分疼？'],

  posture_shoulders: ['让孩子站直，您从正面/背面看看——两个肩膀一样高吗？'],

  posture_scapula: ['再看看肩胛骨（后背的"蝴蝶骨"），两边对称吗？有没有一边更突出？'],

  posture_waist: ['让孩子双手叉腰，腰部两侧的曲线对称吗？'],

  adams_intro: [
    '接下来做个简单的"弯腰测试"（医生也叫 Adam\'s 前屈测试）👆',
    '让孩子站直，双脚并拢，慢慢向前弯腰 90°。',
    '您从背后观察：背部两侧是否一样高？有没有一侧隆起？',
    '这是筛查脊柱侧弯最重要的一步。',
  ],

  adams_method: ['您想用什么方式完成这个测试？'],

  adams_camera: [
    '请让孩子背对摄像头站好，慢慢向前弯腰。',
    '保持弯腰姿势 3 秒钟，系统会自动分析。',
  ],

  adams_result_detected: (result: string) => {
    if (result === 'significant_hump') {
      return ['检测完成！弯腰时孩子背部检测到**明显不对称**，可能存在肋骨隆起。'];
    }
    if (result === 'mild_asymmetry') {
      return ['检测完成！弯腰时孩子背部检测到**轻微不对称**。'];
    }
    return ['检测完成！弯腰时孩子背部**基本对称**，未检测到明显隆起。'];
  },

  results: ['根据您提供的信息，我为孩子做了风险评估：'],

  confirmation: ['要把筛查结果保存到系统里吗？方便以后对比变化。'],

  done: (level: string) => {
    if (level === '低风险') {
      return ['检查完成！✅', '目前风险较低，让孩子保持良好姿势，定期观察就好。'];
    }
    if (level === '轻度关注') {
      return ['检查完成！📋', '有一些因素值得留意，建议定期关注孩子的体态变化。'];
    }
    if (level === '中度风险') {
      return ['检查完成！⚠️', '建议带孩子到脊柱专科或康复科做一次专业评估。'];
    }
    return ['检查完成！🚨', '建议尽快带孩子到骨科或脊柱专科就诊，别耽误！'];
  },
};

export const OPTIONS = {
  start: [{ label: '开始检查', value: 'start' }],

  gender: [
    { label: '男孩', value: '男' },
    { label: '女孩', value: '女' },
  ],

  growth_spurt: [
    { label: '长得挺快', value: '长得挺快' },
    { label: '一般', value: '一般' },
    { label: '基本没长', value: '基本没长' },
  ],

  family_scoliosis: [
    { label: '有', value: '有' },
    { label: '没有', value: '没有' },
    { label: '不确定', value: '不确定' },
  ],

  back_pain: [
    { label: '经常疼', value: '经常疼' },
    { label: '偶尔会疼', value: '偶尔会疼' },
    { label: '从没说过疼', value: '从不疼' },
  ],

  posture: [
    { label: '一样高', value: '一样高' },
    { label: '右肩高', value: '右肩高' },
    { label: '左肩高', value: '左肩高' },
    { label: '看不太出来', value: '看不出来' },
  ],

  posture_scapula: [
    { label: '对称', value: '对称' },
    { label: '一边更突出', value: '一侧更突出' },
    { label: '看不太出来', value: '看不出来' },
  ],

  posture_waist: [
    { label: '对称', value: '对称' },
    { label: '一边更深', value: '一侧更深' },
    { label: '看不太出来', value: '看不出来' },
  ],

  adams_method: [
    { label: '用摄像头拍', value: '用摄像头拍' },
    { label: '我在旁边观察', value: '家人在旁边帮我' },
    { label: '先跳过', value: '先跳过' },
  ],

  adams_manual: [
    { label: '对称，没有隆起', value: '对称无隆起' },
    { label: '有一侧隆起', value: '一侧隆起' },
    { label: '不确定', value: '不确定' },
  ],

  adams_ready: [{ label: '准备好了', value: 'ready' }],

  camera_done: [{ label: '看到了，继续', value: 'done' }],

  result_ack: [{ label: '知道了', value: 'ack' }],

  confirmation: [
    { label: '保存结果', value: '保存结果' },
    { label: '不用了', value: '不用了' },
  ],

  done: [
    { label: '重新检查', value: '重新筛查' },
    { label: '关闭', value: '关闭' },
  ],
};
