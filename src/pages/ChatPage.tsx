/**
 * ChatPage — 儿童脊柱健康智能助手工作台
 *
 * 从「普通 IM 聊天窗口」升级为「儿童脊柱健康智能陪伴与初筛助手」。
 *
 * 页面结构：
 * 1. 顶部孩子健康上下文条 (ChildHealthHeader)
 * 2. 主内容区：
 *    - 空状态时：欢迎卡 + 上传照片 + 快捷问题
 *    - 有消息时：聊天窗口 + 快捷问题
 * 3. 底部健康管理导航 (HealthNavBar)
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChildHealthHeader } from '../chatbot/components/ChildHealthHeader';
import { WelcomeCard } from '../chatbot/components/WelcomeCard';
import { PhotoUploadCard } from '../chatbot/components/PhotoUploadCard';
import { QuickQuestions } from '../chatbot/components/QuickQuestions';
import { HealthNavBar } from '../chatbot/components/HealthNavBar';
import { StartScreeningCard } from '../chatbot/components/HealthSuggestionCard';
import { ChatWindow } from '../chatbot/components/ChatWindow';
import { useChatbotStore } from '../chatbot/store/useChatbotStore';
import { useAgentStore } from '../chatbot/store/useAgentStore';

export const ChatPage: React.FC = () => {
  const navigate = useNavigate();

  // 患者信息
  const patientId = useChatbotStore((s) => s.patientId);
  const patientName = useChatbotStore((s) => s.patientName);
  const answers = useChatbotStore((s) => s.answers);
  const patientAge = (answers.age as number) || null;

  // Agent 状态
  const messages = useAgentStore((s) => s.messages);
  const sendFreeTextStream = useAgentStore((s) => s.sendFreeTextStream);
  const advanceStep = useAgentStore((s) => s.advanceStep);
  const llmAvailable = useAgentStore((s) => s.llmAvailable);
  const openCamera = useAgentStore((s) => s.openCamera);

  // 当前导航标签
  const [activeTab, setActiveTab] = useState('chat');

  // 是否有聊天消息
  const hasMessages = messages.length > 0;

  // 处理欢迎卡和能力入口的点击
  const handleAction = useCallback(
    (action: string) => {
      switch (action) {
        case 'upload_photo':
          openCamera();
          break;
        case 'screening':
          // 触发筛查流程
          if (llmAvailable) {
            sendFreeTextStream('我想给孩子做体态筛查');
          } else {
            advanceStep('开始筛查');
          }
          break;
        case 'prescription':
          navigate('/prescriptions');
          break;
        case 'tracking':
          navigate('/tracking');
          break;
        case 'report':
          if (llmAvailable) {
            sendFreeTextStream('帮我解释评估报告');
          } else {
            advanceStep('解释报告');
          }
          break;
        default:
          break;
      }
    },
    [navigate, openCamera, sendFreeTextStream, advanceStep, llmAvailable]
  );

  // 处理快捷问题点击
  const handleQuickQuestion = useCallback(
    (question: string) => {
      if (llmAvailable) {
        sendFreeTextStream(question);
      } else {
        advanceStep(question);
      }
    },
    [sendFreeTextStream, advanceStep, llmAvailable]
  );

  // 处理照片上传
  const handlePhotoUpload = useCallback(
    (file: File) => {
      console.log('[ChatPage] Photo uploaded:', file.name);
      // TODO: 调用姿态分析 API
      openCamera();
    },
    [openCamera]
  );

  // 处理导航切换
  const handleTabChange = useCallback(
    (tab: string) => {
      setActiveTab(tab);
      switch (tab) {
        case 'prescriptions':
          navigate('/prescriptions');
          break;
        case 'tracking':
          navigate('/tracking');
          break;
        case 'scales':
          navigate('/scales');
          break;
        case 'chat':
        default:
          // 保持在当前页面
          break;
      }
    },
    [navigate]
  );

  // 处理姿态初筛按钮点击
  const handleScreeningClick = useCallback(() => {
    openCamera();
  }, [openCamera]);

  return (
    <div className="h-[100dvh] w-full overflow-hidden flex flex-col bg-gradient-to-tr from-emerald-50/50 via-teal-50/40 to-slate-100/30">
      {/* 1. 顶部孩子健康上下文条 */}
      <ChildHealthHeader
        patientName={patientName || '孩子'}
        patientAge={patientAge}
        patientGender={answers.gender as string}
        patientId={patientId}
        currentStatus="pending_screening"
        lastAssessmentDate="尚未完成初筛"
        concerns={['体态不良', '双肩不等高', '久坐习惯']}
        nextStep="上传站立背面照完成姿态初筛"
      />

      {/* 2. 主内容区 */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">
          {/* 空状态：显示欢迎卡 + 上传照片 + 快捷问题 */}
          {!hasMessages && (
            <>
              {/* 小柱欢迎卡 */}
              <WelcomeCard patientName={patientName || undefined} onAction={handleAction} />

              {/* 上传姿态照片核心行动卡 */}
              <PhotoUploadCard onUpload={handlePhotoUpload} onClick={handleScreeningClick} />

              {/* 结构化建议卡 */}
              <StartScreeningCard onAction={handleAction} />
            </>
          )}

          {/* 聊天消息区 */}
          {hasMessages && (
            <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/50 shadow-lg shadow-slate-100/50 overflow-hidden">
              <ChatWindow />
            </div>
          )}

          {/* 快捷问题区（始终显示在底部） */}
          <QuickQuestions onQuestionClick={handleQuickQuestion} />
        </div>
      </div>

      {/* 3. 底部健康管理导航 */}
      <HealthNavBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onScreeningClick={handleScreeningClick}
      />
    </div>
  );
};

export default ChatPage;
