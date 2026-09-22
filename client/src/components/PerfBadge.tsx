/** Pastille de PerfScore (0-100) — code couleur tier. */
export default function PerfBadge({ score }: { score: number }) {
  const tone = score >= 80 ? 'success' : score >= 55 ? 'cyan' : score >= 35 ? 'warning' : 'danger';
  return <span className={`badge badge-${tone}`} aria-label={`Performance : ${score} sur 100`}><span aria-hidden="true">⚙</span> {score}</span>;
}
