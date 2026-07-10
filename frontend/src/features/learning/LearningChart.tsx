import { useEffect, useRef } from "react";
import { createChart, ColorType, LineSeries } from "lightweight-charts";
import type { IChartApi } from "lightweight-charts";
import type { LearningStep } from "../../lib/api";

export function LearningChart({ history }: { history: LearningStep[] }) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || !history.length) return;

    // Map the steps (0, 1, 2...) to fake sequential dates so lightweight-charts
    // can plot them chronologically. We'll format the X-axis to show "R0", "R1".
    const tvData = history.map((h, i) => {
      // Base date: 2025-01-01
      const date = new Date(2025, 0, 1 + i);
      return {
        time: date.toISOString().split("T")[0],
        value: h.roc_auc,
        step: h.step,
        trainSize: h.train_size,
      };
    });

    const chart = createChart(chartContainerRef.current, {
      localization: {
        priceFormatter: (price: number) => price.toFixed(3),
      },
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(255, 255, 255, 0.5)",
        fontFamily: "var(--font-mono)",
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.05)", style: 3 },
        horzLines: { color: "rgba(255, 255, 255, 0.05)", style: 3 },
      },
      rightPriceScale: {
        borderVisible: false,
        autoScale: false,
        // Lock the y-axis to a legible range for ROC-AUC
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        tickMarkFormatter: (time: string) => {
          const match = tvData.find(d => d.time === time);
          return match ? `R${match.step}` : time;
        }
      },
      crosshair: {
        mode: 1, // Magnet
        vertLine: {
          color: "rgba(255, 255, 255, 0.2)",
          width: 1,
          style: 3,
          labelBackgroundColor: "#2563eb",
        },
        horzLine: {
          color: "rgba(255, 255, 255, 0.2)",
          width: 1,
          style: 3,
          labelBackgroundColor: "#2563eb",
        },
      },
      handleScroll: false,
      handleScale: false,
    });
    
    chartRef.current = chart;

    // Apply strict min/max to visually stabilize the chart across retrains
    chart.priceScale("right").applyOptions({
      autoScale: false,
    });

    const series = chart.addSeries(LineSeries, {
      color: "#2563eb", // Primary blue
      lineWidth: 2,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 5,
    });
    
    series.setData(tvData.map(d => ({ time: d.time, value: d.value })));
    
    // Fit the content so all points are visible
    chart.timeScale().fitContent();

    return () => {
      chart.remove();
    };
  }, [history]);

  return (
    <div style={{ width: "100%", margin: "var(--space-2) 0" }}>
      <div ref={chartContainerRef} style={{ width: "100%", height: "220px" }} />
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "0 var(--space-2)",
        marginTop: "8px",
        fontSize: "11px",
        color: "var(--color-text-muted)",
        fontFamily: "var(--font-mono)"
      }}>
        <span>ROC-AUC Metric</span>
        <span>Training Pool Growth</span>
      </div>
    </div>
  );
}
