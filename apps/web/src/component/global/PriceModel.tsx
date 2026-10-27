import { Check, Cpu, Server, Star, Users } from "lucide-react";
import { useState } from "react";

const PriceModel = () => {
  const [annual, setAnnual] = useState(true);

  const plans = [
    {
      name: "Starter",
      price: annual ? 49 : 69,
      desc: "For individuals and small projects",
      features: [
        "5GB data storage",
        "3 active models",
        "10K API calls/mo",
        "Community support",
        "Basic monitoring",
      ],
      highlighted: false,
      icon: Users,
    },
    {
      name: "Professional",
      price: annual ? 199 : 279,
      desc: "For growing data teams",
      features: [
        "100GB data storage",
        "Unlimited models",
        "1M API calls/mo",
        "Priority support",
        "Advanced monitoring",
        "AutoML engine",
        "Team collaboration",
      ],
      highlighted: true,
      icon: Cpu,
    },
    {
      name: "Enterprise",
      price: null,
      desc: "For large-scale operations",
      features: [
        "Unlimited storage",
        "Dedicated infrastructure",
        "Unlimited API calls",
        "24/7 SLA support",
        "Custom integrations",
        "Private VPC",
        "SSO & RBAC",
      ],
      highlighted: false,
      icon: Server,
    },
  ];
  return (
    <>
      <section
        id="pricing"
        className="bg-slate-900 py-24 relative overflow-hidden">
        <div className="absolute top-1/3 left-0 w-72 h-72 rounded-full bg-sky-500/10 blur-[100px]" />
        <div className="absolute bottom-1/3 right-0 w-72 h-72 rounded-full bg-teal-500/10 blur-[100px]" />

        <div className="relative max-w-6xl mx-auto px-6">
          <div className="text-center mb-12 reveal">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 mb-4">
              <Star className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                Pricing
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
              Start free. Upgrade when you need more. No hidden fees.
            </p>

            {/* Toggle */}
            <div className="inline-flex items-center gap-3 glass-light rounded-full p-1.5">
              <button
                onClick={() => setAnnual(false)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  !annual ? "bg-sky-500 text-white" : "text-slate-400"
                }`}>
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  annual ? "bg-sky-500 text-white" : "text-slate-400"
                }`}>
                Annual
                <span className="ml-1.5 text-xs text-teal-400">Save 30%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <div
                key={plan.name}
                className={`reveal rounded-2xl p-8 card-hover relative ${
                  plan.highlighted
                    ? "glass border-2 border-sky-400/50 lg:scale-105"
                    : "glass"
                }`}
                style={{ transitionDelay: `${i * 0.1}s` }}>
                {plan.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-sky-400 to-teal-400 text-xs font-bold text-slate-900">
                    MOST POPULAR
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${plan.highlighted ? "bg-sky-500/20" : "bg-slate-800"}`}>
                    <plan.icon
                      className={`w-5 h-5 ${plan.highlighted ? "text-sky-400" : "text-slate-400"}`}
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {plan.name}
                    </h3>
                  </div>
                </div>

                <p className="text-sm text-slate-400 mb-5">{plan.desc}</p>

                <div className="mb-6">
                  {plan.price ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-white">
                        ${plan.price}
                      </span>
                      <span className="text-slate-500">/mo</span>
                    </div>
                  ) : (
                    <div className="text-4xl font-bold text-white">Custom</div>
                  )}
                </div>

                <button
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                    plan.highlighted
                      ? "btn-primary text-white"
                      : "glass-light text-white hover:bg-white/10"
                  }`}>
                  {plan.price ? "Start Free Trial" : "Contact Sales"}
                </button>

                <div className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2.5 text-sm">
                      <Check className="w-4 h-4 text-teal-400 flex-shrink-0" />
                      <span className="text-slate-300">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default PriceModel;
