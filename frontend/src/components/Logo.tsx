interface LogoProps {
  className?: string;
}

export const Logo = ({ className = 'w-10 h-10' }: LogoProps) => {
  return (
    <div className={`flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-[#6D28D9] to-[#14B8A6] rounded-xl shadow-lg ${className}`}>
      <svg width="60%" height="60%" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    </div>
  );
};
