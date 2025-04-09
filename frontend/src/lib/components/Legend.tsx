import { getCategoricalColor, getContinuousColor, fetchStats, StatMap } from "../utils/colorUtils";
import { ColorMode } from "../utils/colorUtils";
import { useEffect, useState } from "react";

export default function Legend({ mode, stats }: { mode: ColorMode; stats: StatMap | null }) {

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
          <span>Less significant</span>
          <span>More significant</span>
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
    <div className="legend-container">
      {renderColorBar()}

      <div className="legend-explanation">
        <p>
          <strong>Specialty</strong>: Categorical coloring by medical specialty (e.g., clinical oncology). Some procedures are uncategorized and shown in white.
        </p>
        <p>
          <strong>TF-IDF (active phase 0 / 1)</strong>: Shows the importance of a code for label 0 (inactive) or label 1 (active). Higher TF-IDF means the code is more specific to the label.
        </p>
        <p>
          <strong>Frequency</strong>: Based on total occurrence of the code across all sequences. More frequent codes are darker.
        </p>
      </div>

      <div className="legend-squares">
        <div className="legend-item">
          <span className="square" style={{ backgroundImage: specialtyStripeBackground }} /> <span>Specialty</span>
        </div>
        <div className="legend-item">
          <span className="square" style={{ backgroundColor: getCategoricalColor(null) }} /> <span>Uncategorized</span>
        </div>
        {stats && stats.tfidf0 && (
          <div className="legend-item">
            <span
              className="square"
              style={{ backgroundColor: getContinuousColor(Math.expm1(stats.tfidf0.logMean + stats.tfidf0.logStd), stats.tfidf0, "tfidf0") }}
            /> <span>TF-IDF (label 0)</span>
          </div>
        )}
        {stats && stats.tfidf1 && (
          <div className="legend-item">
            <span
              className="square"
              style={{ backgroundColor: getContinuousColor(Math.expm1(stats.tfidf1.logMean + stats.tfidf1.logStd), stats.tfidf1, "tfidf1") }}
            /> <span>TF-IDF (label 1)</span>
          </div>
        )}
        {stats && stats.frequency && (
          <div className="legend-item">
            <span
              className="square"
              style={{ backgroundColor: getContinuousColor(Math.expm1(stats.frequency.logMean + stats.frequency.logStd), stats.frequency, "frequency") }}
            /> <span>Frequency</span>
          </div>
        )}
        <div className="legend-item">
          <span className="square code-unknown"/> <span>Unknown</span>
        </div>
      </div>
    </div>
  );
}
