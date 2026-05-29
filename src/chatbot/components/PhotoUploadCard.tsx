/**
 * 上传姿态照片核心行动卡
 *
 * 把"拖拽至此上传"从右上角角落变成核心行动入口。
 */

import React, { useCallback } from 'react';
import { Camera, Upload, Sun, User, Maximize, Shirt } from 'lucide-react';
import { Card, Button } from '../ui';

interface PhotoUploadCardProps {
  onUpload: (file: File) => void;
  onClick?: () => void;
}

const REQUIREMENTS = [
  { icon: User, text: '背面站立' },
  { icon: Sun, text: '光线充足' },
  { icon: Maximize, text: '全身入镜' },
  { icon: Shirt, text: '穿贴身上衣' },
];

export const PhotoUploadCard: React.FC<PhotoUploadCardProps> = ({ onUpload, onClick }) => {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        onUpload(file);
      }
    },
    [onUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onUpload(file);
      }
    },
    [onUpload]
  );

  return (
    <Card padding="lg" shadow="md" className="bg-gradient-to-br from-emerald-50/50 to-teal-50/30">
      <div className="flex items-start gap-4">
        {/* 左侧图标区 */}
        <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200/50">
          <Camera className="w-7 h-7 text-white" />
        </div>

        {/* 右侧内容区 */}
        <div className="flex-1">
          <h3 className="text-base font-bold text-slate-800">上传孩子站立背面照</h3>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            小柱将辅助识别肩部高度、躯干偏移与体态对称性，仅作健康管理参考
          </p>

          {/* 拍摄要求 */}
          <div className="flex flex-wrap gap-2 mt-3">
            {REQUIREMENTS.map((req, i) => {
              const Icon = req.icon;
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-white/80 px-2 py-1 rounded-lg border border-slate-100"
                >
                  <Icon className="w-3 h-3" />
                  {req.text}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* 上传区域 */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="mt-4 border-2 border-dashed border-emerald-200 rounded-xl p-6 text-center hover:border-emerald-400 hover:bg-emerald-50/30 transition-colors cursor-pointer"
        onClick={onClick}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="photo-upload"
        />
        <label htmlFor="photo-upload" className="cursor-pointer block">
          <Upload className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-emerald-700">点击或拖拽照片至此处</p>
          <p className="text-xs text-slate-400 mt-1">支持 JPG、PNG 格式</p>
        </label>
      </div>

      {/* 主按钮 */}
      <Button
        variant="primary"
        size="lg"
        fullWidth
        icon={<Camera className="w-5 h-5" />}
        className="mt-4"
        onClick={onClick}
      >
        上传照片开始初筛
      </Button>
    </Card>
  );
};

export default PhotoUploadCard;
