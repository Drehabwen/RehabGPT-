import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbotStore } from '../chatbot/store/useChatbotStore';
import { useAgentStore } from '../chatbot/store/useAgentStore';
import { ArrowRight, Search, Check, Loader2, AlertCircle } from 'lucide-react';
import { login } from '../services/familyService';
import { useChildContextStore } from '../context';

export const LoginPage: React.FC = () => {
  // On mount, proactively clear and reset any previous session states to prevent login UI-lock bugs
  useEffect(() => {
    useChatbotStore.setState({
      patientId: '',
      patientName: '',
      answers: {},
      riskResult: null,
    });
    useAgentStore.getState().resetAgent();
    useChildContextStore.getState().reset();
  }, []);

  const [code, setCode] = useState('');
  const [isLoadingSubject, setIsLoadingSubject] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [foundSubject, setFoundSubject] = useState<any>(null);

  const setPatient = useChatbotStore((s) => s.setPatient);
  const navigate = useNavigate();

  // Handle code input change
  const handleCodeChange = (val: string) => {
    // Only allow letters and digits, convert to uppercase, limit to 6 characters
    let formattedVal = val.toUpperCase().replace(/[^A-Z0-9]/g, '');

    if (formattedVal.length > 6) {
      formattedVal = formattedVal.slice(0, 6);
    }

    setCode(formattedVal);
  };

  // Debounced lookup for family code
  useEffect(() => {
    if (!code) {
      setFoundSubject(null);
      setErrorMsg('');
      return;
    }

    if (code.length < 4) {
      setFoundSubject(null);
      setErrorMsg('');
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoadingSubject(true);
      setErrorMsg('');
      setFoundSubject(null);
      try {
        const data = await login(code);
        setFoundSubject(data);
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : '查询失败');
        setFoundSubject(null);
      } finally {
        setIsLoadingSubject(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [code]);

  // Handle Login with family code
  const handleLogin = () => {
    if (!foundSubject) return;

    const { patient_id, display_name, sex, age, session_id } = foundSubject;

    // Phase 5: 初始化 ChildContext 身份，使上下文注入引擎能正确注入患者信息到 LLM
    useChildContextStore.getState().initialize(patient_id, display_name, age, sex, session_id);

    setPatient(patient_id, display_name, {
      age: age ?? null,
      sex: sex ?? null,
      sessionId: session_id ?? null,
      answers: {
        name: display_name,
        from_screening: true,
      },
    });

    navigate('/chat');
  };

  return (
    <div className="relative h-[100dvh] w-full flex items-center justify-center bg-[var(--bg-page)] p-6 overflow-hidden">

      <div className="w-full max-w-xl relative z-10">
        {/* Logo area */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-brand)]">
            小柱健康助手
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)] font-medium">
            守护孩子挺拔身姿，科学关注脊柱发育
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-3xl border border-white/80 bg-white/95 shadow-2xl shadow-emerald-950/5 p-8 backdrop-blur-md transition-all duration-300 ease-out">

          {/* Title */}
          <div className="text-center mb-6">
            <p className="text-sm font-bold text-emerald-900/80">
              输入康复师提供的家庭码
            </p>
            <p className="mt-1 text-xs text-slate-500">
              绑定后即可查看评估报告和训练计划
            </p>
          </div>

          {/* Input */}
          <div className="space-y-5">
            <div>
              <label htmlFor="family-code" className="block text-xs font-bold text-emerald-900/60 uppercase tracking-wider mb-2">
                家庭码
              </label>
              <div className="relative">
                <input
                  id="family-code"
                  type="text"
                  value={code}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  placeholder="康复师提供的家庭码"
                  maxLength={6}
                  className="w-full text-center text-xl font-bold tracking-[0.3em] pl-4 py-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all font-mono"
                />
                {isLoadingSubject && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Loader2 className="animate-spin text-emerald-600" size={20} />
                  </div>
                )}
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">
                请输入康复师提供的家庭码以绑定孩子的健康档案
              </p>
            </div>

            {/* Status Indicator */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
              foundSubject || errorMsg ? 'max-h-[200px] opacity-100 mt-4' : 'max-h-0 opacity-0'
            }`}>
              {foundSubject && (
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 shadow-inner flex flex-col gap-3 animate-[slideDown_0.3s_ease-out]">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-800">{foundSubject.display_name}</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/50">
                          {foundSubject.patient_id}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-1.5 text-xs font-medium text-slate-500">
                        <span>性别：{foundSubject.sex === 'male' ? '男' : foundSubject.sex === 'female' ? '女' : '未知'}</span>
                        <span>•</span>
                        <span>年龄：{foundSubject.age ? `${foundSubject.age} 岁` : '未知'}</span>
                        {foundSubject.height_cm && (
                          <>
                            <span>•</span>
                            <span>身高：{foundSubject.height_cm} cm</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-emerald-100 shadow-sm text-xs font-semibold text-emerald-700">
                      <Check size={14} className="text-emerald-600" />
                      已绑定
                    </div>
                  </div>

                  <button
                    onClick={handleLogin}
                    className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold text-sm transition-all hover:opacity-95 hover:shadow-md hover:shadow-emerald-500/10 active:scale-[0.98] cursor-pointer"
                  >
                    确认绑定并登录
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}

              {errorMsg && (
                <div role="alert" aria-live="polite" className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 flex items-start gap-3 animate-[slideDown_0.3s_ease-out]">
                  <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-rose-950">绑定失败</h4>
                    <p className="text-xs text-rose-800/80 leading-relaxed font-medium">{errorMsg}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <p className="mt-8 text-[11px] text-slate-400 text-center leading-relaxed font-medium">
            🩺 本工具用于康复师指导下的居家康复管理，不构成独立临床诊断。
            <br />
            数据将安全共享给您的专属康复师团队。
          </p>
        </div>
      </div>

    </div>
  );
};
