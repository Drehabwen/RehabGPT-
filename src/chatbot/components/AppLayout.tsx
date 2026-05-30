import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { BottomNavUnified } from '../../components/assistant/BottomNavUnified';

interface AppLayoutProps {
  title: React.ReactNode;
  backPath?: string;
  onBackClick?: () => void;
  headerRight?: React.ReactNode;
  showBottomNav?: boolean;
  children: React.ReactNode;
  contentClassName?: string;
  containerClassName?: string;
  disableScroll?: boolean;
  showHeader?: boolean;
}

/**
 * AppLayout — 统一页面容器
 *
 * 宽幅居中布局，固定悬浮底部导航，统一顶栏返回机制。
 */
export const AppLayout: React.FC<AppLayoutProps> = ({
  title,
  backPath,
  onBackClick,
  headerRight,
  showBottomNav = true,
  children,
  contentClassName = '',
  containerClassName = '',
  disableScroll = false,
  showHeader = true,
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
    <>
      <div className={`min-h-screen w-full bg-[var(--bg-page)] text-[var(--text-primary)] font-sans ${containerClassName}`}>
        <div className="w-full max-w-[1540px] mx-auto px-[34px] pt-[22px] pb-[94px]">
          {/* 统一顶栏 */}
          {showHeader && (
            <div className="flex items-center justify-between mb-4">
              {backPath || onBackClick ? (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-brand)] transition-colors cursor-pointer select-none"
                >
                  <ArrowLeft size={14} className="stroke-[2.5]" />
                  返回
                </button>
              ) : (
                <div />
              )}

              <span className="text-sm font-extrabold text-[var(--text-brand)] select-none">
                {title}
              </span>

              {headerRight ? headerRight : <div />}
            </div>
          )}

          {/* 内容区 */}
          <div
            className={`${
              disableScroll ? '' : ''
            } ${contentClassName}`}
          >
            {children}
          </div>
        </div>
      </div>

      {/* 固定悬浮底部导航 */}
      {showBottomNav && <BottomNavUnified />}
    </>
  );
};

export default AppLayout;
