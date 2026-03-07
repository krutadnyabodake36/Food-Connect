import React from 'react';
import { Leaf } from 'lucide-react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ 
  className = "", 
  showText = true,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`
        relative flex items-center justify-center 
        ${sizeClasses[size]} 
        rounded-xl 
        bg-gradient-to-br from-forest-500 to-forest-700 
        shadow-lg shadow-forest-500/20 
        text-white
        transition-transform hover:scale-105 duration-200
      `}>
        <Leaf size={iconSizes[size]} strokeWidth={2.5} />
        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20" />
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className={`font-bold tracking-tight text-stone-900 dark:text-stone-100 leading-none ${size === 'lg' ? 'text-2xl' : 'text-xl'}`}>
            Food<span className="text-forest-600 dark:text-forest-400">Connect</span>
          </span>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-400 dark:text-stone-500 leading-none mt-1">
            Partner Portal
          </span>
        </div>
      )}
    </div>
  );
};
