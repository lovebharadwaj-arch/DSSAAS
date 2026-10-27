import { ArrowRight, Sparkles } from "lucide-react";

const CTA = () => {
  return (
    <>
      <section className="bg-slate-950 py-24 relative overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-sky-500/10 blur-[120px]" />

        <div className="relative max-w-3xl mx-auto px-6 text-center reveal">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
              Get Started Today
            </span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-6">
            Ready to put your data
            <br />
            to <span className="gradient-text">work?</span>
          </h2>
          <p className="text-lg text-slate-400 max-w-xl mx-auto mb-10">
            Join 500+ companies using Neuralis to build, deploy, and scale their
            machine learning models. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button className="btn-primary text-white font-semibold px-8 py-4 rounded-xl flex items-center gap-2 text-base">
              Start Your Free Trial
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="glass-light text-white font-semibold px-8 py-4 rounded-xl flex items-center gap-2 text-base hover:bg-white/10 transition-all">
              Schedule a Demo
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default CTA;
