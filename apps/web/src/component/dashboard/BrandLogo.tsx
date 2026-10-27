import { BrainCircuit } from "lucide-react";
import "../../index.css";

const BrandLogo = () => {
  return (
    <div className="flex items-center gap-3 px-2">
      <div className="brand-mark">
        <BrainCircuit size={21} strokeWidth={2.2} />
      </div>
      <div>
        <div className="text-[17px] font-bold tracking-tight text-white">
          dssa<span className="text-indigo-300">as</span>
        </div>
        <div className="text-[10px] tracking-[.18em] text-slate-500 uppercase">
          Data intelligence
        </div>
      </div>
    </div>
  );
};

export default BrandLogo;
