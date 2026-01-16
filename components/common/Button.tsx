
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'dark' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  icon, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap overflow-hidden text-center";
  
  const variants = {
    primary: "bg-orange-500 text-white shadow-xl shadow-orange-500/20 hover:bg-orange-600",
    secondary: "bg-orange-100 text-orange-600 hover:bg-orange-200",
    ghost: "bg-transparent text-gray-500 hover:bg-gray-100",
    dark: "bg-gray-900 text-white hover:bg-black shadow-xl shadow-gray-200",
    outline: "bg-transparent border-2 border-gray-100 text-gray-900 hover:border-orange-500"
  };

  const sizes = {
    sm: "px-3 py-2 text-[10px] rounded-xl h-10",
    md: "px-5 py-3 text-[11px] rounded-2xl h-12",
    lg: "px-6 py-4 text-xs rounded-3xl h-14",
    xl: "px-8 py-5 text-sm rounded-[2rem] h-16 sm:h-20"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-5 w-5 mr-3 text-current" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        <>
          {icon && <span className="mr-2 shrink-0">{icon}</span>}
          <span className="truncate">{children}</span>
        </>
      )}
    </button>
  );
};

export default Button;
