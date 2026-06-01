/**
 * 量表系统端到端集成测试
 *
 * 模拟完整流程：
 * 1. 康复师端下发 SRS-22 量表
 * 2. 家长端拉取待填量表
 * 3. 家长端填写并提交量表
 * 4. 康复师端查看结果
 * 5. 验证数据一致性
 */

const BASE_URL =
  (globalThis as any).process?.env?.REHAB_API_BASE ||
  (globalThis as any).process?.env?.VITE_API_BASE ||
  'http://localhost:8000';

// ── 测试配置 ──

const TEST_PATIENT_ID = 'TEST_PATIENT_001';
const TEST_PATIENT_NAME = '王测试';
const TEST_SESSION_ID = `session_${Date.now()}`;

// ── 辅助函数 ──

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

function logStep(step: number, title: string) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[STEP ${step}] ${title}`);
  console.log('='.repeat(60));
}

function logSuccess(message: string) {
  console.log(`  ✅ ${message}`);
}

function logError(message: string) {
  console.log(`  ❌ ${message}`);
}

function logInfo(label: string, value: unknown) {
  console.log(`  📋 ${label}: ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}`);
}

// ── 测试步骤 ──

export async function runScaleIntegrationTest(): Promise<boolean> {
  console.log('\n🧪 量表系统集成测试开始\n');
  console.log(`后端地址: ${BASE_URL}`);
  console.log(`测试患者: ${TEST_PATIENT_NAME} (${TEST_PATIENT_ID})`);
  console.log(`测试会话: ${TEST_SESSION_ID}`);

  let taskId: string;

  try {
    // ── STEP 1: 康复师下发 SRS-22 量表 ──
    logStep(1, '康复师端下发 SRS-22 量表');

    const pushPayload = {
      patient_id: TEST_PATIENT_ID,
      patient_name: TEST_PATIENT_NAME,
      session_id: TEST_SESSION_ID,
      scale_id: 'SRS-22',
      therapist_name: '王康复师',
    };

    logInfo('推送数据', pushPayload);

    const pushResult = await request<{ status: string; task_id: string; scale_id: string }>(
      '/api/integration/scale/push',
      { method: 'POST', body: JSON.stringify(pushPayload) }
    );

    taskId = pushResult.task_id;
    logSuccess(`量表推送成功`);
    logInfo('任务ID', taskId);
    logInfo('量表ID', pushResult.scale_id);

    // ── STEP 2: 家长端拉取待填量表 ──
    logStep(2, '家长端拉取待填量表');

    const pendingScales = await request<Array<{
      task_id: string;
      patient_id: string;
      scale_id: string;
      status: string;
      created_at: string;
    }>>(`/api/integration/scale/pending/${TEST_PATIENT_ID}`);

    logInfo('待填量表数量', pendingScales.length);

    if (pendingScales.length === 0) {
      logError('待填量表列表为空！');
      return false;
    }

    const pendingScale = pendingScales[0];
    logSuccess(`找到 ${pendingScales.length} 个待填量表`);
    logInfo('任务ID', pendingScale.task_id);
    logInfo('量表ID', pendingScale.scale_id);
    logInfo('状态', pendingScale.status);

    if (pendingScale.task_id !== taskId) {
      logError(`任务ID不匹配: 期望 ${taskId}, 实际 ${pendingScale.task_id}`);
      return false;
    }

    // ── STEP 3: 家长端填写并提交量表 ──
    logStep(3, '家长端填写并提交 SRS-22 量表');

    // 模拟家长填写答案（全部选3分"一般"）
    const mockAnswers = [
      { questionId: 'f1', questionText: '您在进行日常活动时是否感到受限？', category: 'functionActive', score: 3, answerText: '一般' },
      { questionId: 'f2', questionText: '您在弯腰或提重物时是否感到困难？', category: 'functionActive', score: 3, answerText: '一般' },
      { questionId: 'f3', questionText: '您在长时间站立或坐着时是否感到不适？', category: 'functionActive', score: 3, answerText: '一般' },
      { questionId: 'f4', questionText: '您的身体状况是否影响了工作或学习？', category: 'functionActive', score: 3, answerText: '一般' },
      { questionId: 'p1', questionText: '过去一周是否经历过背部疼痛？', category: 'pain', score: 3, answerText: '有时' },
      { questionId: 'p2', questionText: '您的疼痛程度如何？', category: 'pain', score: 3, answerText: '轻度疼痛' },
      { questionId: 's1', questionText: '您对自己身体外观的满意度如何？', category: 'selfImage', score: 3, answerText: '一般' },
      { questionId: 's2', questionText: '您是否因脊柱侧弯感到自卑或回避社交？', category: 'selfImage', score: 3, answerText: '有时' },
      { questionId: 'm1', questionText: '您是否感到焦虑或担心病情？', category: 'mentalHealth', score: 3, answerText: '一般' },
      { questionId: 'm2', questionText: '您对未来康复是否充满信心？', category: 'mentalHealth', score: 3, answerText: '一般' },
      { questionId: 'sat1', questionText: '您对目前康复治疗效果是否满意？', category: 'satisfaction', score: 3, answerText: '一般' },
      { questionId: 'sat2', questionText: '您是否愿意推荐当前治疗方案？', category: 'satisfaction', score: 3, answerText: '一般' },
    ];

    // 计算得分: 12题 * 3分 = 36分, 满分60分, 百分比60%
    const scaleData = {
      scaleId: 'SRS-22',
      scaleName: 'SRS-22 脊柱侧弯生活质量问卷',
      filledBy: 'parent',
      totalScore: 36,
      maxScore: 60,
      percentageScore: 60.0,
      dimensions: {
        functionActive: 3.0,
        pain: 3.0,
        selfImage: 3.0,
        mentalHealth: 3.0,
        satisfaction: 3.0,
      },
      answers: mockAnswers,
      aiInterpretation: '测试数据：各维度评分均为中等水平，建议继续观察。',
      createdAt: Date.now(),
    };

    const submitPayload = {
      task_id: taskId,
      session_id: TEST_SESSION_ID,
      scale_data: scaleData,
    };

    logInfo('提交数据', { task_id: taskId, session_id: TEST_SESSION_ID, answers_count: mockAnswers.length });

    const submitResult = await request<{ status: string; task_id: string }>(
      '/api/integration/scale/submit',
      { method: 'POST', body: JSON.stringify(submitPayload) }
    );

    logSuccess(`量表提交成功`);
    logInfo('任务ID', submitResult.task_id);

    // ── STEP 4: 验证待填列表已清空 ──
    logStep(4, '验证待填列表已清空');

    const pendingAfterSubmit = await request<Array<unknown>>(
      `/api/integration/scale/pending/${TEST_PATIENT_ID}`
    );

    logInfo('提交后待填数量', pendingAfterSubmit.length);

    if (pendingAfterSubmit.length !== 0) {
      logError(`待填列表未清空，仍有 ${pendingAfterSubmit.length} 个量表`);
      return false;
    }

    logSuccess('待填列表已清空');

    // ── STEP 5: 康复师端查看结果 ──
    logStep(5, '康复师端查看量表结果');

    const results = await request<Array<{
      task_id: string;
      status: string;
      scale_data: typeof scaleData;
      submitted_at: string;
    }>>(`/api/integration/scale/results/${TEST_SESSION_ID}`);

    logInfo('结果数量', results.length);

    if (results.length === 0) {
      logError('未找到量表结果！');
      return false;
    }

    const result = results[0];
    logSuccess(`找到量表结果`);
    logInfo('任务ID', result.task_id);
    logInfo('状态', result.status);
    logInfo('总分', result.scale_data?.totalScore);
    logInfo('百分比', `${result.scale_data?.percentageScore}%`);
    logInfo('维度评分', result.scale_data?.dimensions);
    logInfo('提交时间', result.submitted_at);

    if (result.status !== 'completed') {
      logError(`状态不正确: 期望 completed, 实际 ${result.status}`);
      return false;
    }

    if (result.scale_data?.totalScore !== 36) {
      logError(`总分不匹配: 期望 36, 实际 ${result.scale_data?.totalScore}`);
      return false;
    }

    // ── 测试通过 ──
    console.log('\n' + '='.repeat(60));
    console.log('🎉 量表系统集成测试全部通过！');
    console.log('='.repeat(60));
    console.log('\n流程验证:');
    console.log('  ✅ 康复师下发量表');
    console.log('  ✅ 家长端获取待填量表');
    console.log('  ✅ 家长端填写并提交');
    console.log('  ✅ 待填列表自动清空');
    console.log('  ✅ 康复师端查看结果');
    console.log('  ✅ 数据一致性校验通过');

    return true;

  } catch (err) {
    console.log('\n' + '='.repeat(60));
    console.log('❌ 测试失败');
    console.log('='.repeat(60));
    console.error(err);
    return false;
  }
}

// ── 如果直接运行此文件 ──

if (typeof window === 'undefined') {
  // Node.js 环境
  const p = (globalThis as any).process;
  if (p && typeof p.exit === 'function') {
    runScaleIntegrationTest().then((passed) => {
      p.exit(passed ? 0 : 1);
    });
  }
}
