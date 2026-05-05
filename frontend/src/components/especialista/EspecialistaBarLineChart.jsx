import React from 'react';

const formatCurrency = (value) =>
  new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    maximumFractionDigits: 0
  }).format(value || 0);

const EspecialistaBarLineChart = ({
  title,
  subtitle,
  totalLabel,
  colorClass,
  barColor,
  lineColor,
  data,
  dataKey
}) => {
  const chartHeight = 240;
  const chartWidth = Math.max(720, data.length * 78);
  const maxValue = Math.max(...data.map((item) => Number(item[dataKey]) || 0), 1);
  const total = data.reduce((sum, item) => sum + (Number(item[dataKey]) || 0), 0);
  const innerHeight = 170;
  const topPadding = 18;
  const leftPadding = 18;
  const barWidth = 34;
  const gap = 44;

  const points = data
    .map((item, index) => {
      const value = Number(item[dataKey]) || 0;
      const x = leftPadding + index * (barWidth + gap) + barWidth / 2;
      const y = topPadding + (1 - value / maxValue) * innerHeight;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          </div>
          <div className={`px-4 py-2 rounded-xl text-sm font-bold ${colorClass}`}>
            {totalLabel}: {formatCurrency(total)}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-center gap-6 text-xs text-slate-500 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: barColor }} />
            Barras por colegio
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-0.5 rounded-full" style={{ backgroundColor: lineColor }} />
            Linea de tendencia
          </div>
        </div>

        <div className="overflow-x-auto">
          <div style={{ minWidth: chartWidth }}>
            <svg width={chartWidth} height={chartHeight} className="overflow-visible">
              <line
                x1="0"
                y1={topPadding + innerHeight}
                x2={chartWidth}
                y2={topPadding + innerHeight}
                stroke="#cbd5e1"
                strokeWidth="1"
              />

              {data.map((item, index) => {
                const value = Number(item[dataKey]) || 0;
                const x = leftPadding + index * (barWidth + gap);
                const barHeight = (value / maxValue) * innerHeight;
                const y = topPadding + innerHeight - barHeight;

                return (
                  <g key={`${item.codigoModular}-${dataKey}`}>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      rx="10"
                      fill={barColor}
                      opacity="0.88"
                    />
                    <text
                      x={x + barWidth / 2}
                      y={y - 8}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#475569"
                    >
                      {value.toLocaleString('es-PE')}
                    </text>
                    <text
                      x={x + barWidth / 2}
                      y={topPadding + innerHeight + 16}
                      textAnchor="middle"
                      fontSize="10"
                      fill="#64748b"
                    >
                      {item.codigoModular}
                    </text>
                  </g>
                );
              })}

              {data.length > 1 && (
                <polyline
                  fill="none"
                  stroke={lineColor}
                  strokeWidth="3"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points={points}
                />
              )}

              {data.map((item, index) => {
                const value = Number(item[dataKey]) || 0;
                const x = leftPadding + index * (barWidth + gap) + barWidth / 2;
                const y = topPadding + (1 - value / maxValue) * innerHeight;

                return <circle key={`point-${item.codigoModular}-${dataKey}`} cx={x} cy={y} r="4" fill={lineColor} />;
              })}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EspecialistaBarLineChart;
