/**
 * 每日追踪表单
 * 
 * 2分钟完成，包含：疼痛、训练、支具、异常症状、情绪睡眠
 */

import React, { useState } from 'react';
import { Activity, Heart, Shield, AlertTriangle, Smile, Moon, Send } from 'lucide-react';
import { useTrackingStore } from '../store/useTrackingStore';
import { PAIN_LOCATIONS, PAIN_TRIGGERS, EXERCISE_TYPES, ABNORMAL_SYMPTOMS, SKIN_ISSUES } from '../types';

export const DailyTrackingForm: React.FC = () => {
  const submitDaily = useTrackingStore((s) => s.submitDaily);
  const todayRecord = useTrackingStore((s) => s.getTodayRecord());

  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 表单状态
  const [pain, setPain] = useState({
    hasPain: false,
    level: 0,
    location: [] as string[],
    trigger: '',
    description: '',
  });

  const [exercise, setExercise] = useState({
    completed: false,
    exercises: [] as string[],
    duration: 0,
    difficulty: 3,
    notes: '',
  });

  const [brace, setBrace] = useState({
    worn: false,
    hours: 0,
    comfort: 3,
    skinIssue: '无',
    adjustment: '',
  });

  const [abnormalSymptoms, setAbnormalSymptoms] = useState<string[]>([]);
  const [abnormalNotes, setAbnormalNotes] = useState('');
  const [mood, setMood] = useState(3);
  const [sleep, setSleep] = useState(3);

  const steps = [
    { title: '疼痛情况', icon: Heart },
    { title: '康复训练', icon: Activity },
    { title: '支具佩戴', icon: Shield },
    { title: '其他情况', icon: AlertTriangle },
  ];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const today = new Date().toISOString().split('T')[0];
    
    submitDaily({
      date: today,
      pain: {
        id: '',
        date: today,
        hasPain: pain.hasPain,
        level: pain.level,
        location: pain.location,
        trigger: pain.trigger,
        description: pain.description,
      },
      exercise: {
        id: '',
        date: today,
        completed: exercise.completed,
        exercises: exercise.exercises,
        duration: exercise.duration,
        difficulty: exercise.difficulty,
        notes: exercise.notes,
      },
      brace: {
        id: '',
        date: today,
        worn: brace.worn,
        hours: brace.hours,
        comfort: brace.comfort,
        skinIssue: brace.skinIssue,
        adjustment: brace.adjustment,
      },
      abnormalSymptoms,
      abnormalNotes,
      mood,
      sleep,
    });

    setIsSubmitting(false);
  };

  // 如果今天已提交，显示完成状态
  if (todayRecord) {
    return (
      <div className="bg-emerald-50 rounded-2xl p-6 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Activity className="w-8 h-8 text-emerald-600" />
        </div>
        <h3 className="text-lg font-semibold text-emerald-800 mb-2">今日追踪已完成</h3>
        <p className="text-sm text-emerald-600">感谢您的记录，康复师会查看您的数据</p>
        <div className="mt-4 text-xs text-emerald-500">
          提交时间：{new Date(todayRecord.createdAt).toLocaleString('zh-CN')}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* 进度条 */}
      <div className="bg-slate-50 px-6 py-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-800">每日追踪</h2>
          <span className="text-sm text-slate-500">{step + 1} / {steps.length}</span>
        </div>
        <div className="flex gap-2">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                  i === step
                    ? 'bg-emerald-100 text-emerald-700'
                    : i < step
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                <Icon size={14} />
                {s.title}
              </div>
            );
          })}
        </div>
      </div>

      {/* 表单内容 */}
      <div className="p-6">
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                今天有疼痛吗？
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setPain({ ...pain, hasPain: false })}
                  className={`flex-1 py-3 rounded-xl border-2 transition-all ${
                    !pain.hasPain
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  无疼痛
                </button>
                <button
                  onClick={() => setPain({ ...pain, hasPain: true })}
                  className={`flex-1 py-3 rounded-xl border-2 transition-all ${
                    pain.hasPain
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  有疼痛
                </button>
              </div>
            </div>

            {pain.hasPain && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    疼痛程度（{pain.level}/10）
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={pain.level}
                    onChange={(e) => setPain({ ...pain, level: parseInt(e.target.value) })}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>轻微</span>
                    <span>中等</span>
                    <span>剧烈</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    疼痛位置（可多选）
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PAIN_LOCATIONS.map((loc) => (
                      <button
                        key={loc}
                        onClick={() => {
                          const newLocations = pain.location.includes(loc)
                            ? pain.location.filter((l) => l !== loc)
                            : [...pain.location, loc];
                          setPain({ ...pain, location: newLocations });
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                          pain.location.includes(loc)
                            ? 'bg-emerald-100 border-emerald-500 text-emerald-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    疼痛诱因
                  </label>
                  <select
                    value={pain.trigger}
                    onChange={(e) => setPain({ ...pain, trigger: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">请选择</option>
                    {PAIN_TRIGGERS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                今天完成康复训练了吗？
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setExercise({ ...exercise, completed: true })}
                  className={`flex-1 py-3 rounded-xl border-2 transition-all ${
                    exercise.completed
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  已完成
                </button>
                <button
                  onClick={() => setExercise({ ...exercise, completed: false })}
                  className={`flex-1 py-3 rounded-xl border-2 transition-all ${
                    !exercise.completed
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  未完成
                </button>
              </div>
            </div>

            {exercise.completed && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    做了哪些动作？（可多选）
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {EXERCISE_TYPES.map((ex) => (
                      <button
                        key={ex}
                        onClick={() => {
                          const newExercises = exercise.exercises.includes(ex)
                            ? exercise.exercises.filter((e) => e !== ex)
                            : [...exercise.exercises, ex];
                          setExercise({ ...exercise, exercises: newExercises });
                        }}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                          exercise.exercises.includes(ex)
                            ? 'bg-emerald-100 border-emerald-500 text-emerald-700'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    训练时长（分钟）
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="180"
                    value={exercise.duration}
                    onChange={(e) => setExercise({ ...exercise, duration: parseInt(e.target.value) || 0 })}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="例如：30"
                  />
                </div>
              </>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                今天佩戴支具了吗？
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setBrace({ ...brace, worn: true })}
                  className={`flex-1 py-3 rounded-xl border-2 transition-all ${
                    brace.worn
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  已佩戴
                </button>
                <button
                  onClick={() => setBrace({ ...brace, worn: false })}
                  className={`flex-1 py-3 rounded-xl border-2 transition-all ${
                    !brace.worn
                      ? 'border-amber-500 bg-amber-50 text-amber-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  未佩戴
                </button>
              </div>
            </div>

            {brace.worn && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    佩戴时长（小时）
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={brace.hours}
                    onChange={(e) => setBrace({ ...brace, hours: parseInt(e.target.value) || 0 })}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="建议16小时"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    皮肤情况
                  </label>
                  <select
                    value={brace.skinIssue}
                    onChange={(e) => setBrace({ ...brace, skinIssue: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                  >
                    {SKIN_ISSUES.map((issue) => (
                      <option key={issue} value={issue}>{issue}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                有异常症状吗？（可多选）
              </label>
              <div className="flex flex-wrap gap-2">
                {ABNORMAL_SYMPTOMS.map((symptom) => (
                  <button
                    key={symptom}
                    onClick={() => {
                      const newSymptoms = abnormalSymptoms.includes(symptom)
                        ? abnormalSymptoms.filter((s) => s !== symptom)
                        : [...abnormalSymptoms, symptom];
                      setAbnormalSymptoms(newSymptoms);
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                      abnormalSymptoms.includes(symptom)
                        ? 'bg-red-100 border-red-500 text-red-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {symptom}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                今日情绪（{mood}/5）
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => setMood(level)}
                    className={`flex-1 py-3 rounded-xl border-2 transition-all ${
                      mood === level
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Smile size={20} className="mx-auto mb-1" />
                    <span className="text-xs">{level === 1 ? '很差' : level === 5 ? '很好' : level}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                昨晚睡眠（{sleep}/5）
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    onClick={() => setSleep(level)}
                    className={`flex-1 py-3 rounded-xl border-2 transition-all ${
                      sleep === level
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <Moon size={20} className="mx-auto mb-1" />
                    <span className="text-xs">{level === 1 ? '很差' : level === 5 ? '很好' : level}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部按钮 */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          上一步
        </button>
        
        {step < steps.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="px-6 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors"
          >
            下一步
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Send size={14} />
            {isSubmitting ? '提交中...' : '提交'}
          </button>
        )}
      </div>
    </div>
  );
};

export default DailyTrackingForm;
