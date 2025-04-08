import { Trade } from "@/lib/types";

interface TradeCardProps {
  trade: Trade;
}

const TradeCard = ({ trade }: TradeCardProps) => {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="bg-slate-50 p-3 border-b border-slate-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="font-semibold">{trade.name}</span>
            <span className="text-sm text-slate-500 ml-2">{trade.symbol}</span>
          </div>
          <span className={`text-xs px-2 py-0.5 ${
            trade.riskLevel === "Low" 
              ? "bg-green-50 text-success-500" 
              : trade.riskLevel === "Medium" 
                ? "bg-amber-50 text-warning-500" 
                : "bg-red-50 text-danger-500"
          } rounded-full font-medium`}>
            {trade.riskLevel} Risk
          </span>
        </div>
      </div>
      <div className="p-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <p className="text-sm">
              {trade.action} at <span className="font-mono font-medium">{trade.entryPrice}</span> with target <span className="font-mono font-medium text-success-500">{trade.targetPrice}</span> and stop loss <span className="font-mono font-medium text-danger-500">{trade.stopLoss}</span>
            </p>
            <div className="mt-2 text-sm text-slate-600">
              <p>{trade.rationale}</p>
            </div>
            <div className="mt-2">
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <i className={`ri-line-chart-line ${
                    trade.technicalSignal === "Bullish" 
                      ? "text-success-500" 
                      : trade.technicalSignal === "Bearish" 
                        ? "text-danger-500" 
                        : "text-warning-500"
                  }`}></i>
                  <span>{trade.technicalSignal}</span>
                </div>
                <div className="flex items-center gap-1">
                  <i className={`ri-message-2-line ${
                    trade.sentiment === "Positive" 
                      ? "text-success-500" 
                      : trade.sentiment === "Negative" 
                        ? "text-danger-500" 
                        : "text-warning-500"
                  }`}></i>
                  <span>{trade.sentiment} Sentiment</span>
                </div>
                <div className="flex items-center gap-1">
                  <i className={`ri-calendar-check-line ${
                    trade.upcomingEvents 
                      ? "text-primary-500" 
                      : "text-slate-400"
                  }`}></i>
                  <span>{trade.upcomingEvents || "No Events"}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full sm:w-32 h-16 bg-slate-100 rounded">
            {trade.chartData && (
              <svg className="w-full h-full" viewBox="0 0 100 64">
                <defs>
                  <linearGradient id={`gradient-${trade.symbol}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={trade.action === "Buy" ? "#10b98120" : "#ef444420"} />
                    <stop offset="100%" stopColor={trade.action === "Buy" ? "#10b98105" : "#ef444405"} />
                  </linearGradient>
                </defs>
                <path
                  d={`M0,${64-trade.chartData[0]} ${trade.chartData.map((point, i) => 
                    `L${i*(100/(trade.chartData.length-1))},${64-point}`).join(' ')}`}
                  fill="none"
                  stroke={trade.action === "Buy" ? "#10b981" : "#ef4444"}
                  strokeWidth="1.5"
                />
                <path
                  d={`M0,${64-trade.chartData[0]} ${trade.chartData.map((point, i) => 
                    `L${i*(100/(trade.chartData.length-1))},${64-point}`).join(' ')} L100,64 L0,64 Z`}
                  fill={`url(#gradient-${trade.symbol})`}
                />
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeCard;
