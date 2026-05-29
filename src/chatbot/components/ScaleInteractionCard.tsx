import React, { useState, useCallback } from 'react';
import { 
  ClipboardList, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Loader2, 
  RefreshCw,
  AlertCircle,
  Play,
  Edit2,
  Clock,
  Sparkles,
  ChevronRightCircle
} from 'lucide-react';

export interface ScaleAnswer {
  questionId: number;
  questionText: string;
  category: 'pain' | 'function' | 'self_image' | 'mental_health' | 'satisfaction';
  score: number;      // 1 - 5 分
  answerText: string; // 选项文字
}

export interface ScaleAssessmentData {
  scaleId: 'SRS-22' | 'ODI' | 'VAS';
  scaleName: string;
  filledBy: 'therapist' | 'patient' | 'parent';
  totalScore: number;
  maxScore: number;
  percentageScore: number; // 功能障碍率或百分比
  dimensions: {
    functionActive: number; // 功能活动维度分
    pain: number;           // 疼痛维度分
    selfImage: number;      // 自我形象维度分
    mentalHealth: number;   // 精神健康维度分
    satisfaction?: number;  // 治疗满意度分
  };
  answers: ScaleAnswer[];
  aiInterpretation?: string; // AI 对量表得分的多维医学解读
  createdAt: number;
}

interface ScaleQuestion {
  id: number;
  text: string;
  category: 'pain' | 'function' | 'self_image' | 'mental_health' | 'satisfaction';
  options: { score: number; text: string }[];
}

interface ScaleTemplate {
  id: 'SRS-22' | 'ODI' | 'VAS';
  name: string;
  maxScore: number;
  questions: ScaleQuestion[];
}

