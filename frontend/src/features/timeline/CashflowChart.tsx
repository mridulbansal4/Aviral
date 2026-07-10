import { useEffect, useRef } from "react";
import { createChart, ColorType, HistogramSeries, LineSeries } from "lightweight-charts";
import type { IChartApi } from "lightweight-charts";
import type { TimelinePoint } from "../../lib/api";

export function CashflowChart({ points }: { points: TimelinePoint[] }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || !points.length) return;

    // Convert API points to TradingView format
    // Since points just have "Jan 24", we need to map them to actual dates for lightweight-charts
    // For simplicity, we just use string times or simple indexes if dates aren't full.
    // Lightweight charts requires YYYY-MM-DD for string times.
    const tvData = points.map((p) => {
      let time: string;
      // Handle both "YYYY-MM" and "Mon YY" formats
      if (/^\d{4}-\d{2}$/.test(p.month)) {
        // Already YYYY-MM, just append day
        time = `${p.month}-01`;
      } else {
        // "Jan 25" or "Jan 2025" style
        const parts = p.month.split(" ");
        const monthMap: Record<string, string> = {
          Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
          Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12"
        };
        const mon = monthMap[parts[0]] || "01";
        const yr = parts[1]?.length === 2 ? `20${parts[1]}` : (parts[1] || "2025");
        time = `${yr}-${mon}-01`;
      }
      return {
        time,
        income: p.income,
        spend: p.total_spend,
        net: p.net_savings,
        originalLabel: p.month
      };
    });

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(255, 255, 255, 0.5)",
        fontFamily: "var(--font-mono)",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.05)", style: 3 }, // Dotted
        horzLines: { color: "rgba(255, 255, 255, 0.05)", style: 3 },
      },
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        tickMarkFormatter: (time: string) => {
          const match = tvData.find(d => d.time === time);
          return match ? match.originalLabel : time;
        }
      },
      crosshair: {
        mode: 1, // Magnet mode
        vertLine: {
          color: "rgba(255, 255, 255, 0.2)",
          width: 1,
          style: 3,
        },
        horzLine: {
          color: "rgba(255, 255, 255, 0.2)",
          width: 1,
          style: 3,
        },
      },
      handleScroll: false,
      handleScale: false,
    });
    
    chartRef.current = chart;

    // 1. Histogram for Net Savings
    const netSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "right",
    });
    
    netSeries.setData(
      tvData.map(d => ({
        time: d.time,
        value: d.net,
        color: d.net >= 0 ? "rgba(46, 204, 113, 0.3)" : "rgba(231, 76, 60, 0.3)"
      }))
    );

    // 2. Line for Income
    const incomeSeries = chart.addSeries(LineSeries, {
      color: "#3b82f6", // Accent blue
      lineWidth: 2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
    });
    
    incomeSeries.setData(tvData.map(d => ({ time: d.time, value: d.income })));

    // 3. Line for Spend
    const spendSeries = chart.addSeries(LineSeries, {
      color: "#f59e0b", // Warning amber
      lineWidth: 2,
      lineStyle: 2, // Dashed
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
    });

    spendSeries.setData(tvData.map(d => ({ time: d.time, value: d.spend })));

    chart.timeScale().fitContent();

    return () => {
      chart.remove();
    };
  }, [points]);

  return (
    <div style={{ width: "100%", marginTop: "var(--space-4)" }}>
      <div 
        ref={chartContainerRef} 
        style={{ width: "100%", height: "260px" }} 
      />
      <div className="chart-legend" style={{ display: "flex", gap: "16px", justifyContent: "center", marginTop: "16px", fontSize: "12px", color: "var(--color-text-secondary)", fontFamily: "var(--font-mono)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: 8, height: 2, background: "#3b82f6" }} /> Income
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: 8, height: 2, background: "#f59e0b" }} /> Spend
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <div style={{ width: 8, height: 8, borderRadius: "2px", background: "rgba(46, 204, 113, 0.3)" }} /> Net Savings
        </span>
      </div>
    </div>
  );
}
