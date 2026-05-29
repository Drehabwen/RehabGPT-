import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatbotStore } from '../chatbot/store/useChatbotStore';
import { User, ArrowRight, Sparkles, Search, FileText, Check, Loader2, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'screening' | 'manual'>('screening');
  
  // Tab A: Screening Code Login
  const [code, setCode] = useState('');
  const [isLoadingSubject, setIsLoadingSubject] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [foundSubject, setFoundSubject] = useState<any>(null);

  // Tab B: Manual Login
  const [manualName, setManualName] = useState('');
  const [manualAge, setManualAge] = useState('');
  const [manualGender, setManualGender] = useState('');

  const setPatient = useChatbotStore((s) => s.setPatient);
  const navigate = useNavigate();

  // Allowed letters for clinic-conforming patientId
  const ALLOWED_LETTERS = 'ABCDEFGHJKLMNPRTUVWXYZ';

  // Generate a valid 4-letter uppercase code
  const generateClinicId = () => {
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += ALLOWED_LETTERS.charAt(Math.floor(Math.random() * ALLOWED_LETTERS.length));
    }
    return result;
  };

  // Handle Tab A code input change
  const handleCodeChange = (val: string) => {
    // Only allow letters, convert to uppercase, limit to 4 characters
    let formattedVal = val.toUpperCase().replace(/[^A-Z]/g, '');
    
    if (formattedVal.length > 4) {
      formattedVal = formattedVal.slice(0, 4);
    }
    
    setCode(formattedVal);
  };

  // Debounced lookup for screening code (supports only 4 character codes)
  useEffect(() => {
    if (!code) {
      setFoundSubject(null);
      setErrorMsg('');
      return;
    }

    // Only search if code is a valid length (4 characters)
    if (code.length !== 4) {
      setFoundSubject(null);
      setErrorMsg('');
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsLoadingSubject(true);
      setErrorMsg('');
      setFoundSubject(null);
      try {
        const response = await fetch(`/api/integration/subject/${code}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('未找到该筛查号对应的受试者档案，请核对后重试');
          }
          throw new Error('网络异常或服务器未响应，请重试');
        }
        const data = await response.json();
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

  // Handle Login with Sync Code
  const handleSyncLogin = () => {
    if (!foundSubject) return;
    
    const { subject_id, display_name, sex, age, session_id } = foundSubject;
    
    // Set in Zustand store
    setPatient(subject_id, display_name);
    
    // Map gender correctly
    const genderMapped = sex === 'male' ? '男' : sex === 'female' ? '女' : '';
    
    useChatbotStore.setState({
      answers: {
        name: display_name,
        age: age || undefined,
        gender: genderMapped || undefined,
        screening_session_id: session_id || undefined,
        from_screening: true,
      },
    });
    
    navigate('/chat');
  };

  // Handle Manual Start
  const handleManualStart = () => {
    if (!manualName.trim()) return;
    
    // Generate a valid clinic-conforming 4-letter uppercase code
    const generatedId = generateClinicId();
    
    setPatient(generatedId, manualName.trim());
    
    // Store manually typed values in Answers for the chatbot flow
    useChatbotStore.setState({
      answers: {
        name: manualName.trim(),
        age: Number(manualAge) || undefined,
        gender: manualGender || undefined,
        from_screening: false,
      },
    });
    
    navigate('/chat');
  };

  const isManualDisabled = !manualName.trim() || !manualAge || !manualGender;

  return (
    <div className="relative h-[100dvh] w-full flex items-center justify-center bg-gradient-to-tr from-emerald-50/60 via-teal-50/40 to-slate-100/50 p-6 overflow-hidden">
      {/* Decorative blurred background shapes */}
      <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-emerald-200/20 blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-teal-200/20 blur-3xl" />
      
      <div className="w-full max-w-xl relative z-10">
        {/* Logo area */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 via-emerald-600 to-teal-650 text-white mb-4 shadow-lg shadow-emerald-100/50 animate-pulse">
            <Sparkles size={28} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
            小柱健康助手
          </h1>
          <p className="mt-2 text-sm text-slate-500 font-medium">
            守护孩子挺拔身姿，科学关注脊柱发育
          </p>
        </div>

        {/* Form card - Premium Glassmorphic Wide Layout */}
        <div className="rounded-3xl border border-white/80 bg-white/95 shadow-2xl shadow-emerald-950/5 p-8 backdrop-blur-md transition-all duration-300 ease-out">
          
          {/* Tab Selector */}
          <div className="flex p-1.5 bg-slate-100/80 rounded-2xl mb-8 border border-slate-200/40">
            <button
              onClick={() => {
                setActiveTab('screening');
                setErrorMsg('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                activeTab === 'screening'
                  ? 'bg-white text-emerald-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Search size={16} />
              筛查号快捷登录
            </button>
            <button
              onClick={() => {
                setActiveTab('manual');
                setErrorMsg('');
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                activeTab === 'manual'
                  ? 'bg-white text-emerald-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileText size={16} />
              自建评估档案
            </button>
          </div>

          {/* Form Content Panel */}
          <div className="min-h-[220px]">
            {activeTab === 'screening' ? (
              <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
                <div>
                  <label className="block text-xs font-bold text-emerald-900/60 uppercase tracking-wider mb-2">
                    请输入 4 位大写字母筛查号
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => handleCodeChange(e.target.value)}
                      placeholder="例如：CWUN"
                      maxLength={4}
                      className="w-full text-center text-2xl font-bold tracking-[0.5em] pl-4 py-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all font-mono"
                    />
                    {isLoadingSubject && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Loader2 className="animate-spin text-emerald-600" size={20} />
                      </div>
                    )}
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    * 筛查号在 SquatLab 脊柱侧弯筛查端生成（排除容易混淆的 I、O、Q、S、V）
                  </p>
                </div>

                {/* Status Indicator/Details (Slide down animation) */}
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
                              {foundSubject.subject_id}
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
                          已同步早筛
                        </div>
                      </div>

                      <button
                        onClick={handleSyncLogin}
                        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-650 text-white font-semibold text-sm transition-all hover:opacity-95 hover:shadow-md hover:shadow-emerald-500/10 active:scale-[0.98] cursor-pointer"
                      >
                        确认绑定并登录
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  )}

                  {errorMsg && (
                    <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 flex items-start gap-3 animate-[slideDown_0.3s_ease-out]">
                      <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-rose-950">同步失败</h4>
                        <p className="text-xs text-rose-800/80 leading-relaxed font-medium">{errorMsg}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-5 animate-[fadeIn_0.3s_ease-out]">
                <div>
                  <label className="block text-xs font-bold text-emerald-950/70 uppercase tracking-wider mb-2">
                    孩子的姓名
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="请输入孩子的姓名或昵称"
                      className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="flex gap-4 font-medium">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-emerald-950/70 uppercase tracking-wider mb-2">
                      年龄
                    </label>
                    <input
                      type="number"
                      value={manualAge}
                      onChange={(e) => setManualAge(e.target.value)}
                      placeholder="岁"
                      min="3"
                      max="25"
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all font-medium"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-emerald-950/70 uppercase tracking-wider mb-2">
                      性别
                    </label>
                    <select
                      value={manualGender}
                      onChange={(e) => setManualGender(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200/80 bg-slate-50/50 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all font-medium"
                    >
                      <option value="">请选择</option>
                      <option value="男">男</option>
                      <option value="女">女</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleManualStart}
                  disabled={isManualDisabled}
                  className="flex items-center justify-center gap-2 w-full py-3.5 mt-2 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-650 text-white font-semibold text-sm transition-all hover:opacity-95 hover:shadow-lg hover:shadow-emerald-500/15 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  创建档案并开启筛查
                  <ArrowRight size={16} />
                </button>
              </div>
            )}
          </div>

          <p className="mt-8 text-[11px] text-slate-400 text-center leading-relaxed font-medium">
            🩺 柆工具用于青少年脊柱侧弯风险自筛，不构成临床诊断。
            <br />
            结果将安全共享给您的专属康复师团队。
          </p>
        </div>
      </div>

      {/* Embedded slide animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { max-height: 0; opacity: 0; transform: translateY(-10px); }
          to { max-height: 200px; opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
