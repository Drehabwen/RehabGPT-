/**
 * PostureUploadCard — 姿态上传卡片
 *
 * 核心主操作，不要放在右上角小角落。
 */

import React, { useCallback } from 'react';
import { Camera, Upload, Sun, User, Maximize, Shirt } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export interface PostureUploadCardProps {
  onUpload: (file: File) => void;
  onClick?: () => void;
}

const REQUIREMENTS = [
  { icon: User, text: '背面站立' },
  { icon: Sun, text: '光线充足' },
  { icon: Maximize, text: '全身入镜' },
  { icon: Shirt, text: '穿贴身上衣' },
];

export const PostureUploadCard: React.FC<PostureUploadCardProps> = ({ onUpload, onClick }) => {
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) onUpload(file);
    },
    [onUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onUpload(file);
    },
    [onUpload]
  );

  return (
    <Card variant="default" padding="lg" className="bg-gradient-to-br from-[var(--ink-green-50)] to-[var(--teal-50)]">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--ink-green-500)] to-[var(--teal-500)] flex items-center justify-center shadow-lg shadow-[var(--ink-green-200)]">
          <Camera className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-[var(--text-base)] font-[var(--font-bold)] text-[var(--text-primary)]">上传孩子站立背面照</h3>
          <p className="text-[var(--text-sm)] text-[var(--text-tertiary)] mt-1">
            小柱将辅助识别肩部高度、躯干偏移与体态对称性，仅作健康管理参考
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {REQUIREMENTS.map((req, i) => {
              const Icon = req.icon;
              return (
                <span key={i} className="inline-flex items-center gap-1 text-[var(--text-xs)] text-[var(--text-muted)] bg-white/80 px-2 py-1 rounded-lg border border-[var(--border-light)]">
                  <Icon className="w-3 h-3" />
                  {req.text}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* 上传区 */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="mt-4 border-2 border-dashed border-[var(--ink-green-200)] rounded-xl p-6 text-center hover:border-[var(--ink-green-400)] hover:bg-[var(--ink-green-50)] transition-colors cursor-pointer"
        onClick={onClick}
      >
        <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" id="posture-upload" />
        <label htmlFor="posture-upload" className="cursor-pointer block">
          <Upload className="w-8 h-8 text-[var(--ink-green-400)] mx-auto mb-2" />
          <p className="text-[var(--text-sm)] font-[var(--font-medium)] text-[var(--ink-green-700)]">点击或拖拽照片至此处</p>
          <p className="text-[var(--text-xs)] text-[var(--text-muted)] mt-1">支持 JPG、PNG 格式</p>
        </label>
      </div>

      <Button variant="primary" size="lg" fullWidth icon={<Camera className="w-5 h-5" />} className="mt-4" onClick={onClick}>
        上传照片开始初筛
      </Button>
    </Card>
  );
};

export default PostureUploadCard;
