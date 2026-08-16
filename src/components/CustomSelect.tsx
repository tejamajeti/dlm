import React from 'react';
import { ConfigProvider, Select, theme } from 'antd';

export interface SelectOptionItem {
  value: string;
  label: React.ReactNode;
}

interface CustomSelectProps {
  value: string;
  onChange: (val: string) => void;
  options: SelectOptionItem[];
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder,
  className = '',
  style,
  icon,
  disabled = false,
}) => {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#06b6d4',
          colorBgContainer: '#0f172a',
          colorBorder: '#334155',
          colorText: '#f8fafc',
          colorTextPlaceholder: '#64748b',
          borderRadius: 12,
          fontSize: 12,
          controlHeight: 36,
        },
        components: {
          Select: {
            optionSelectedBg: '#1e293b',
            optionActiveBg: '#334155',
          },
        },
      }}
    >
      <div className={`inline-flex items-center gap-1.5 ${className}`}>
        {icon && <span className="text-slate-400">{icon}</span>}
        <Select
          value={value}
          onChange={onChange}
          options={options}
          placeholder={placeholder}
          disabled={disabled}
          style={{ minWidth: 160, ...style }}
          popupMatchSelectWidth={false}
          className="shadow-sm"
        />
      </div>
    </ConfigProvider>
  );
};
