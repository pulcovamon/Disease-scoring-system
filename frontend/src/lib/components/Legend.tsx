import { getCategoricalColor, getContinuousColor, fetchStats, StatMap } from "../utils/colorUtils";
import { ColorMode } from "../utils/colorUtils";
import { useEffect, useState } from "react";
import { useTranslations } from "../i18n/useTranslations";

export default function Legend({ mode, stats }: { mode: ColorMode; stats: StatMap | null }) {
  const { t } = useTranslations();

  const renderColorBar = () => {
    if (mode === "specialty" || !stats || !stats[mode]) return null;

    const stat = stats[mode];
    const gradientColors = Array.from({ length: 10 }, (_, i) => {
      const factor = (i + 1) / 10;
      const value = Math.expm1(stat.logMean + stat.logStd * (2 * factor - 1));
      return getContinuousColor(value, stat, mode);
    });

    return (
      <div>
        <div
          className="colorbar"
          style={{ background: `linear-gradient(to right, ${gradientColors.join(", ")})` }}
        />
        <div className="legend-labels">
          <span>{t("codes.legend.frequency.low")}</span>
          <span>{t("codes.legend.frequency.high")}</span>
        </div>
      </div>
    );
  };

  const specialtyStripeBackground = (() => {
    const categories = [
      "klinická onkologie",
      "pneumologie a ftizeologie",
      "alergologie a klinická imunologie",
      "klinická osteologie",
    ];

    const segment = 100 / categories.length;
    const stops = categories.flatMap((cat, i) => {
      const color = getCategoricalColor(cat);
      const start = i * segment;
      const end = (i + 1) * segment;
      return [`${color} ${start}%`, `${color} ${end}%`];
    });

    return `repeating-linear-gradient(90deg, ${stops.join(", ")})`;
  })();

  return (
    <div className="space-y-4">
      {renderColorBar()}

      <div className="text-sm text-[var(--text-muted)] space-y-2">
        <p>
          <strong>{t("codes.legend.specialty.label")}</strong>: {t("codes.legend.specialty")}
        </p>
        <p>
          <strong>TF-IDF (active phase 0 / 1)</strong>: {t("codes.legend.tfidf")}
        </p>
        <p>
          <strong>{t("codes.legend.frequency.label")}</strong>: {t("codes.legend.frequency")}
        </p>
      </div>

      <div className="flex flex-wrap gap-4 text-sm text-[var(--text-color)]">
        <LegendItem colorStyle={{ backgroundImage: specialtyStripeBackground }} label={t("codes.legend.specialty.label")} />
        <LegendItem colorStyle={{ backgroundColor: getCategoricalColor(null) }} label={t("codes.legend.uncategorized")} />
        {stats && stats.tfidf0 && (
          <LegendItem
            colorStyle={{
              backgroundColor: getContinuousColor(Math.expm1(stats.tfidf0.logMean + stats.tfidf0.logStd), stats.tfidf0, "tfidf0"),
            }}
            label={t("codes.legend.tfidf0")}
          />
        )}
        {stats && stats.tfidf1 && (
          <LegendItem
            colorStyle={{
              backgroundColor: getContinuousColor(Math.expm1(stats.tfidf1.logMean + stats.tfidf1.logStd), stats.tfidf1, "tfidf1"),
            }}
            label={t("codes.legend.tfidf1")}
          />
        )}
        {stats && stats.frequency && (
          <LegendItem
            colorStyle={{
              backgroundColor: getContinuousColor(Math.expm1(stats.frequency.logMean + stats.frequency.logStd), stats.frequency, "frequency"),
            }}
            label={t("codes.legend.frequency.label")}
          />
        )}
        <LegendItem
          colorStyle={{
            backgroundImage: "repeating-linear-gradient(45deg, #ddd, #ddd 4px, #fff 4px, #fff 8px)",
          }}
          label={t("codes.legend.unknown")}
        />
      </div>
    </div>
  );
}

function LegendItem({ colorStyle, label }: { colorStyle: React.CSSProperties; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-4 h-4 rounded-sm inline-block border border-[var(--border-muted)]" style={colorStyle} />
      <span>{label}</span>
    </div>
  );
}
