"use client";
import { useState, useEffect, useCallback } from "react";
import { Competition } from "./page";
import GroupStageView from "./BracketViews/GroupStageView";
import BracketKnockoutView from "./BracketViews/BracketKnockoutView";
import TimeTrialView from "./BracketViews/TimeTrialView";

export interface TeamOrPart { id: string; name: string; section?: string|null; groupName?: string|null; cpId?: string; }
export interface MatchPart { id:string; score:number; result:string|null; timeResult:string|null; teamId?:string|null; participantId?:string|null; team?:{id:string;name:string;section:string|null}|null; participant?:{id:string;name:string;section:string|null}|null; }
export interface Match { id:string; name:string; round:string|null; groupName:string|null; stage:string; status:string; scheduledAt:string|Date|null; venue:string|null; bracketSlot:number|null; participants:MatchPart[]; }

export default function TabBracket({ comp }: { comp: Competition }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<TeamOrPart[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupViewTab, setGroupViewTab] = useState<"GROUP" | "BRACKET">("GROUP");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [mRes, rRes] = await Promise.all([
      fetch(`/api/matches?competitionId=${comp.id}`),
      fetch(`/api/competitions/${comp.id}/participants`),
    ]);
    const mData = await mRes.json();
    const rData = await rRes.json();
    setMatches(Array.isArray(mData) ? mData : []);
    const isTeam = comp.type === "TEAM" || comp.type === "DUO";
    if (isTeam) {
      setTeams((rData.teams||[]).map((t:any)=>({ id:t.id, name:t.name, section:t.section, groupName:t.groupName })));
    } else {
      setTeams((rData.individuals||[]).map((r:any)=>({ id:r.participant.id, name:r.participant.name, section:r.participant.section, groupName:r.groupName??null, cpId: r.id })));
    }
    setLoading(false);
  }, [comp.id, comp.type]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) return <div className="space-y-3">{[1,2,3].map(i=><div key={i} className="h-16 shimmer rounded-[6px]"/>)}</div>;

  if (comp.format === "GROUP_STAGE") {
    return (
      <div className="space-y-4">
        <div className="flex justify-center border-b-2 border-[#E7E5E4] mb-4">
          <button 
            onClick={() => setGroupViewTab("GROUP")}
            className={`px-6 py-2 font-black text-sm uppercase transition-all ${groupViewTab === "GROUP" ? "border-b-[4px] border-[#0891B2] text-[#0891B2]" : "text-gray-500 hover:text-black"}`}
          >
            Fase Grup
          </button>
          <button 
            onClick={() => setGroupViewTab("BRACKET")}
            className={`px-6 py-2 font-black text-sm uppercase transition-all ${groupViewTab === "BRACKET" ? "border-b-[4px] border-[#0891B2] text-[#0891B2]" : "text-gray-500 hover:text-black"}`}
          >
            Fase Knockout (Bracket)
          </button>
        </div>
        {groupViewTab === "GROUP" 
          ? <GroupStageView comp={comp} matches={matches} teams={teams} onRefresh={fetchAll}/>
          : <BracketKnockoutView comp={comp} matches={matches} teams={teams} onRefresh={fetchAll}/>}
      </div>
    );
  }

  if (comp.format === "BRACKET") return <BracketKnockoutView comp={comp} matches={matches} teams={teams} onRefresh={fetchAll}/>;
  return <TimeTrialView comp={comp} matches={matches} teams={teams} onRefresh={fetchAll}/>;
}