const SCALE_TEMPLATES: Record<'SRS-22' | 'ODI' | 'VAS', ScaleTemplate> = {
  'SRS-22': {
    id: 'SRS-22',
    name: 'SRS-22 脊柱侧弯患者问卷',
    maxScore: 25,
    questions: [
      {
        id: 1,
        text: '在过去 6 个月中，您觉得背部的疼痛程度如何？',
        category: 'pain',
        options: [
          { score: 1, text: '极度疼痛 😢' },
          { score: 2, text: '重度疼痛 😟' },
          { score: 3, text: '中度疼痛 😐' },
          { score: 4, text: '轻度疼痛 🙂' },
          { score: 5, text: '完全无痛 😊' }
        ]
      },
      {
        id: 2,
        text: '因为背部原因，您的日常家务、学习等活动受限程度如何？',
        category: 'function',
        options: [
          { score: 1, text: '极度受限 🚫' },
          { score: 2, text: '严重受限 ⚠️' },
          { score: 3, text: '中度受限 🔄' },
          { score: 4, text: '轻微受限 👍' },
          { score: 5, text: '完全不受限 🏃‍♂️' }
        ]
      },
      {
        id: 3,
        text: '您如何评价自己穿衣服时的外观与体态形象？',
        category: 'self_image',
        options: [
          { score: 1, text: '非常不满意 😔' },
          { score: 2, text: '不满意 😕' },
          { score: 3, text: '中立 😐' },
          { score: 4, text: '满意 😊' },
          { score: 5, text: '非常满意 🌟' }
        ]
      },
      {
        id: 4,
        text: '在过去的一个月中，您有多少时间感到焦虑或情绪沮丧？',
        category: 'mental_health',
        options: [
          { score: 1, text: '几乎总是 😭' },
          { score: 2, text: '经常如此 😰' },
          { score: 3, text: '有时如此 😶' },
          { score: 4, text: '很少如此 🙂' },
          { score: 5, text: '从未如此 😆' }
        ]
      },
      {
        id: 5,
        text: '您对目前进行的脊柱侧弯针对性康复训练效果感到满意吗？',
        category: 'satisfaction',
        options: [
          { score: 1, text: '非常不满意 🛑' },
          { score: 2, text: '不满意 📉' },
          { score: 3, text: '中立 ⚖️' },
          { score: 4, text: '满意 📈' },
          { score: 5, text: '非常满意 🏆' }
        ]
      }
    ]
  },
  'ODI': {
    id: 'ODI',
    name: 'ODI 功能障碍指数量表',
    maxScore: 25,
    questions: [
      {
        id: 1,
        text: '背痛对您目前疼痛强度的影响程度：',
        category: 'pain',
        options: [
          { score: 1, text: '疼痛极度剧烈，无法忍受 😢' },
          { score: 2, text: '疼痛很重，不吃药无法工作 😟' },
          { score: 3, text: '疼痛较重，但吃药可缓解 😐' },
          { score: 4, text: '轻微疼痛，无需服药 🙂' },
          { score: 5, text: '完全没有背痛 😊' }
        ]
      },
      {
        id: 2,
        text: '背痛对您日常生活自理（洗漱、穿衣）的影响：',
        category: 'function',
        options: [
          { score: 1, text: '完全无法自理，需要他人全天照料 🚫' },
          { score: 2, text: '非常困难，需要部分帮助 ⚠️' },
          { score: 3, text: '有些困难，动作缓慢但可独立完成 🔄' },
          { score: 4, text: '轻度影响，偶尔需要注意姿势 👍' },
          { score: 5, text: '完全没有任何障碍，非常轻松 🏃‍♂️' }
        ]
      },
      {
        id: 3,
        text: '背痛对您提重物能力的影响：',
        category: 'function',
        options: [
          { score: 1, text: '完全无法提起任何地上的物品 ❌' },
          { score: 2, text: '只能提起较轻物品，十分困难 🎒' },
          { score: 3, text: '可以提起中等重物，但会诱发疼痛 📦' },
          { score: 4, text: '只能轻度限制提拿非常沉重的物品 💪' },
          { score: 5, text: '完全不受限，可提拿任何重物 🏋️‍♂️' }
        ]
      },
      {
        id: 4,
        text: '背痛对您社交生活（外出、游玩）的影响：',
        category: 'self_image',
        options: [
          { score: 1, text: '完全没有任何社交，被迫闭门不出 🏠' },
          { score: 2, text: '社交受到严重限制，无法外出 🚷' },
          { score: 3, text: '社交有些许影响，只能局限于近处 🚶‍♂️' },
          { score: 4, text: '社交基本无影响，但稍微缩短时间 🗺️' },
          { score: 5, text: '完全没有影响，社交生活极其丰富 🎉' }
        ]
      },
      {
        id: 5,
        text: '您对目前腰椎康复方案和自愈信心的情绪状态：',
        category: 'mental_health',
        options: [
          { score: 1, text: '极度焦虑恐慌，感觉无法恢复 😭' },
          { score: 2, text: '比较沮丧，偶尔感到焦虑 😰' },
          { score: 3, text: '情绪中立，顺其自然 😶' },
          { score: 4, text: '比较乐观，对恢复充满希望 ✨' },
          { score: 5, text: '充满绝对信心，积极乐观配合 🏆' }
        ]
      }
    ]
  },
  'VAS': {
    id: 'VAS',
    name: 'VAS 疼痛视觉模拟评分',
    maxScore: 5,
    questions: [
      {
        id: 1,
        text: '请评估您当下身体背部/颈部的主观疼痛级别：',
        category: 'pain',
        options: [
          { score: 1, text: '剧烈疼痛（痛苦不堪，影响睡眠） 😢' },
          { score: 2, text: '重度疼痛（疼痛难忍，影响日常） 😟' },
          { score: 3, text: '中度疼痛（明显疼痛，但可忍受） 😐' },
          { score: 4, text: '轻度疼痛（轻微隐痛，不影响工作） 🙂' },
          { score: 5, text: '完全无痛（身体感觉极其轻松） 😊' }
        ]
      }
    ]
  }
};

interface ScaleInteractionCardProps {
  taskId: string;
  sessionId: string;
  scaleId: 'SRS-22' | 'ODI' | 'VAS';
  onSubmitted?: (data: ScaleAssessmentData) => void;
}

