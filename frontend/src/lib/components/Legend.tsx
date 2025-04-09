
export default function Legend({ mode }: { mode: "specialty" | "tfidf0" | "tfidf1" | "frequency" }) {
  const renderColorBar = () => {
    if (mode === "specialty") return null;

    const labelLeft = mode === "frequency" ? "Less frequent" : "Less significant";
    const labelRight = mode === "frequency" ? "More frequent" : "More significant";

    return (
      <div className="legend">
        <div className={`colorbar colorbar-${mode}`} />
        <div className="legend-labels">
          <span>{labelLeft}</span>
          <span>{labelRight}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="legend-container">
      {renderColorBar()}

      <div className="legend-explanation">
        <p><strong>Specialty</strong>: Categorical coloring by medical specialty (e.g., clinical oncology). Some procedures are uncategorized and shown in white.</p>
        <p><strong>TF-IDF (active phase 0 / 1)</strong>: Shows the importance of a code for label 0 (inactive) or label 1 (active). Higher TF-IDF means the code is more specific to the label.</p>
        <p><strong>Frequency</strong>: Based on total occurrence of the code across all sequences. More frequent codes are darker.</p>
      </div>

      <div className="legend-squares">
        <div className="square color-specialty" /> <span>Specialty</span>
        <div className="square color-uncategorized" /> <span>Uncategorized</span>
        <div className="square colorbar-tfidf0" /> <span>TF-IDF (label 0)</span>
        <div className="square colorbar-tfidf1" /> <span>TF-IDF (label 1)</span>
        <div className="square colorbar-frequency" /> <span>Frequency</span>
        <div className="square color-unknown" /> <span>Unknown</span>
      </div>
    </div>
  );
} 