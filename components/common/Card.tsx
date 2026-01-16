
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick, hoverable }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 
        ${hoverable ? 'hover:shadow-xl hover:border-orange-500/20 transition-all cursor-pointer' : ''} 
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;
