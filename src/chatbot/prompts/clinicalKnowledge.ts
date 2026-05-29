/**
 * 小柱 AI 助手 - 儿科脊柱侧弯临床筛查专业知识库 (Pediatric Spinal Scoliosis Clinical Knowledgebase)
 *
 * 核心目标：
 * 1. 注入严谨的脊柱康复医学常识，使 LLM 的分析具备极高专业性与参考价值。
 * 2. 详细阐述各项指标的生理学临床意义，提供结构化的临床决策支持。
 * 3. 强调侧弯与疼痛的特殊关系（青少年特发性侧弯通常无痛，背痛是严重警示信号）。
 * 4. 【新增】融入临床评估量表（SRS-22、VAS、ODI）的指标库与家长通俗翻译。
 */

export const PEDIATRIC_SPINAL_CLINICAL_KNOWLEDGE = {
  // ── 1. 核心体态评估指标 (Posture Landmarks) ──
  postureAssessment: {
    shoulders: {
      name: '双肩对称性（高低肩）',
      clinicalMeaning: '锁骨与斜方肌水平高度不一。常提示胸椎段侧弯或习惯性单肩负重、歪头写字。',
      parentCheckMethod: '让孩子光脚站直，双手自然下垂。家长蹲下在孩子正前方或正后方，平视观察左右肩膀的最高点是否在同一水平线上。',
    },
    scapula: {
      name: '肩胛骨对称性（蝴蝶骨不对称）',
      clinicalMeaning: '一侧肩胛骨内下角向后隆起或位置升高。常提示胸椎段侧弯伴随肋骨旋转，胸椎凸侧椎旁肌肉隆起。',
      parentCheckMethod: '从孩子背后观察，左右两块“蝴蝶骨”是不是一样高，或者是不是有一侧像小翅膀一样明显往后拱起来。',
    },
    waistCrease: {
      name: '双侧腰线对称性',
      clinicalMeaning: '骨盆水平倾斜或腰椎段侧弯导致躯干两侧侧凸弧度不一，一侧腰褶深，另一侧平直。',
      parentCheckMethod: '从正后方看孩子双手叉腰，两只手大拇指所在的高度是否平齐，腰部两侧凹进去的弧度是不是对称的。',
    }
  },

  // ── 2. Adams 前屈弯腰测试 (Adams Forward Bend Test) ──
  adamsTest: {
    name: "Adams 前屈测试 (脊柱旋转自检的“金标准”)",
    methodSteps: [
      '第一步（站立准备）：孩子脱去上衣，光脚双脚并拢，膝关节伸直。',
      '第二步（弯腰前屈）：双手合十，手尖指向脚尖，像跳水动作一样缓缓向下弯腰 90 度，手臂自然下垂。',
      '第三步（水平扫描）：家长蹲在孩子臀部后方，视线与孩子弯曲的背部水平面齐平，观察后背两侧是否有高度不一致。'
    ],
    findings: {
      symmetrical: '两侧背部高度基本平齐，未发现明显起伏。',
      mildAsymmetry: '一侧稍微有些隆起，高度差约在几毫米，可能存在早期轻微旋转，需结合旋转角（ATR）测量。',
      significantHump: '一侧背部出现明显的、像鼓包一样的隆起，临床上称为“剃刀背”（Rib Hump），提示脊柱发生了明显的旋转与侧弯。'
    }
  },

  // ── 3. 脊柱旋转角 (ATR) 与 Cobb 角分级与转介准则 (ATR & Cobb Angle Benchmarks) ──
  benchmarks: {
    atr: {
      name: '脊柱旋转角 (Angle of Trunk Rotation, ATR)',
      description: '使用脊柱侧弯测量仪（Scoliometer）在弯腰测试时测得的躯干倾斜角度。',
      classification: {
        normal: { range: '0° - 4°', status: '正常体态', plan: '日常姿势保持，每半年到一年常规筛查一次。' },
        suspect: { range: '5° - 9°', status: '轻微旋转/体态异常', plan: '建议去医院做 X 光确诊 Cobb 角，同时进行居家姿势强化与针对性肌肉锻炼。每 3 个月密切复查。' },
        highRisk: { range: '>= 10°', status: '明显侧弯高风险', plan: '⚠️ 必须立即挂骨科或脊柱专科就诊！大概率需要制作专业的支具进行矫形，配合专业康复师训练。' }
      }
    },
    cobbAngle: {
      name: 'Cobb 角',
      description: '脊柱侧弯 X 光诊断的终极金标准，代表侧弯弯度最大的两个椎体之间的夹角。',
      classification: {
        mild: { range: '< 20°', status: '轻度侧弯', plan: '无需支具，主要进行运动疗法（如特定侧弯运动 PSSE、小柱居家锻炼）及严密观察，每 4-6 个月复查 X 光。' },
        moderate: { range: '20° - 40°', status: '中度侧弯', plan: '如果在生长发育高峰期（骨骼未闭合），必须立即配合每日 18-23 小时佩戴医用矫形支具，并结合脊柱特异性康复训练。' },
        severe: { range: '> 40°', status: '重度侧弯', plan: '有持续进展并压迫心肺功能的风险，需要骨科专家深度评估，考虑手术矫正。' }
      }
    }
  },

  // ── 4. 康复师下发评估量表知识库 (Therapist-Issued Clinical Scales) ──
  clinicalScales: {
    'SRS-22': {
      name: 'SRS-22 脊柱侧弯生活质量评估问卷',
      clinicalPurpose: '侧弯对青少年（尤其是青春期女孩子）的心理自尊、穿衣社交、日常活动和局部疼痛会产生隐性的负面心理压力。该量表专门量化这些非物理性阻碍，帮助治疗师微调心理辅导和康复方案。',
      laymanTitle: '宝贝心情与生活晴雨表 🌈',
      laymanExplain: '这个小问卷是为了看看脊柱的小弯度有没有悄悄影响到宝贝平时穿衣服的自信，上课写字累不累，或者心里有没有小自卑。咱们像呵护花朵一样，守护宝贝的心灵阳光。'
    },
    'VAS': {
      name: 'VAS 视觉模拟疼痛量表',
      clinicalPurpose: '让患者在 0（无痛）到 10（极度剧痛）的水平标尺上圈出主观疼痛值。是评估背痛严重度、判定是否触发“继发性侧弯”危险警报的重要定量指标。',
      laymanTitle: '痛痛小刻度尺 📏',
      laymanExplain: '用一把从 0 到 10 厘米的虚拟小直尺，让宝贝指一指背上的酸痛或不适感到底达到了哪个刻度，帮医生和治疗师最直观地感受到宝贝最近的辛苦。'
    },
    'ODI': {
      name: 'ODI 欧氏腰痛功能障碍指数',
      clinicalPurpose: '测量腰痛对患者日常生活（如弯腰写字、提书包、行走、睡眠、旅行）的受限百分比，反映腰部肌肉深层核心功能是否受损。',
      laymanTitle: '腰部小力气测评卡 🔋',
      laymanExplain: '看看宝贝的小腰在日常弯腰写字、提书包、或者睡觉翻身时，力气充不充足，有没有因为酸痛被悄悄拉了后腿。'
    }
  },

  // ── 5. 青春期生长突增与家庭遗传的风险乘数 (Risk Multipliers) ──
  riskMultipliers: {
    growthSpurt: {
      name: '青春期生长突增（Peak Height Velocity, PHV）',
      criticalAges: '女孩 10-14 岁，男孩 12-16 岁。',
      clinicalWarning: '脊柱侧弯是一种“生长性疾病”，骨骼生长越快，侧弯进展越迅猛。在快速抽高的一年里，轻微的侧弯（如 Cobb角 15°）可能在几个月内迅速恶化至 30° 以上。因此，最近一年“身高长得飞快”是高风险的警示器！'
    },
    familyHistory: {
      name: '家族遗传史',
      clinicalWarning: '青少年特发性脊柱侧弯（AIS）具有显著的家族聚集倾向。如果父母或兄弟姐妹中有侧弯史，孩子发生侧弯的概率会飙升 3 至 5 倍。'
    }
  },

  // ── 6. ⚠️ 疼痛红线警示（AIS 无痛原则）──
  painRedLines: {
    ruleOfThumb: '青少年特发性脊柱侧弯（AIS）通常是【完全没有疼痛感】的！',
    clinicalWarning: '如果孩子背部不仅弯曲，还伴有【明显疼痛】、【夜间痛醒】、【活动受限】或【下肢麻木】，这绝对是一个极其危险的“红线信号”！这往往提示侧弯可能是由于脊髓空洞症、脊髓拴系、骨样骨瘤等继发性病变引起的。',
    actionRequired: '🚨 必须立即进行全面的 MRI（磁共振）检查与骨科诊治，切忌盲目进行牵引、推拿或推迟就医！'
  },

  // ── 7. 专业术语转家长通俗语言映射表 (Clinical to Layman Translation) ──
  translationTable: [
    { clinicalTerm: '青少年特发性脊柱侧弯 (AIS)', laymanExplain: '孩子在长高个子的关键时期，脊柱没有像小松树一样笔直往上长，而是悄悄带了点弯弯的倾斜弧度，而且原因通常很神秘，跟书包重不重、坐姿好不好并不完全挂钩。' },
    { clinicalTerm: 'Adams 前屈测试阳性', laymanExplain: '在弯腰测试中，宝贝的背部一侧高度明显高过了另一侧，后背隆起了一个小山丘，像是一边肩膀有小翅膀鼓出来了。' },
    { clinicalTerm: '剃刀背 (Rib Hump)', laymanExplain: '这是因为脊柱侧弯时，每一节脊椎骨像转动的积木一样发生了旋转，把连在上面的肋骨也顶起来了，从后面看就像一个小鼓包。' },
    { clinicalTerm: '骨盆倾斜 / 长短腿', laymanExplain: '骨骼的“地基”（骨盆）有些歪斜了，导致两条腿受力不均，或者从后面看腰褶一边深一边浅。' },
    { clinicalTerm: '特异性脊柱侧弯康复训练 (PSSE)', laymanExplain: '这可不是普通的拉伸或者瑜伽，而是康复医生和治疗师为孩子量身定制的“反向对抗呼吸与肌肉平衡训练”，像是在用精准的力道把歪了的小树苗往相反的方向拉。' }
  ]
} as const;
