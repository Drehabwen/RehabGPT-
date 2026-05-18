import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbotStore } from '@/chatbot/store/useChatbotStore';
import { User, ArrowRight, Heart } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const setPatient = useChatbotStore((s) => s.setPatient);
  const navigate = useNavigate();

  const handleStart = () => {
    if (!name.trim()) return;
    const id = `parent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setPatient(id, name.trim());
    // Store age/gender in answers for later use
    useChatbotStore.setState({
      answers: {
        name: name.trim(),
        age: Number(age) || undefined,
        gender: gender || undefined,
      },
    });
    navigate('/chat');
  };

  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white mb-4 shadow-lg shadow-blue-200">
            <Heart size={30} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">小柱</h1>
          <p className="mt-2 text-sm text-slate-500">
            我是小柱，帮您守护孩子的脊柱健康
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-white/70 bg-white/95 shadow-lg shadow-slate-200/50 p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                孩子的名字
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入孩子名字"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  年龄
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="岁"
                  min="3"
                  max="25"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                  性别
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                >
                  <option value="">请选择</option>
                  <option value="男">男</option>
                  <option value="女">女</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleStart}
              disabled={!name.trim()}
              className="flex items-center justify-center gap-2 w-full py-3 mt-2 rounded-xl bg-blue-600 text-white font-semibold text-sm transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              开始筛查
              <ArrowRight size={16} />
            </button>
          </div>

          <p className="mt-4 text-[11px] text-slate-400 text-center leading-relaxed">
            本工具用于脊柱侧弯风险初筛，不构成医疗诊断。
            <br />
            如有疑虑，请咨询专业康复医师。
          </p>
        </div>
      </div>
    </div>
  );
};
