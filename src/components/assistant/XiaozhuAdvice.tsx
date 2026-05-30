/**
 * XiaozhuAdvice — 小柱建议
 *
 * 家长端全新设计：温馨温和的建议卡片，采用统一组件库 Card，消除多重 padding 边距
 */

import React from 'react';
import { Sparkles, ChevronRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export interface XiaozhuAdviceProps {
  childName?: string;
  advice: string;
  tips?: string[];
  loading?: boolean;
  onViewMoreTips?: () => void;
}

export const XiaozhuAdvice: React.FC<XiaozhuAdviceProps> = ({
  childName = '孩子',
  advice,
  tips,
  loading = false,
  onViewMoreTips,
}) => {
  return (
    <Card
      variant="default"
      padding="lg"
      overflow="visible"
      radius="3xl"
      fullWidth
    >
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-3 select-none">
        <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
        <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2">
          小柱建议
        </h3>
      </div>

      {/* 建议内容 / 骨架屏 */}
      {loading ? (
        <div className="space-y-2.5 animate-pulse">
          <div className="h-3.5 bg-[var(--bg-subtle)] rounded-full w-11/12" />
          <div className="h-3.5 bg-[var(--bg-subtle)] rounded-full w-full" />
          <div className="h-3.5 bg-[var(--bg-subtle)] rounded-full w-4/5" />
        </div>
      ) : (
        <p className="text-xs text-[var(--text-secondary)] font-semibold leading-relaxed">
          {advice}
        </p>
      )}

      {/* 小贴士列表 / 骨架屏 */}
      {loading ? (
        <div className="mt-3.5 space-y-2 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-[var(--radius-xl)] bg-[var(--bg-subtle)]">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--border-default)]" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-[var(--border-default)] rounded-full w-10/12" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        tips && tips.length > 0 && (
          <div className="mt-3.5 space-y-2">
            {tips.map((tip, i) => (
              <div
                key={i}
                className="flex items-start gap-2.5 p-2.5 rounded-[var(--radius-xl)] bg-[var(--bg-subtle)]"
              >
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] text-[10px] font-extrabold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-xs text-[var(--text-primary)] font-bold leading-relaxed">
                  {tip}
                </p>
              </div>
            ))}
          </div>
        )
      )}

      {/* 查看更多 */}
      {onViewMoreTips && (
        <div className="mt-4 flex justify-start">
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewMoreTips}
            icon={<ChevronRight className="w-3.5 h-3.5" />}
          >
            了解更多小贴士
          </Button>
        </div>
      )}
    </Card>
  );
};

export default XiaozhuAdvice;
