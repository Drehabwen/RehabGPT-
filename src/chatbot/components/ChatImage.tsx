import React from 'react';

interface ChatImageProps {
  src: string;
  alt?: string;
  caption?: string;
}

/**
 * 内联插图组件
 * 用于在 bot 消息中嵌入说明图片（如 Adam's 测试示意图）
 */
export const ChatImage: React.FC<ChatImageProps> = ({
  src,
  alt = 'illustration',
  caption,
}) => {
  return (
    <div className="mb-4 ml-12">
      <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm max-w-[280px]">
        <img
          src={src}
          alt={alt}
          className="w-full object-contain"
          loading="lazy"
        />
        {caption && (
          <p className="px-3 py-2 text-xs text-slate-500 text-center bg-slate-50">
            {caption}
          </p>
        )}
      </div>
    </div>
  );
};

export default ChatImage;
