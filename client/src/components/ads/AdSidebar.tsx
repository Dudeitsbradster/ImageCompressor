import { Adsense } from '@ctrl/react-adsense';

interface AdSidebarProps {
  slot?: string;
  className?: string;
}

export default function AdSidebar({ 
  slot = "0987654321", 
  className = "ad-sidebar" 
}: AdSidebarProps) {
  return (
    <div className={`w-full ${className}`}>
      <Adsense
        className="block"
        client="ca-pub-XXXXXXXXXXXXXXXX"
        slot={slot}
        style={{ 
          display: 'block',
          width: '300px',
          height: '250px'
        }}
        format=""
        adTest="on" // Remove in production
      />
    </div>
  );
}