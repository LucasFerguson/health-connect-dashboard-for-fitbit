"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type ReactEChartsType from "echarts-for-react";
import { Spinner } from "./Spinner";

/**
 * ECharts is a large first-load dependency (see CLEAN_CODE_REPORT.md). Every
 * chart in the dashboard renders client-side already, so there's no reason
 * to ship it in the initial bundle — load it only once a chart actually
 * mounts. Drop-in replacement for `ReactECharts` from "echarts-for-react".
 */
const LazyECharts = dynamic(() => import("echarts-for-react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-24 w-full items-center justify-center">
      <Spinner size={16} />
    </div>
  ),
}) as unknown as typeof ReactEChartsType;

export type LazyEChartsProps = ComponentProps<typeof ReactEChartsType>;
export { LazyECharts };
