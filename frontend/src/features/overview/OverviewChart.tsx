import { useEffect, useRef } from "react";
import { createChart, ColorType, AreaSeries } from "lightweight-charts";
import type { IChartApi } from "lightweight-charts";

export function OverviewChart({ data }: { data: { name: string; value: number }[] }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || !data.length) return;

    // Fake dates for the TradingView chart (it requires proper time-series data)
    // The data is currently Mon, Tue, Wed... Let's map it to the last 7 days.
    const today = new Date();
    const tvData = data.map((d, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (data.length - 1 - i));
      return {
        time: date.toISOString().split("T")[0],
        value: d.value,
        originalLabel: d.name
      };
    });

    const chart = createChart(chartContainerRef.current, {
      localization: {
        priceFormatter: (price: number) => `$${price.toFixed(1)}M`,
      },
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(255, 255, 255, 0.5)",
        fontFamily: "var(--font-mono)",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.05)" },
        horzLines: { color: "rgba(255, 255, 255, 0.05)" },
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
        mode: 1, // Magnet
        vertLine: {
          color: "rgba(255, 255, 255, 0.4)",
          width: 1,
          style: 3,
          labelBackgroundColor: "#3b82f6",
        },
        horzLine: {
          color: "rgba(255, 255, 255, 0.4)",
          width: 1,
          style: 3,
          labelBackgroundColor: "#3b82f6",
        },
      },
      handleScroll: false,
      handleScale: false,
    });
    
    chartRef.current = chart;

    const areaSeries = chart.addSeries(AreaSeries, {
      lineColor: "#3b82f6", // Accent blue
      topColor: "rgba(59, 130, 246, 0.4)",
      bottomColor: "rgba(59, 130, 246, 0)",
      lineWidth: 2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
    });
    
    areaSeries.setData(tvData.map(d => ({ time: d.time, value: d.value })));
    chart.timeScale().fitContent();

    return () => {
      chart.remove();
    };
  }, [data]);

  return <div ref={chartContainerRef} style={{ width: "100%", height: "240px" }} />;
}
