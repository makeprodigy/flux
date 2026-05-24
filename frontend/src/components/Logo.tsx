interface LogoProps {
  className?: string;
  dark?: boolean;
}

export const Logo = ({ className = "w-10 h-10", dark = false }: LogoProps) => {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/vedaai-logo.svg"
      alt="VedaAI Logo"
      className={`object-contain flex-shrink-0 ${className}`}
      style={dark ? { filter: 'grayscale(1) brightness(0)' } : undefined}
    />
  );
};
