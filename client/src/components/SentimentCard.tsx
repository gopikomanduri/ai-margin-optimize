import { Sentiment } from "@/lib/types";

interface SentimentCardProps {
  sentiment: Sentiment;
  detailed?: boolean;
}

const SentimentCard = ({ sentiment, detailed = false }: SentimentCardProps) => {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center">
          <span className="font-medium text-sm">{sentiment.name}</span>
          <span className="text-xs text-slate-500 ml-2">{sentiment.symbol}</span>
        </div>
        <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          sentiment.overall > 65 
            ? "bg-green-50 text-success-500" 
            : sentiment.overall < 45 
              ? "bg-red-50 text-danger-500" 
              : "bg-amber-50 text-warning-500"
        }`}>
          {sentiment.overall > 65 
            ? "Bullish" 
            : sentiment.overall < 45 
              ? "Bearish" 
              : "Neutral"}
        </div>
      </div>
      <div className="h-4 bg-slate-200 rounded overflow-hidden">
        <div 
          className={`h-full ${
            sentiment.overall > 65 
              ? "bg-success-500" 
              : sentiment.overall < 45 
                ? "bg-danger-500" 
                : "bg-warning-500"
          }`} 
          style={{ width: `${sentiment.overall}%` }}
        ></div>
      </div>
      <div className="flex items-center justify-between mt-1 text-xs">
        <span>Positive mentions: {sentiment.overall}%</span>
        <span className="text-slate-500">{sentiment.sources} sources</span>
      </div>
      
      {detailed && (
        <div className="mt-3 border-t border-slate-200 pt-3">
          <h4 className="text-xs font-medium mb-2">Sentiment Sources</h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white rounded p-2">
              <div className="text-xs font-medium text-center">Twitter</div>
              <div className="text-center mt-1">
                <span className={`text-sm font-medium ${
                  sentiment.sources_breakdown?.twitter > 65 
                    ? "text-success-500" 
                    : sentiment.sources_breakdown?.twitter < 45 
                      ? "text-danger-500" 
                      : "text-warning-500"
                }`}>
                  {sentiment.sources_breakdown?.twitter || 0}%
                </span>
              </div>
            </div>
            <div className="bg-white rounded p-2">
              <div className="text-xs font-medium text-center">News</div>
              <div className="text-center mt-1">
                <span className={`text-sm font-medium ${
                  sentiment.sources_breakdown?.news > 65 
                    ? "text-success-500" 
                    : sentiment.sources_breakdown?.news < 45 
                      ? "text-danger-500" 
                      : "text-warning-500"
                }`}>
                  {sentiment.sources_breakdown?.news || 0}%
                </span>
              </div>
            </div>
            <div className="bg-white rounded p-2">
              <div className="text-xs font-medium text-center">Reddit</div>
              <div className="text-center mt-1">
                <span className={`text-sm font-medium ${
                  sentiment.sources_breakdown?.reddit > 65 
                    ? "text-success-500" 
                    : sentiment.sources_breakdown?.reddit < 45 
                      ? "text-danger-500" 
                      : "text-warning-500"
                }`}>
                  {sentiment.sources_breakdown?.reddit || 0}%
                </span>
              </div>
            </div>
          </div>
          
          {sentiment.recent_headlines && (
            <div className="mt-3">
              <h4 className="text-xs font-medium mb-2">Recent Headlines</h4>
              <ul className="text-xs space-y-1.5">
                {sentiment.recent_headlines.map((headline, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className={`mr-1.5 mt-0.5 ${
                      headline.sentiment === "positive" 
                        ? "text-success-500" 
                        : headline.sentiment === "negative" 
                          ? "text-danger-500" 
                          : "text-slate-500"
                    }`}>
                      {headline.sentiment === "positive" 
                        ? "▲" 
                        : headline.sentiment === "negative" 
                          ? "▼" 
                          : "■"}
                    </span>
                    <span className="line-clamp-1">{headline.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SentimentCard;
