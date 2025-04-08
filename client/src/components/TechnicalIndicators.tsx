import { TechnicalData } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";

interface TechnicalIndicatorsProps {
  selectedStock: string;
  setSelectedStock: (stock: string) => void;
  technicalData?: TechnicalData;
  detailed?: boolean;
}

const TechnicalIndicators = ({ 
  selectedStock, 
  setSelectedStock, 
  technicalData,
  detailed = false
}: TechnicalIndicatorsProps) => {
  // Fetch available stocks for selection
  const { data: stockOptions } = useQuery({
    queryKey: ['/api/market/stocks'],
  });

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">Technical Indicators</h3>
        <select 
          className="text-xs border border-slate-200 rounded py-1 px-2"
          value={selectedStock}
          onChange={(e) => setSelectedStock(e.target.value)}
        >
          {stockOptions?.map((stock: { symbol: string; name: string }) => (
            <option key={stock.symbol} value={stock.symbol}>
              {stock.name}
            </option>
          )) || (
            <option value={selectedStock}>{selectedStock}</option>
          )}
        </select>
      </div>
      
      {!technicalData ? (
        <div className="bg-slate-50 rounded-lg p-6 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="bg-slate-50 rounded-lg p-3">
          <div className="space-y-3">
            {/* EMA */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">EMA (20/50/200)</span>
                <span className={`text-xs font-medium ${
                  technicalData.ema.signal === "Bullish" 
                    ? "text-success-500" 
                    : technicalData.ema.signal === "Bearish" 
                      ? "text-danger-500" 
                      : "text-warning-500"
                }`}>
                  {technicalData.ema.signal}
                </span>
              </div>
              <div className="h-16 bg-white rounded">
                {technicalData.ema.chartData && (
                  <svg className="w-full h-full" viewBox="0 0 100 64">
                    {/* Price Line */}
                    <path
                      d={`M0,${64-technicalData.ema.chartData.price[0]} ${technicalData.ema.chartData.price.map((point, i) => 
                        `L${i*(100/(technicalData.ema.chartData.price.length-1))},${64-point}`).join(' ')}`}
                      fill="none"
                      stroke="#0f172a"
                      strokeWidth="1"
                    />
                    {/* EMA 20 Line */}
                    <path
                      d={`M0,${64-technicalData.ema.chartData.ema20[0]} ${technicalData.ema.chartData.ema20.map((point, i) => 
                        `L${i*(100/(technicalData.ema.chartData.ema20.length-1))},${64-point}`).join(' ')}`}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="1.5"
                    />
                    {/* EMA 50 Line */}
                    <path
                      d={`M0,${64-technicalData.ema.chartData.ema50[0]} ${technicalData.ema.chartData.ema50.map((point, i) => 
                        `L${i*(100/(technicalData.ema.chartData.ema50.length-1))},${64-point}`).join(' ')}`}
                      fill="none"
                      stroke="#059669"
                      strokeWidth="1.5"
                    />
                    {/* EMA 200 Line */}
                    <path
                      d={`M0,${64-technicalData.ema.chartData.ema200[0]} ${technicalData.ema.chartData.ema200.map((point, i) => 
                        `L${i*(100/(technicalData.ema.chartData.ema200.length-1))},${64-point}`).join(' ')}`}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                    />
                  </svg>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1">{technicalData.ema.description}</p>
            </div>
            
            {/* RSI */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">RSI (14)</span>
                <span className={`text-xs font-medium ${
                  technicalData.rsi.value > 70 
                    ? "text-danger-500" 
                    : technicalData.rsi.value < 30 
                      ? "text-success-500" 
                      : "text-warning-500"
                }`}>
                  {technicalData.rsi.signal} ({technicalData.rsi.value})
                </span>
              </div>
              <div className="h-8 bg-slate-200 rounded overflow-hidden relative">
                {/* RSI Scale */}
                <div className="absolute inset-0 flex">
                  <div className="w-3/10 h-full bg-danger-500 opacity-10"></div>
                  <div className="w-4/10 h-full bg-warning-500 opacity-10"></div>
                  <div className="w-3/10 h-full bg-success-500 opacity-10"></div>
                </div>
                {/* RSI Indicator */}
                <div 
                  className="absolute h-full w-1 bg-primary-600" 
                  style={{ left: `${technicalData.rsi.value}%` }}
                ></div>
                {/* Labels */}
                <div className="absolute inset-0 flex justify-between px-1 items-center text-[10px] text-slate-600">
                  <span>Oversold</span>
                  <span>Neutral</span>
                  <span>Overbought</span>
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-1">{technicalData.rsi.description}</p>
            </div>
            
            {/* MACD */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm">MACD (12,26,9)</span>
                <span className={`text-xs font-medium ${
                  technicalData.macd.signal === "Bullish" 
                    ? "text-success-500" 
                    : technicalData.macd.signal === "Bearish" 
                      ? "text-danger-500" 
                      : "text-warning-500"
                }`}>
                  {technicalData.macd.signal}
                </span>
              </div>
              <div className="h-16 bg-white rounded">
                {technicalData.macd.chartData && (
                  <svg className="w-full h-full" viewBox="0 0 100 64">
                    {/* Histogram */}
                    {technicalData.macd.chartData.histogram.map((value, i) => (
                      <rect 
                        key={i}
                        x={i * (100 / technicalData.macd.chartData.histogram.length)}
                        y={value >= 0 ? 32 - value * 15 : 32}
                        width={100 / technicalData.macd.chartData.histogram.length - 1}
                        height={Math.abs(value * 15)}
                        fill={value >= 0 ? "#10b981" : "#ef4444"}
                      />
                    ))}
                    {/* MACD Line */}
                    <path
                      d={`M0,${32-technicalData.macd.chartData.macd[0] * 15} ${technicalData.macd.chartData.macd.map((point, i) => 
                        `L${i*(100/(technicalData.macd.chartData.macd.length-1))},${32-point * 15}`).join(' ')}`}
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="1.5"
                    />
                    {/* Signal Line */}
                    <path
                      d={`M0,${32-technicalData.macd.chartData.signal[0] * 15} ${technicalData.macd.chartData.signal.map((point, i) => 
                        `L${i*(100/(technicalData.macd.chartData.signal.length-1))},${32-point * 15}`).join(' ')}`}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="1.5"
                    />
                    {/* Zero Line */}
                    <line x1="0" y1="32" x2="100" y2="32" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="2,2" />
                  </svg>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-1">{technicalData.macd.description}</p>
            </div>
            
            {detailed && (
              <>
                {/* ADX */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">ADX (14)</span>
                    <span className={`text-xs font-medium ${
                      technicalData.adx.value > 25 
                        ? "text-success-500" 
                        : "text-warning-500"
                    }`}>
                      {technicalData.adx.value > 25 ? "Strong" : "Weak"} Trend ({technicalData.adx.value})
                    </span>
                  </div>
                  <div className="h-16 bg-white rounded">
                    {technicalData.adx.chartData && (
                      <svg className="w-full h-full" viewBox="0 0 100 64">
                        {/* ADX Line */}
                        <path
                          d={`M0,${64-technicalData.adx.chartData.adx[0]} ${technicalData.adx.chartData.adx.map((point, i) => 
                            `L${i*(100/(technicalData.adx.chartData.adx.length-1))},${64-point}`).join(' ')}`}
                          fill="none"
                          stroke="#8b5cf6"
                          strokeWidth="1.5"
                        />
                        {/* +DI Line */}
                        <path
                          d={`M0,${64-technicalData.adx.chartData.plusDI[0]} ${technicalData.adx.chartData.plusDI.map((point, i) => 
                            `L${i*(100/(technicalData.adx.chartData.plusDI.length-1))},${64-point}`).join(' ')}`}
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="1"
                          strokeDasharray="2,2"
                        />
                        {/* -DI Line */}
                        <path
                          d={`M0,${64-technicalData.adx.chartData.minusDI[0]} ${technicalData.adx.chartData.minusDI.map((point, i) => 
                            `L${i*(100/(technicalData.adx.chartData.minusDI.length-1))},${64-point}`).join(' ')}`}
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="1"
                          strokeDasharray="2,2"
                        />
                        {/* 25 Line */}
                        <line x1="0" y1="39" x2="100" y2="39" stroke="#94a3b8" strokeWidth="0.5" strokeDasharray="2,2" />
                      </svg>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{technicalData.adx.description}</p>
                </div>
                
                {/* OBV */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">OBV</span>
                    <span className={`text-xs font-medium ${
                      technicalData.obv.signal === "Bullish" 
                        ? "text-success-500" 
                        : technicalData.obv.signal === "Bearish" 
                          ? "text-danger-500" 
                          : "text-warning-500"
                    }`}>
                      {technicalData.obv.signal}
                    </span>
                  </div>
                  <div className="h-16 bg-white rounded">
                    {technicalData.obv.chartData && (
                      <svg className="w-full h-full" viewBox="0 0 100 64">
                        <path
                          d={`M0,${64-technicalData.obv.chartData[0]} ${technicalData.obv.chartData.map((point, i) => 
                            `L${i*(100/(technicalData.obv.chartData.length-1))},${64-point}`).join(' ')}`}
                          fill="none"
                          stroke="#2563eb"
                          strokeWidth="1.5"
                        />
                      </svg>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{technicalData.obv.description}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TechnicalIndicators;
