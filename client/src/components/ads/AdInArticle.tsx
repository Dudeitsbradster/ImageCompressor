import { Adsense } from '@ctrl/react-adsense';

interface AdInArticleProps {
  slot?: string;
  className?: string;
}

export default function AdInArticle({ 
  slot = "1111111111", 
  className = "ad-in-article" 
}: AdInArticleProps) {
  return (
    <div className={`w-full flex justify-center my-6 ${className}`}>
      <Adsense
        className="block"
        client="ca-pub-XXXXXXXXXXXXXXXX"
        slot={slot}
        style={{ 
          display: 'block',
          width: '100%',
          textAlign: 'center'
        }}
        layout="in-article"
        format="fluid"
        adTest="on" // Remove in production
      />
    </div>
  );
}