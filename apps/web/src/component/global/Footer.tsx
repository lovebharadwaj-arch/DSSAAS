import { Brain, Code2, Globe, Lock } from "lucide-react";

const Footer = () => {
  const sections = [
    {
      title: "Product",
      links: ["Features", "Platform", "Pricing", "Changelog", "Roadmap"],
    },
    {
      title: "Resources",
      links: [
        "Documentation",
        "API Reference",
        "Tutorials",
        "Blog",
        "Community",
      ],
    },
    {
      title: "Company",
      links: ["About", "Careers", "Press Kit", "Contact", "Partners"],
    },
    {
      title: "Legal",
      links: ["Privacy", "Terms", "Security", "SOC 2", "GDPR"],
    },
  ];
  return (
    <>
      <footer
        id="resources"
        className="bg-slate-950 border-t border-slate-800/50 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-5 gap-8 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-teal-400 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-slate-900" />
                </div>
                <span className="text-white font-bold text-lg">Neuralis</span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Data Science as a Service. From raw data to production models in
                days.
              </p>
              <div className="flex items-center gap-3 mt-5">
                {[Globe, Code2, Lock].map((Icon, i) => (
                  <div
                    key={i}
                    className="w-9 h-9 rounded-lg glass-light flex items-center justify-center hover:bg-white/10 cursor-pointer transition-all">
                    <Icon className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>

            {/* Link sections */}
            {sections.map((section) => (
              <div key={section.title}>
                <h4 className="text-sm font-semibold text-white mb-4">
                  {section.title}
                </h4>
                <div className="space-y-2.5">
                  {section.links.map((link) => (
                    <a
                      key={link}
                      href="#"
                      className="block text-sm text-slate-400 hover:text-sky-400 transition-colors">
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-8 border-t border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-500">
              © 2026 Neuralis, Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              All systems operational
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
