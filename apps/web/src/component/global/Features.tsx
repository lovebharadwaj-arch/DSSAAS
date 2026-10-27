import {
  Activity,
  ArrowRight,
  Brain,
  Cloud,
  Database,
  GitBranch,
  Shield,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../common/Button";

const Features = () => {
  const navigate = useNavigate();
  const features = [
    {
      icon: Database,
      title: "Data Pipeline Automation",
      desc: "Connect any source — SQL, NoSQL, APIs, or streaming. We clean, transform, and version your data automatically.",
      color: "from-sky-400 to-blue-500",
    },
    {
      icon: Brain,
      title: "AutoML & Model Building",
      desc: "Upload your dataset and our engine selects the best algorithm, tunes hyperparameters, and trains your model.",
      color: "from-teal-400 to-emerald-500",
    },
    {
      icon: GitBranch,
      title: "MLOps & Versioning",
      desc: "Track every experiment, compare runs, and roll back instantly. Full reproducibility with one-click deployment.",
      color: "from-violet-400 to-purple-500",
    },
    {
      icon: Cloud,
      title: "Scalable Cloud Deployment",
      desc: "Deploy models as REST APIs, gRPC services, or batch jobs. Auto-scaling handles traffic spikes seamlessly.",
      color: "from-orange-400 to-amber-500",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      desc: "SOC 2 Type II, end-to-end encryption, role-based access, and private VPC deployments. Your data stays yours.",
      color: "from-rose-400 to-red-500",
    },
    {
      icon: Activity,
      title: "Real-Time Monitoring",
      desc: "Drift detection, performance dashboards, and alerting built in. Know before your models degrade.",
      color: "from-cyan-400 to-sky-500",
    },
  ];
  return (
    <>
      <section id="features" className="bg-slate-950 py-24 relative">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 mb-4">
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                Platform Features
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
              Everything you need to ship
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              One platform for the entire ML lifecycle. No fragmented tools, no
              DevOps overhead — just results.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) => (
              <div
                key={feat.title}
                className="card-hover glass rounded-2xl p-7 group"
                style={{ transitionDelay: `${i * 0.08}s` }}>
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feat.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <feat.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {feat.title}
                </h3>
                <p className="text-slate-400 leading-relaxed">{feat.desc}</p>
                <Button
                  className="mt-5 flex items-center gap-1.5 text-sky-400 text-sm font-medium cursor-pointer group-hover:gap-3 transition-all"
                  onClick={() => navigate("/dataPages")}>
                  Learn more
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default Features;
