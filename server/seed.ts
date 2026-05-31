/**
 * server/seed.ts — 开发环境种子数据
 *
 * 预置测试患者、家庭码、评估摘要、训练处方和量表任务，
 * 方便前端开发和联调。仅在数据库为空时插入。
 */

import { nanoid } from 'nanoid';
import {
  familyLinksDB,
  assessmentsDB,
  plansDB,
  trackingDB,
  scaleTasksDB,
} from './db';
import type {
  FamilyLink,
  AssessmentSummary,
  TreatmentPlan,
  DailyTrackingRecord,
  ScaleTask,
} from './types';

// ── 测试患者数据 ──

const TEST_PATIENT = {
  patient_id: 'P00001',
  display_name: '小明',
  sex: 'male' as const,
  age: 9,
  height_cm: 135,
  weight_kg: 30,
};

const FAMILY_CODE = 'ABC123';

// ── 种子: 家庭码绑定 ──

const seedFamilyLinks: FamilyLink[] = [
  {
    family_code: FAMILY_CODE,
    patient_id: TEST_PATIENT.patient_id,
    display_name: TEST_PATIENT.display_name,
    sex: TEST_PATIENT.sex,
    age: TEST_PATIENT.age,
    height_cm: TEST_PATIENT.height_cm,
    weight_kg: TEST_PATIENT.weight_kg,
    created_at: new Date('2026-05-15').toISOString(),
  },
  // 第二个测试患者
  {
    family_code: 'XYZ789',
    patient_id: 'P00002',
    display_name: '小红',
    sex: 'female',
    age: 12,
    height_cm: 152,
    weight_kg: 40,
    created_at: new Date('2026-05-20').toISOString(),
  },
];

// ── 种子: 评估摘要 ──

const seedAssessments: AssessmentSummary[] = [
  {
    summary_id: nanoid(12),
    patient_id: TEST_PATIENT.patient_id,
    patient_name: TEST_PATIENT.display_name,
    session_id: `session_${TEST_PATIENT.patient_id}_eval_001`,
    risk_level: 'medium',
    risk_label: '中度脊柱侧弯风险',
    summary_text:
      '经专业评估，孩子目前存在轻中度胸段脊柱侧弯（Cobb角约18°），伴轻度体态倾斜。建议立即开始支具干预和特定运动康复训练，每3个月复查脊柱全长X光片。当前正值生长发育高峰期，需密切关注侧弯进展速度。',
    concerns: [
      '胸段右侧凸 Cobb角约18°',
      '双肩不等高（右肩低于左肩约1.5cm）',
      'Adam前屈试验可见右侧肋骨隆起',
      '正值生长发育高峰期（9岁，Risser 0级）',
    ],
    recommendations: [
      '每日佩戴脊柱侧弯矫形支具 ≥ 16小时',
      '每日完成特定脊柱侧弯体操训练（Schroth方法），每次30-45分钟',
      '每3个月复查脊柱全长X光片，评估Cobb角变化',
      '注意坐姿和站姿，避免长时间低头看电子产品',
      '如出现疼痛、麻木或外观明显变化，及时复诊',
    ],
    created_at: new Date('2026-05-26').toISOString(),
  },
  // 小红的评估
  {
    summary_id: nanoid(12),
    patient_id: 'P00002',
    patient_name: '小红',
    session_id: 'session_P00002_eval_001',
    risk_level: 'low',
    risk_label: '轻度姿态异常',
    summary_text:
      '筛查显示轻微姿态不对称，未发现明显脊柱侧弯。建议保持良好姿势习惯，定期随访观察。',
    concerns: ['轻度双肩不等高', '日常姿势不良'],
    recommendations: ['每日做姿态矫正操10分钟', '3个月后随访复查'],
    created_at: new Date('2026-05-22').toISOString(),
  },
];

// ── 种子: 训练处方 ──

const seedPlans: TreatmentPlan[] = [
  {
    plan_id: nanoid(12),
    patient_id: TEST_PATIENT.patient_id,
    patient_name: TEST_PATIENT.display_name,
    therapist_name: '李康复师',
    plan_content: `# 小明个人化脊柱侧弯康复训练方案

## 训练原则
- Schroth 三维脊柱侧弯矫正体操
- 重点矫正胸段右侧凸
- 配合旋转呼吸训练
- 每天坚持，循序渐进

## 热身（5分钟）
- 猫牛式：缓慢进行，配合呼吸，10次
- 骨盆前后倾：激活核心肌群，10次
- 肩胛骨回缩：改善驼背姿势，10次

## 核心训练（15分钟）
- 侧平板支撑（右侧）：增强右侧核心力量，3组×30秒
- 死虫式：核心稳定训练，3组×10次
- Schroth旋转呼吸：在矫正位进行深呼吸，5分钟
- 坐姿脊柱伸展：用泡沫轴辅助，2分钟

## 拉伸放松（10分钟）
- 右侧胸椎凹侧拉伸：针对性拉伸缩短肌肉，3组×30秒
- 胸肌拉伸：改善前侧紧张，2组×30秒
- 腘绳肌拉伸：改善骨盆位置，2组×30秒
- 儿童式放松：结束放松，2分钟

## 注意事项
1. 训练时穿着舒适运动服
2. 训练前确保支具已取下
3. 如出现疼痛立即停止，联系康复师
4. 每天记录训练完成情况`,
    status: 'pending',
    created_at: new Date('2026-05-27').toISOString(),
    updated_at: null,
  },
];

// ── 种子: 量表任务 ──

const now = new Date();
const scaleTasks: ScaleTask[] = [
  {
    task_id: nanoid(12),
    patient_id: TEST_PATIENT.patient_id,
    patient_name: TEST_PATIENT.display_name,
    session_id: `session_${TEST_PATIENT.patient_id}_scale_001`,
    scale_id: 'SRS-22',
    status: 'pending',
    scale_data: null,
    created_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    submitted_at: null,
  },
];

// ── 种子: 每日打卡（最近7天模拟数据） ──

function generateMockTracking(): DailyTrackingRecord[] {
  const records: DailyTrackingRecord[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // 模拟有些不完美
    const completed = i !== 1; // 昨天没做训练
    const painLevel = completed ? Math.floor(Math.random() * 3) + 1 : 4; // 没训练疼痛略高
    const braceHours = completed ? 16 + Math.floor(Math.random() * 3) : 10;

    records.push({
      id: nanoid(12),
      patient_id: TEST_PATIENT.patient_id,
      patient_name: TEST_PATIENT.display_name,
      tracking_date: dateStr,
      exercises_completed: completed
        ? [{ name: '康复训练', duration: 35, completed: true }]
        : [],
      total_duration_min: completed ? 35 : 0,
      symptoms: {
        pain_level: painLevel,
        pain_location: painLevel > 0 ? '背部右侧' : '',
        abnormal_symptoms: i === 0 ? ['训练后轻微酸痛'] : [],
        mood: completed ? 4 : 3,
      },
      notes: completed
        ? '今天训练完成得不错，孩子配合度提高'
        : '今天因为学校活动没有完成训练',
      submitted_at: new Date(date).toISOString(),
    });
  }
  return records;
}

// ── 导出: 统一种子 ──

export function seedAll(): void {
  console.log('[Seed] Checking if seed data needed...');

  familyLinksDB.seed(seedFamilyLinks);
  assessmentsDB.seed(seedAssessments);
  plansDB.seed(seedPlans);
  trackingDB.seed(generateMockTracking());
  scaleTasksDB.seed(scaleTasks);

  console.log('[Seed] Done.');
}
