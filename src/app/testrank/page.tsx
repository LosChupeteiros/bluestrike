import { FaceitSkillIcon } from "@/components/ui/faceit-skill-icon";

export default function TestRankPage() {
  const levels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-12 bg-[#0a0a0a] p-12">
      <h1 className="text-2xl font-black text-white">FACEIT Skill Levels</h1>

      {/* Tamanho padrão */}
      <div className="flex flex-col gap-6">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-[#555]">24px (padrão)</p>
        <div className="flex items-end gap-6">
          {levels.map((level) => (
            <div key={level} className="flex flex-col items-center gap-2">
              <FaceitSkillIcon level={level} size={24} />
              <span className="text-xs font-bold text-[#888]">{level}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tamanho grande */}
      <div className="flex flex-col gap-6">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-[#555]">48px</p>
        <div className="flex items-end gap-6">
          {levels.map((level) => (
            <div key={level} className="flex flex-col items-center gap-2">
              <FaceitSkillIcon level={level} size={48} />
              <span className="text-xs font-bold text-[#888]">{level}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tamanho XL */}
      <div className="flex flex-col gap-6">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-[#555]">96px</p>
        <div className="flex items-end gap-8">
          {levels.map((level) => (
            <div key={level} className="flex flex-col items-center gap-3">
              <FaceitSkillIcon level={level} size={96} />
              <span className="text-sm font-black text-[#888]">{level}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
