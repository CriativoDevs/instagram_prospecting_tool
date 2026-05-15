"use client";

import { ScoredProfile } from "@/types/instagram";
import { ExternalLink, MessageSquare, CheckCircle2, User, Image as ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileCardProps {
  profile: ScoredProfile;
  onGenerateDM: (profile: ScoredProfile) => void;
  onMarkAsSent: (profile: ScoredProfile) => void;
}

export function ProfileCard({ profile, onGenerateDM, onMarkAsSent }: ProfileCardProps) {
  const isSent = profile.prospectStatus?.status === 'sent';

  const badges = {
    ideal: { label: "Ideal", color: "bg-success/20 text-success border-success/30" },
    ok: { label: "OK", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    ignore: { label: "Ignorar", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  };

  return (
    <div className={cn(
      "bg-navy-light border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all group",
      profile.score === 'ideal' && "ring-1 ring-success/30"
    )}>
      {/* Header Info */}
      <div className="p-5 flex gap-4">
        <div className="relative">
          {profile.profilePictureUrl ? (
            <img 
              src={profile.profilePictureUrl} 
              alt={profile.username}
              className="w-16 h-16 rounded-full border-2 border-slate-800 object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border-2 border-slate-800">
              <User size={32} className="text-slate-600" />
            </div>
          )}
          <div className={cn(
            "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-navy flex items-center justify-center",
            profile.score === 'ideal' ? "bg-success" : profile.score === 'ok' ? "bg-yellow-500" : "bg-red-500"
          )}>
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-bold text-lg truncate text-white">@{profile.username}</h3>
            <span className={cn(
              "text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border",
              badges[profile.score].color
            )}>
              {badges[profile.score].label}
            </span>
          </div>
          <p className="text-sm text-slate-400 truncate">{profile.fullName || "Sem nome"}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 border-y border-slate-800 py-3 px-5 bg-slate-900/50">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Seguidores</span>
          <span className="text-sm font-bold text-slate-200">{profile.followersCount.toLocaleString()}</span>
        </div>
        <div className="flex flex-col border-l border-slate-800 pl-4">
          <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Posts</span>
          <span className="text-sm font-bold text-slate-200">{profile.mediaCount}</span>
        </div>
      </div>

      {/* Bio */}
      <div className="p-5 h-24 overflow-hidden">
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
          {profile.biography || "Sem biografia disponível."}
        </p>
      </div>

      {/* Actions */}
      <div className="p-4 pt-0 grid grid-cols-2 gap-3">
        <a 
          href={profile.profileUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl transition-colors"
        >
          <ExternalLink size={14} />
          Instagram
        </a>
        <button 
          onClick={() => onGenerateDM(profile)}
          className="flex items-center justify-center gap-2 py-2 px-3 bg-accent/10 hover:bg-accent/20 text-accent text-xs font-bold rounded-xl transition-colors"
        >
          <MessageSquare size={14} />
          Gerar DM
        </button>
        <button 
          onClick={() => onMarkAsSent(profile)}
          disabled={isSent}
          className={cn(
            "col-span-2 flex items-center justify-center gap-2 py-2 px-3 border text-xs font-bold rounded-xl transition-all",
            isSent 
              ? "bg-success/10 border-success/30 text-success cursor-default" 
              : "bg-transparent border-slate-700 hover:border-slate-500 text-slate-300"
          )}
        >
          <CheckCircle2 size={14} />
          {isSent ? "Enviada" : "Marcar como enviada"}
        </button>
      </div>
    </div>
  );
}
