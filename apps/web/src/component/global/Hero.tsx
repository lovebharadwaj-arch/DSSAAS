import { ArrowRight, Play, Sparkles } from "lucide-react";

const Hero = () => {
  return (
    <>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-950 grid-bg">
        {/* Gradient orbs */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 rounded-full bg-sky-500/20 blur-[120px] animate-pulse-glow" />
        <div
          className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full bg-teal-500/20 blur-[120px] animate-pulse-glow"
          style={{ animationDelay: "1.5s" }}
        />

        {/* Floating grid overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/50 to-slate-950" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center pt-20">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-light mb-8 animate-fadeIn">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span className="text-sm text-slate-300 font-medium">
              AI-Powered Data Science Platform
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.1] mb-6 animate-fadeInUp">
            Data Science
            <br />
            <span className="gradient-text">as a Service</span>
          </h1>

          {/* Subheadline */}
          <p
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fadeInUp"
            style={{ animationDelay: "0.15s", opacity: 0 }}>
            From raw data to production-grade ML models in days, not months.
            Neuralis handles the entire pipeline — ingestion, cleaning,
            training, deployment, and monitoring — so your team can focus on
            insights.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fadeInUp"
            style={{ animationDelay: "0.3s", opacity: 0 }}>
            <button className="btn-primary text-white font-semibold px-7 py-3.5 rounded-xl flex items-center gap-2 text-base">
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="glass-light text-white font-semibold px-7 py-3.5 rounded-xl flex items-center gap-2 text-base hover:bg-white/10 transition-all">
              <Play className="w-5 h-5 text-sky-400" />
              Watch Demo
            </button>
          </div>

          {/* Stats strip */}
          <div
            className="grid grid-cols-3 gap-4 md:gap-12 mt-20 max-w-3xl mx-auto animate-fadeInUp"
            style={{ animationDelay: "0.45s", opacity: 0 }}>
            {[
              { value: "10M+", label: "Models Deployed" },
              { value: "99.9%", label: "Uptime SLA" },
              { value: "500+", label: "Enterprise Clients" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold gradient-text">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="w-6 h-10 rounded-full border-2 border-slate-600 flex items-start justify-center p-1.5">
            <div className="w-1 h-2 rounded-full bg-sky-400 animate-float" />
          </div>
        </div>
      </section>
    </>
  );
};

export default Hero;
