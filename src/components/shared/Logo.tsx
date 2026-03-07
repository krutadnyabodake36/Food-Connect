import React from 'react';
import { Leaf } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };
  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };
  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`${sizes[size]} bg-forest-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-forest-900/20`}>
        <Leaf size={iconSizes[size]} />
      </div>
      {showText && (
        <span className={`${textSizes[size]} font-serif font-bold text-forest-900 dark:text-forest-300 tracking-wide`}>
          FoodConnect
        </span>
      )}
    </div>
  );
};
