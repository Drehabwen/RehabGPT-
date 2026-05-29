import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface AppLayoutProps {
  title: React.ReactNode;
  backPath?: string;
  onBackClick?: () => void;
  headerRight?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  contentClassName?: string;
  containerClassName?: string;
  disableScroll?: boolean;
}

/**
 * AppLayout - 统一页面容器与布局抽象组件
 *
 * 核心目的：
 * 1. 强制使用 `h-[100dvh]` 锁定全屏视口，规避移动端虚拟键盘及地址栏高度抖动。
 * 2. 统一顶栏磨砂玻璃质感、返回机制和标题居中策略。
 * 3. 规范子页面滚动容器划分（配合 `flex-1 min-h-0` 锁定高度分配）。
 */
export const AppLayout: React.FC<AppLayoutProps> = ({
  title,
  backPath,
  onBackClick,
  headerRight,
  footer,
  children,
  contentClassName = '',
  containerClassName = '',
  disableScroll = false,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBackClick) {
      onBackClick();
    } else if (backPath) {
      navigate(backPath);
    }
  };

  return (
    <div
      className={`h-[100dvh] w-full overflow-hidden flex flex-col bg-gradient-to-tr from-emerald-50/50 via-teal-50/40 to-slate-100/30 ${containerClassName}`}
    >
      {/* 统一顶栏 - Premium Glassmorphic */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white/80 border-b border-slate-100/80 backdrop-blur-md shadow-sm select-none z-10">
        {backPath || onBackClick ? (
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer select-none"
          >
            <ArrowLeft size={16} />
            返回
          </button>
        ) : (
          <div className="w-[48px]" />
        )}

        <span className="text-sm font-extrabold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent select-none">
          {title}
        </span>

        {headerRight ? (
          headerRight
        ) : (
          <div className="w-[48px]" />
        )}
      </div>

      {/* 核心内容区 */}
      <div
        className={`flex-1 min-h-0 flex flex-col ${
          disableScroll ? '' : 'overflow-y-auto custom-scrollbar p-4'
        } ${contentClassName}`}
      >
        {children}
      </div>

      {/* 底部导航或控制区 */}
      {footer && <div className="flex-shrink-0 z-10">{footer}</div>}
    </div>
  );
};

export default AppLayout;