export const ScaleInteractionCard: React.FC<ScaleInteractionCardProps> = ({
  taskId,
  sessionId,
  scaleId,
  onSubmitted
}) => {
  const template = SCALE_TEMPLATES[scaleId] || SCALE_TEMPLATES['SRS-22'];
  
  // States
  const [mode, setMode] = useState<'intro' | 'filling' | 'confirm'>('intro');
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { score: number; text: string }>>({});
  const [status, setStatus] = useState<'filling' | 'submitting' | 'success' | 'error'>('filling');
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedData, setSubmittedData] = useState<ScaleAssessmentData | null>(null);

  const questionsCount = template.questions.length;
  const currentQuestion = template.questions[currentStep];
  const progressPercent = Math.round(((currentStep + 1) / questionsCount) * 100);

  // Friendly meta descriptions for the chatbot patient/parent journey
  const scaleFriendlyMeta = {
    'SRS-22': {
      duration: '1 分钟',
      accentColor: 'from-emerald-500/10 to-teal-500/10 border-emerald-100',
      badgeBg: 'bg-emerald-50 border-emerald-100 text-emerald-700',
      themeGradient: 'from-emerald-500 to-teal-600 shadow-emerald-500/20',
      iconColor: 'text-emerald-600',
      dimensions: ['背部疼痛', '日常活动', '穿衣体态', '心理情绪', '康复满意度'],
      welcomeTitle: '青少年侧弯专属健康评估',
      details: '该量表由国际脊柱侧弯研究学会制定。小柱将协助您记录孩子的疼痛感受、心理状态以及日常受限情况，实时同步给王康复师，这对于微调下一阶段 of 康复运动处方非常关键哦！'
    },
    'ODI': {
      duration: '1 分钟',
      accentColor: 'from-amber-500/10 to-orange-500/10 border-orange-100',
      badgeBg: 'bg-orange-50 border-orange-100 text-orange-700',
      themeGradient: 'from-orange-500 to-amber-600 shadow-orange-500/20',
      iconColor: 'text-orange-600',
      dimensions: ['腰痛程度', '生活自理', '负重活动', '外出社交', '心理信心'],
      welcomeTitle: '腰背功能自测与障碍度评估',
      details: '腰背痛功能障碍指数（Oswestry）能帮康复师了解腰背部疼痛对您日常生活起居的阻碍，数据回传后工作台将立刻为您计算腰椎功能障碍率并匹配最新姿态策略。'
    },
    'VAS': {
      duration: '30 秒',
      accentColor: 'from-rose-500/10 to-red-500/10 border-red-100',
      badgeBg: 'bg-red-50 border-red-100 text-red-700',
      themeGradient: 'from-rose-500 to-red-650 shadow-rose-500/20',
      iconColor: 'text-rose-600',
      dimensions: ['即时主观疼痛'],
      welcomeTitle: '主观疼痛视觉度快速标定',
      details: '采用经典的疼痛评估标尺，让您极速对背部、颈部的疼痛感受进行量化，方便临床康复师远程即时知晓您的酸痛波动。'
    }
  }[template.id] || {
    duration: '1 分钟',
    accentColor: 'from-blue-500/10 to-emerald-500/10 border-blue-100',
    badgeBg: 'bg-blue-50 border-blue-100 text-blue-700',
    themeGradient: 'from-blue-500 to-emerald-600 shadow-blue-500/20',
    iconColor: 'text-blue-600',
    dimensions: ['健康维度评估'],
    welcomeTitle: '康复量表在线评估',
    details: '主观康复问卷评定。'
  };

  const handleSelectOption = useCallback((score: number, text: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: { score, text }
    }));
    
    // Auto advance after slight delay for tactile responsiveness
    if (currentStep < questionsCount - 1) {
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 200);
    } else {
      // Advance to confirm review mode when the last question is selected
      setTimeout(() => {
        setMode('confirm');
      }, 300);
    }
  }, [currentStep, currentQuestion.id, questionsCount]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else {
      setMode('intro');
    }
  }, [currentStep]);

  const handleNext = useCallback(() => {
    if (currentStep < questionsCount - 1 && answers[currentQuestion.id]) {
      setCurrentStep(prev => prev + 1);
    } else if (currentStep === questionsCount - 1 && answers[currentQuestion.id]) {
      setMode('confirm');
    }
  }, [currentStep, questionsCount, answers, currentQuestion.id]);

  const handleEditQuestion = useCallback((qIndex: number) => {
    setCurrentStep(qIndex);
    setMode('filling');
  }, []);

  const handleReset = useCallback(() => {
    setAnswers({});
    setCurrentStep(0);
    setMode('intro');
    setStatus('filling');
    setErrorMsg('');
  }, []);

  const handleSubmit = useCallback(async () => {
    // Check all questions are answered
    const unanswered = template.questions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      setErrorMsg(`还有 ${unanswered.length} 道题未填写，请点击返回补填`);
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setErrorMsg('');

    try {
      const answersList: ScaleAnswer[] = template.questions.map(q => ({
        questionId: q.id,
        questionText: q.text,
        category: q.category,
        score: answers[q.id].score,
        answerText: answers[q.id].text
      }));

      // Calculate totals
      const totalScore = answersList.reduce((sum, item) => sum + item.score, 0);
      const maxScore = template.maxScore;
      const percentageScore = Math.round((totalScore / maxScore) * 10000) / 100;

      // Extract average dimensions
      const getCategoryAvg = (cat: string) => {
        const catAnswers = answersList.filter(a => a.category === cat);
        if (catAnswers.length === 0) return 5.0; // Default excellent/normal score
        return Math.round((catAnswers.reduce((s, a) => s + a.score, 0) / catAnswers.length) * 10) / 10;
      };

      const dimensions = {
        functionActive: getCategoryAvg('function'),
        pain: getCategoryAvg('pain'),
        selfImage: getCategoryAvg('self_image'),
        mentalHealth: getCategoryAvg('mental_health'),
        satisfaction: getCategoryAvg('satisfaction')
      };

      const aiInterpretation = `患者居家远程自主评定。患者评定总得分 ${totalScore}/${maxScore} (${percentageScore}%)。各子维度情况如下：功能活动平均 ${dimensions.functionActive}分，主观疼痛耐受 ${dimensions.pain}分，体态形象评定 ${dimensions.selfImage}分，精神情绪状态 ${dimensions.mentalHealth}分。该问卷由小柱助手自动回传工作台，已成功入档患者病历库。`;

      const scaleData: ScaleAssessmentData = {
        scaleId: template.id,
        scaleName: template.name,
        filledBy: 'parent',
        totalScore,
        maxScore,
        percentageScore,
        dimensions,
        answers: answersList,
        aiInterpretation,
        createdAt: Date.now()
      };

      const apiBase = import.meta.env.VITE_API_BASE || '';
      const response = await fetch(`${apiBase}/api/integration/scale/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          task_id: taskId,
          session_id: sessionId,
          scale_data: scaleData
        })
      });

      if (!response.ok) {
        throw new Error(`回传失败: ${response.statusText}`);
      }

      setSubmittedData(scaleData);
      setStatus('success');
      if (onSubmitted) {
        onSubmitted(scaleData);
      }
    } catch (err) {
      console.error('[ScaleInteractionCard] Submit failed:', err);
      setErrorMsg(err instanceof Error ? err.message : '同步回传失败，请检查网络！');
      setStatus('error');
    }
  }, [answers, template, taskId, sessionId, onSubmitted]);

  // Render Completed / Success State
  if (status === 'success' && submittedData) {
    return (
      <div className="rounded-3xl border border-emerald-100 bg-gradient-to-b from-emerald-50/50 to-teal-50/30 p-6 text-center shadow-lg shadow-emerald-100/20 backdrop-blur-lg">
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3 border border-emerald-200">
          <CheckCircle2 size={30} className="text-emerald-500 animate-pulse" />
        </div>
        <h3 className="text-sm font-black text-emerald-800">评估问卷已顺利回传！</h3>
        <p className="text-[11px] text-emerald-600 mt-1 leading-relaxed">
          王康复师的工作台已同步接收到您的最新数据，并同步更新了五维疗效对比雷达图！
        </p>

        <div className="mt-4 rounded-2xl bg-white/90 border border-emerald-100/50 p-4 space-y-3 shadow-sm">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-bold">{submittedData.scaleName}</span>
            <span className="font-extrabold text-emerald-600 tabular-nums bg-emerald-50 border border-emerald-200/50 px-2.5 py-0.5 rounded-full">
              {submittedData.totalScore} / {submittedData.maxScore} 分
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100/80 text-center">
            <div className="bg-slate-50/50 p-1.5 rounded-xl border border-slate-100">
              <div className="text-[9px] text-slate-400 font-bold">疼痛</div>
              <span className="text-xs font-black text-slate-700">{submittedData.dimensions.pain}</span>
            </div>
            <div className="bg-slate-50/50 p-1.5 rounded-xl border border-slate-100">
              <div className="text-[9px] text-slate-400 font-bold">功能</div>
              <span className="text-xs font-black text-slate-700">{submittedData.dimensions.functionActive}</span>
            </div>
            <div className="bg-slate-50/50 p-1.5 rounded-xl border border-slate-100">
              <div className="text-[9px] text-slate-400 font-bold">体态</div>
              <span className="text-xs font-black text-slate-700">{submittedData.dimensions.selfImage}</span>
            </div>
            <div className="bg-slate-50/50 p-1.5 rounded-xl border border-slate-100">
              <div className="text-[9px] text-slate-400 font-bold">心理</div>
              <span className="text-xs font-black text-slate-700">{submittedData.dimensions.mentalHealth}</span>
            </div>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 mt-4 flex items-center justify-center gap-1 bg-white/40 py-1.5 rounded-lg border border-slate-150/40">
          <Sparkles size={10} className="text-amber-500 animate-spin" />
          系统已录入诊疗 SOAP 的 S 主观评定集。
        </p>
      </div>
    );
  }

  // Render Submitting / Processing State
  if (status === 'submitting') {
    return (
      <div className="rounded-3xl border border-emerald-100 bg-white/90 p-8 text-center shadow-lg backdrop-blur-lg flex flex-col items-center justify-center min-h-[220px]">
        <Loader2 size={36} className="text-emerald-500 animate-spin mb-4" />
        <h4 className="text-xs font-bold text-slate-800">正在与康复师工作台同步数据</h4>
        <p className="text-[10px] text-slate-400 mt-1.5">请稍候，量表五维极值与分析回传中...</p>
      </div>
    );
  }

  // Render Error State
  if (status === 'error') {
    return (
      <div className="rounded-3xl border border-rose-100 bg-rose-50/40 p-6 text-center shadow-lg backdrop-blur-lg">
        <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-2.5">
          <AlertCircle size={26} className="text-rose-500" />
        </div>
        <h4 className="text-xs font-black text-rose-800">同步同步失败</h4>
        <p className="text-[10px] text-rose-600 mt-1 leading-relaxed">{errorMsg}</p>
        <button
          onClick={() => setStatus('filling')}
          className="mt-4 inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-xs font-bold text-slate-600 border border-slate-200 bg-white hover:bg-slate-50 transition-all active:scale-[0.98] shadow-sm"
        >
          <RefreshCw size={12} className="animate-spin" />
          重试同步回传
        </button>
      </div>
    );
  }

  // 1. Render Intro Guide Screen (Friendly AI 小柱 welcoming page)
  if (mode === 'intro') {
    return (
      <div className="rounded-3xl border border-slate-200/80 bg-white/95 shadow-xl shadow-slate-100/40 backdrop-blur-lg overflow-hidden flex flex-col p-5 space-y-4">
        {/* Soft Welcoming Title block */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-200">
              <ClipboardList size={15} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block leading-none">康复阶段自测</span>
              <span className="text-xs font-black text-slate-800 mt-0.5 block">{scaleFriendlyMeta.welcomeTitle}</span>
            </div>
          </div>
          <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100/50 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Clock size={9} />
            仅需 {scaleFriendlyMeta.duration}
          </span>
        </div>

        {/* Reassuring Avatar Conversation Bubble */}
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500/[0.03] to-teal-500/[0.01] p-4 space-y-2.5 border border-emerald-500/[0.05] relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-[0.03] text-emerald-500 select-none pointer-events-none translate-x-4 translate-y-4">
            <Sparkles size={120} />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping" />
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-[10px] font-black relative border border-white">
                柱
              </div>
            </div>
            <span className="text-[11px] font-black text-emerald-950">小柱助手：</span>
          </div>
          
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            您好！我是您的康复助手“小柱”。为了帮助主治康复师王老师更好地评估最近的训练成效，我们需要收集您的主观日常反馈，这有助于定制下一周的运动方案。
          </p>
        </div>

        {/* Quantified Details Card */}
        <div className={`rounded-2xl border p-4 space-y-3 bg-gradient-to-br ${scaleFriendlyMeta.accentColor}`}>
          <div className="flex justify-between items-start">
            <h4 className="text-xs font-black text-slate-900">{template.name}</h4>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed font-medium">{scaleFriendlyMeta.details}</p>

          <div className="pt-2.5 border-t border-slate-200/50 space-y-1.5">
            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none">本次评定涵盖的核心维度：</div>
            <div className="flex flex-wrap gap-1">
              {scaleFriendlyMeta.dimensions.map((dim, i) => (
                <span key={i} className="text-[9px] text-slate-600 bg-white border border-slate-200/80 px-2 py-0.5 rounded-lg font-bold shadow-sm">
                  {dim}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Beautiful Friendly CTA Button */}
        <button
          type="button"
          onClick={() => setMode('filling')}
          className={`w-full py-3 rounded-2xl text-xs font-black text-white bg-gradient-to-r ${scaleFriendlyMeta.themeGradient} shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-1.5`}
        >
          <Play size={11} fill="white" />
          我知道了，立即进入评估 ({questionsCount}题)
        </button>
      </div>
    );
  }

  // 2. Render Review & Confirm Screen (mode === 'confirm')
  if (mode === 'confirm') {
    return (
      <div className="rounded-3xl border border-slate-200/80 bg-white/95 shadow-xl shadow-slate-100/40 backdrop-blur-lg overflow-hidden flex flex-col p-5 space-y-4">
        {/* Confirm Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-200">
              <CheckCircle2 size={15} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block leading-none">答卷检查</span>
              <span className="text-xs font-black text-slate-800 mt-0.5 block">请核对您的答卷数据</span>
            </div>
          </div>
          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100/50 px-2.5 py-0.5 rounded-full">
            已完成 {questionsCount}/{questionsCount} 题
          </span>
        </div>

        {/* Friendly instruction */}
        <div className="bg-emerald-50/50 border border-emerald-100/30 rounded-xl p-3 flex items-start gap-2">
          <span className="text-xs mt-0.5">💡</span>
          <p className="text-[10px] text-slate-500 leading-normal font-medium">
            如果发现有选项填错，您可以<span className="text-emerald-600 font-bold mx-0.5 underline">直接点击</span>下方对应的题目卡片，系统将自动回弹到该题，修改完成后将自动返回此页。
          </p>
        </div>

        {/* Scrollable list of answers */}
        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
          {template.questions.map((q, idx) => {
            const answer = answers[q.id];
            return (
              <div
                key={q.id}
                onClick={() => handleEditQuestion(idx)}
                className="w-full text-left p-3 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-emerald-50/30 hover:border-emerald-200/50 transition-all duration-150 cursor-pointer flex flex-col space-y-1.5 group active:scale-[0.99] relative overflow-hidden"
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[10px] font-black text-slate-700 leading-normal line-clamp-2 flex-1">
                    Q{idx + 1}. {q.text}
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 group-hover:text-emerald-600 shrink-0 transition-colors flex items-center gap-0.5">
                    <Edit2 size={8} />
                    修改
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-100/60 px-2.5 py-0.5 rounded-lg text-[10px]">
                    {answer?.text || '未作答'}
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-md">得分: {answer?.score || 0}分</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions bar */}
        <div className="space-y-2 pt-2.5 border-t border-slate-100">
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full py-3 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-md shadow-emerald-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          >
            <ChevronRightCircle size={13} fill="white" className="text-emerald-500" />
            确认无误，同步回传工作台
          </button>
          
          <button
            type="button"
            onClick={handleReset}
            className="w-full py-2.5 rounded-2xl text-[10px] font-bold text-slate-400 hover:text-slate-650 bg-white hover:bg-slate-50 border border-slate-200 transition-colors"
          >
            重新填写评估问卷
          </button>
        </div>
      </div>
    );
  }

  // 3. Render Main Questionnaire Filling State (mode === 'filling')
  const answeredCurrent = answers[currentQuestion.id] !== undefined;

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/95 shadow-xl shadow-slate-100/40 backdrop-blur-lg overflow-hidden flex flex-col p-5 space-y-4">
      {/* Card Header & Title */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-xl bg-gradient-to-tr ${scaleFriendlyMeta.themeGradient} flex items-center justify-center text-white shadow-md`}>
            <ClipboardList size={14} />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold block leading-none">正在答题</span>
            <span className="text-xs font-black text-slate-800 mt-0.5 block">{template.name}</span>
          </div>
        </div>
        <span className="text-[10px] font-black text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-0.5 rounded-full">
          {currentStep + 1} / {questionsCount} 题
        </span>
      </div>

      {/* Progress ring or line */}
      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
        <div 
          className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Slide Question text */}
      <div className="space-y-3 min-h-[90px] flex flex-col justify-center py-2.5 bg-slate-50/40 rounded-2xl border border-slate-100 p-3.5">
        <div className="flex gap-2 items-start">
          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg leading-none shrink-0 border border-emerald-100/50">
            Q{currentStep + 1}
          </span>
          <p className="text-xs font-black text-slate-750 leading-normal">
            {currentQuestion.text}
          </p>
        </div>
      </div>

      {/* Choice Large Buttons */}
      <div className="space-y-2">
        {currentQuestion.options.map(opt => {
          const selected = answers[currentQuestion.id]?.score === opt.score;
          return (
            <button
              key={opt.score}
              type="button"
              onClick={() => handleSelectOption(opt.score, opt.text)}
              className={`w-full text-left px-4 py-3.5 rounded-2xl text-xs font-semibold flex justify-between items-center transition-all duration-200 border ${
                selected 
                  ? 'border-emerald-400 bg-emerald-500/10 text-emerald-800 shadow-sm font-bold'
                  : 'border-slate-100 bg-slate-50/70 text-slate-650 hover:bg-slate-100 hover:border-slate-200 active:scale-[0.99]'
              }`}
            >
              <span>{opt.text}</span>
              {selected && (
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-white shadow-sm shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Navigation Bar */}
      <div className="flex justify-between items-center pt-2.5 border-t border-slate-100">
        <button
          onClick={handlePrev}
          className="p-2.5 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-650 hover:bg-slate-50 hover:border-slate-350 transition-colors active:scale-[0.97]"
          title="上一题"
        >
          <ChevronLeft size={16} />
        </button>

        {currentStep === questionsCount - 1 ? (
          <button
            onClick={handleNext}
            disabled={!answeredCurrent}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-xs font-black text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/10 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            查看答卷并确认
            <ChevronRight size={13} />
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={!answeredCurrent}
            className="flex items-center gap-1.5 px-4.5 py-2.5 rounded-2xl text-xs font-bold text-slate-500 border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300 transition-colors active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed"
          >
            下一题
            <ChevronRight size={13} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ScaleInteractionCard;
