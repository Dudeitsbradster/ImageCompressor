import { Adsense } from '@ctrl/react-adsense';

interface AdBannerProps {
  slot?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function AdBanner({ 
  slot = "1234567890", 
  className = "ad-banner",
  style 
}: AdBannerProps) {
  return (
    <div className={`w-full flex justify-center my-4 ${className}`}>
      <Adsense
        className="block"
        client="ca-pub-XXXXXXXXXXXXXXXX"
        slot={slot}
        style={{ 
          display: 'block',
          width: '100%',
          maxWidth: '728px',
          height: '90px',
          ...style
        }}
        format="auto"
        responsive="true"
        adTest="on" // Remove in production
      />
    </div>
  );
}