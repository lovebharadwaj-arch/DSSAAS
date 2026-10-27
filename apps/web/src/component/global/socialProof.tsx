const SocialProof = () => {
  const companies = [
    "TechCorp",
    "DataFlow",
    "QuantIQ",
    "NeuroSoft",
    "AlphaSys",
    "VertexAI",
  ];
  return (
    <>
      <section className="bg-slate-950 border-y border-slate-800/50 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-sm text-slate-500 mb-8 font-medium uppercase tracking-wider">
            Trusted by data-driven teams worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            {companies.map((c) => (
              <span
                key={c}
                className="text-xl font-bold text-slate-600 hover:text-slate-400 transition-colors cursor-default">
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default SocialProof;
