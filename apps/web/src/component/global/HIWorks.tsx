import { Cloud, Cpu, Database, GitBranch, LineChart } from "lucide-react";

const HIWorks = () => {
  const steps = [
    {
      icon: Database,
      step: "01",
      title: "Connect Your Data",
      desc: "Plug in any data source — databases, warehouses, files, or real-time streams. We handle the rest.",
    },
    {
      icon: Cpu,
      step: "02",
      title: "Train & Tune",
      desc: "Our AutoML engine explores thousands of model configurations and picks the best one for your problem.",
    },
    {
      icon: Cloud,
      step: "03",
      title: "Deploy & Serve",
      desc: "Ship your model to production with a single click. Get a REST API endpoint ready for your apps.",
    },
    {
      icon: LineChart,
      step: "04",
      title: "Monitor & Iterate",
      desc: "Track model health in real-time. Detect drift, retrain automatically, and keep performance high.",
    },
  ];
  return (
    <>
      <section className="bg-slate-950 py-24 relative">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-16 reveal">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 mb-4">
              <GitBranch className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                How It Works
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
              From data to deployment in 4 steps
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div
                key={s.step}
                className="reveal relative"
                style={{ transitionDelay: `${i * 0.1}s` }}>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-7 left-[60%] w-full h-px bg-gradient-to-r from-slate-700 to-transparent" />
                )}
                <div className="relative glass rounded-2xl p-6 card-hover">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-teal-400 flex items-center justify-center">
                      <s.icon className="w-6 h-6 text-slate-900" />
                    </div>
                    <span className="text-3xl font-bold text-slate-800">
                      {s.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {s.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default HIWorks;
