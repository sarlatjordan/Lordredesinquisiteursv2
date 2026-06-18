"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  User,
  Shield,
  Rocket,
  Lock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  ExternalLink,
  ChevronRight,
  Eye as EyeIcon,
  Scroll,
  Download,
  CalendarDays,
  Copy,
  Check as CheckIcon,
  Link2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { updateProfile, submitAvatarForApproval, uploadAvatarFile } from "@/actions/members";
import { requestDataExport } from "@/actions/rgpd";
import { createClient } from "@/lib/supabase/client";
import { ROLES, ROLE_COLORS, type Role } from "@/lib/constants";
import { getInitials, formatDate } from "@/lib/utils";
import type { Profile } from "@/types";

interface ProfilClientProps {
  profile: Profile | null;
  email: string;
  activeEvaluation: {
    id: string;
    status: "pending" | "in_progress";
    instructions: string | null;
    created_at: string;
  } | null;
  icsParams: { uid: string; token: string } | null;
  appOrigin: string;
}

type SaveStatus = "idle" | "saving" | "success" | "error";

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-border bg-card p-6 space-y-5"
    >
      <div className="flex items-center gap-2">
        <div className="text-primary">{icon}</div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <Separator className="bg-border" />
      {children}
    </motion.div>
  );
}

// ─── Feedback inline ──────────────────────────────────────────────────────────

function Feedback({ status, error }: { status: SaveStatus; error?: string }) {
  if (status === "idle") return null;
  if (status === "saving")
    return (
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Enregistrement…
      </p>
    );
  if (status === "success")
    return (
      <p className="flex items-center gap-1.5 text-xs text-green-400">
        <CheckCircle className="h-3.5 w-3.5" /> Sauvegardé
      </p>
    );
  return (
    <p className="flex items-center gap-1.5 text-xs text-destructive">
      <AlertCircle className="h-3.5 w-3.5" /> {error ?? "Erreur"}
    </p>
  );
}


// ─── Section identité ─────────────────────────────────────────────────────────

function SectionIdentite({
  profile,
  onSaved,
}: {
  profile: Profile | null;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarStatus, setAvatarStatus] = useState<SaveStatus>("idle");
  const [avatarError, setAvatarError] = useState("");
  const [isPendingAvatar, startAvatarTransition] = useTransition();
  const [avatarTab, setAvatarTab] = useState<"file" | "url">("file");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { handleSubmit, watch, setValue, register } = useForm({
    defaultValues: {
      display_name: profile?.display_name ?? "",
      bio: profile?.bio ?? "",
    },
  });
  const bioValue = watch("bio");

  function onSubmit(data: { display_name: string; bio: string }) {
    setStatus("saving");
    startTransition(async () => {
      const res = await updateProfile({
        display_name: data.display_name || undefined,
        bio: data.bio || undefined,
      });
      if (res.success) {
        setStatus("success");
        onSaved();
      } else {
        setStatus("error");
        setError(res.error);
      }
    });
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarStatus("saving");
    setAvatarError("");
    startAvatarTransition(async () => {
      const fd = new FormData();
      fd.append("avatar", file);
      const res = await uploadAvatarFile(fd);
      if (res.success) {
        setAvatarStatus("success");
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setAvatarStatus("error");
        setAvatarError(res.error);
      }
    });
  }

  function handleAvatarSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAvatarStatus("saving");
    setAvatarError("");
    startAvatarTransition(async () => {
      const res = await submitAvatarForApproval({ url: avatarUrl.trim() });
      if (res.success) {
        setAvatarStatus("success");
        setAvatarUrl("");
      } else {
        setAvatarStatus("error");
        setAvatarError(res.error);
      }
    });
  }

  const hasPending = !!profile?.avatar_pending_url;

  return (
    <Section icon={<User className="h-4 w-4" />} title="Identité">
      {/* Avatar + infos readonly */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 border-2 border-border">
          <AvatarImage src={profile?.avatar_url ?? undefined} />
          <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
            {getInitials(profile?.display_name ?? profile?.username ?? "IN")}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-foreground">
            {profile?.display_name ?? profile?.username}
          </p>
          <p className="text-sm text-muted-foreground">@{profile?.username}</p>
          <Badge
            variant="outline"
            className={`mt-1 text-[10px] px-1.5 capitalize ${ROLE_COLORS[profile?.role ?? "visiteur"]}`}
          >
            <Shield className="h-2.5 w-2.5 mr-1" />
            {ROLES[profile?.role ?? "visiteur"]}
          </Badge>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="display_name">Nom affiché</Label>
          <Input
            id="display_name"
            placeholder="Grand Inquisiteur"
            {...register("display_name")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="username">Nom d&apos;utilisateur</Label>
          <Input
            id="username"
            value={profile?.username ?? ""}
            disabled
            className="opacity-50"
          />
          <p className="text-[11px] text-muted-foreground">Non modifiable</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bio">Bio</Label>
          <MarkdownEditor
            id="bio"
            value={bioValue}
            onChange={(v) => setValue("bio", v)}
            placeholder="Quelques mots sur toi… (markdown supporté)"
            rows={4}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" disabled={isPending}>
            Sauvegarder
          </Button>
          <Feedback status={status} error={error} />
        </div>
      </form>

      {/* Photo de profil en attente de validation (FEAT-20) */}
      <div className="border-t border-border pt-4 space-y-3">
        <p className="text-sm font-medium text-foreground">Photo de profil</p>
        {hasPending ? (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2.5 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profile.avatar_pending_url!}
              alt="Aperçu en attente"
              className="h-10 w-10 rounded-full object-cover border border-border shrink-0"
            />
            <div>
              <p className="text-xs font-medium text-amber-400">
                Photo en cours de validation
              </p>
              <p className="text-[11px] text-muted-foreground">
                Le Conseil examinera votre photo prochainement.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Tabs */}
            <div className="flex gap-1 p-0.5 rounded-md bg-muted w-fit">
              {(["file", "url"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => { setAvatarTab(tab); setAvatarStatus("idle"); setAvatarError(""); }}
                  className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                    avatarTab === tab
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "file" ? "Depuis mon PC" : "Depuis une URL"}
                </button>
              ))}
            </div>

            {avatarTab === "file" ? (
              <div className="space-y-2">
                <p className="text-[11px] text-muted-foreground">
                  JPG, PNG ou WebP — 2 Mo max. La photo sera soumise au Conseil pour validation.
                </p>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={isPendingAvatar}
                    onChange={handleFileUpload}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={isPendingAvatar}
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-1.5"
                  >
                    {isPendingAvatar ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Upload className="h-3.5 w-3.5" />
                    )}
                    Choisir un fichier
                  </Button>
                </label>
              </div>
            ) : (
              <form onSubmit={handleAvatarSubmit} className="space-y-2">
                <p className="text-[11px] text-muted-foreground">
                  Soumettez une URL d&apos;image pour validation par le Conseil
                  (formats : JPG, PNG, WebP).
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://..."
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    disabled={isPendingAvatar}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isPendingAvatar || !avatarUrl.trim()}
                    className="shrink-0"
                  >
                    {isPendingAvatar && (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    )}
                    Soumettre
                  </Button>
                </div>
              </form>
            )}

            {avatarStatus === "success" && (
              <p className="flex items-center gap-1.5 text-xs text-green-400">
                <CheckCircle className="h-3.5 w-3.5" /> Photo soumise — en attente de validation
              </p>
            )}
            {avatarStatus === "error" && (
              <p className="flex items-center gap-1.5 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5" /> {avatarError}
              </p>
            )}
          </div>
        )}
      </div>
    </Section>
  );
}

// ─── Section Star Citizen ─────────────────────────────────────────────────────

function SectionStarCitizen({
  profile,
  onSaved,
}: {
  profile: Profile | null;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const { register, handleSubmit, watch } = useForm({
    defaultValues: { star_citizen_handle: profile?.star_citizen_handle ?? "" },
  });

  const handle = watch("star_citizen_handle");

  function onSubmit(data: { star_citizen_handle: string }) {
    setStatus("saving");
    startTransition(async () => {
      const res = await updateProfile({
        star_citizen_handle: data.star_citizen_handle || undefined,
      });
      if (res.success) {
        setStatus("success");
        onSaved();
      } else {
        setStatus("error");
        setError(res.error);
      }
    });
  }

  return (
    <Section icon={<Rocket className="h-4 w-4" />} title="Star Citizen">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="sc_handle">Handle RSI</Label>
          <div className="flex gap-2">
            <Input
              id="sc_handle"
              placeholder="TonHandleRSI"
              {...register("star_citizen_handle")}
            />
            {handle && (
              <a
                href={`https://robertsspaceindustries.com/citizens/${handle}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" disabled={isPending}>
            Sauvegarder
          </Button>
          <Feedback status={status} error={error} />
        </div>
      </form>
    </Section>
  );
}

// ─── Section progression ──────────────────────────────────────────────────────

const EVAL_STATUS_LABELS: Record<"pending" | "in_progress", string> = {
  pending: "Épreuve assignée",
  in_progress: "Épreuve en cours",
};

function SectionProgression({
  profile,
  activeEvaluation,
}: {
  profile: Profile | null;
  activeEvaluation: {
    id: string;
    status: "pending" | "in_progress";
    instructions: string | null;
    created_at: string;
  } | null;
}) {
  const role = profile?.role as Role | undefined;
  if (!role || role === "visiteur") return null;

  const isSage = role === "sage";

  return (
    <Section
      icon={<ChevronRight className="h-4 w-4" />}
      title="Progression de rang"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground shrink-0">
            Rang actuel
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${ROLE_COLORS[role]}`}
          >
            <Shield className="h-3 w-3" />
            {ROLES[role]}
          </span>
        </div>

        {isSage ? (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 space-y-1">
            <p className="text-sm font-semibold text-amber-400">
              Rang suprême atteint
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Tu as atteint le rang suprême de l&apos;Ordre. Le Conseil des
              Sages guide l&apos;organisation dans ses décisions les plus
              importantes.
            </p>
          </div>
        ) : activeEvaluation ? (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Scroll className="h-4 w-4 text-primary shrink-0" />
              <p className="text-sm font-semibold text-foreground">
                {EVAL_STATUS_LABELS[activeEvaluation.status]}
              </p>
              <span className="text-xs text-muted-foreground">
                depuis le {formatDate(activeEvaluation.created_at)}
              </span>
            </div>
            {activeEvaluation.instructions && (
              <div className="rounded-md border border-border bg-background/50 px-3 py-2.5">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
                  Ce que l&apos;on attend de toi
                </p>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {activeEvaluation.instructions}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <div className="flex items-start gap-2">
              <EyeIcon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Le Conseil porte un regard attentif à ton activité.
                Lorsqu&apos;il jugera que tu mérites de participer aux épreuves
                de réévaluation de rang, tu en seras informé et la progression
                de ton épreuve s&apos;affichera ici.
              </p>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

// ─── Section MFA ─────────────────────────────────────────────────────────────

type MFAStatus = "loading" | "not_enrolled" | "enrolling" | "enrolled";

function SectionMFA() {
  const [status, setStatus] = useState<MFAStatus>("loading");
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    void loadStatus();
  }, []);

  async function loadStatus() {
    const supabase = createClient();
    const { data } = await supabase.auth.mfa.listFactors();
    const verified = data?.totp?.find((f) => f.status === "verified");
    // `all` contient aussi les facteurs non-vérifiés que `totp` n'expose pas
    const unverified = data?.all?.find(
      (f) => f.factor_type === "totp" && f.status === "unverified",
    );
    if (verified) {
      setFactorId(verified.id);
      setStatus("enrolled");
    } else {
      // Nettoie un éventuel enrôlement incomplet
      if (unverified)
        await supabase.auth.mfa.unenroll({ factorId: unverified.id });
      setStatus("not_enrolled");
    }
  }

  async function startEnroll() {
    setIsPending(true);
    setError("");
    const supabase = createClient();
    const { data, error: enrollErr } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "INQFR",
    });
    if (enrollErr || !data) {
      setError(enrollErr?.message ?? "Erreur lors de l'initialisation");
      setIsPending(false);
      return;
    }
    setFactorId(data.id);
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setStatus("enrolling");
    setIsPending(false);
  }

  async function verifyEnroll() {
    if (code.length !== 6) {
      setError("Code à 6 chiffres requis");
      return;
    }
    setIsPending(true);
    setError("");
    const supabase = createClient();
    const { data: challenge, error: challengeErr } =
      await supabase.auth.mfa.challenge({ factorId });
    if (challengeErr || !challenge) {
      setError(challengeErr?.message ?? "Erreur challenge");
      setIsPending(false);
      return;
    }
    const { error: verifyErr } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code,
    });
    if (verifyErr) {
      setError("Code incorrect ou expiré");
      setIsPending(false);
      return;
    }
    setCode("");
    setStatus("enrolled");
    setIsPending(false);
  }

  async function cancelEnroll() {
    setIsPending(true);
    const supabase = createClient();
    if (factorId) await supabase.auth.mfa.unenroll({ factorId });
    setFactorId("");
    setQrCode("");
    setSecret("");
    setCode("");
    setError("");
    setStatus("not_enrolled");
    setIsPending(false);
  }

  async function unenroll() {
    setIsPending(true);
    setError("");
    const supabase = createClient();
    const { error: unenrollErr } = await supabase.auth.mfa.unenroll({
      factorId,
    });
    if (unenrollErr) {
      setError(unenrollErr.message);
      setIsPending(false);
      return;
    }
    setFactorId("");
    setStatus("not_enrolled");
    setIsPending(false);
  }

  return (
    <Section
      icon={<Shield className="h-4 w-4" />}
      title="Double authentification (MFA)"
    >
      {status === "loading" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </div>
      )}

      {status === "not_enrolled" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Protège ton compte avec une application d&apos;authentification
            (Google Authenticator, Authy…). Un code à 6 chiffres sera demandé à
            chaque connexion.
          </p>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button
            size="sm"
            onClick={startEnroll}
            disabled={isPending}
            className="gap-2"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Shield className="h-4 w-4" />
            )}
            Activer la 2FA
          </Button>
        </div>
      )}

      {status === "enrolling" && (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Scanne ce QR code avec{" "}
            <strong className="text-foreground">Google Authenticator</strong> ou{" "}
            <strong className="text-foreground">Authy</strong>, puis saisis le
            code généré.
          </p>

          {/* QR code — Supabase retourne un SVG en data URI */}
          <div className="flex justify-center">
            <div className="rounded-xl border border-border bg-white p-3 w-44 h-44">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCode} alt="QR code 2FA" className="w-full h-full" />
            </div>
          </div>

          <details className="text-xs text-muted-foreground cursor-pointer">
            <summary className="hover:text-foreground transition-colors select-none">
              Entrer la clé manuellement
            </summary>
            <code className="mt-2 block font-mono text-xs text-foreground select-all break-all bg-muted/50 rounded p-2">
              {secret}
            </code>
          </details>

          <div className="space-y-1.5">
            <Label htmlFor="mfa-code-enroll">Code de vérification</Label>
            <div className="flex gap-2">
              <Input
                id="mfa-code-enroll"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, ""));
                  setError("");
                }}
                onKeyDown={(e) => e.key === "Enter" && verifyEnroll()}
                className="font-mono text-center text-lg tracking-widest w-36"
                autoFocus
              />
              <Button
                onClick={verifyEnroll}
                disabled={isPending || code.length !== 6}
                size="sm"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Vérifier"
                )}
              </Button>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <button
            type="button"
            onClick={cancelEnroll}
            disabled={isPending}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Annuler
          </button>
        </div>
      )}

      {status === "enrolled" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="h-4 w-4" />
            <p className="text-sm font-medium">
              Double authentification activée
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Un code TOTP est demandé à chaque connexion par email/mot de passe.
          </p>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button
            variant="outline"
            size="sm"
            onClick={unenroll}
            disabled={isPending}
            className="gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Désactiver la 2FA
          </Button>
        </div>
      )}
    </Section>
  );
}

// ─── Section abonnement calendrier ───────────────────────────────────────────

function SectionCalendrier({
  icsParams,
  appOrigin,
}: {
  icsParams: { uid: string; token: string };
  appOrigin: string;
}) {
  const [copied, setCopied] = useState(false);

  const icsPath = `/api/calendrier/ics?uid=${icsParams.uid}&token=${icsParams.token}`;
  const icsUrl = `${appOrigin}${icsPath}`;
  const webcalUrl = icsUrl.replace(/^https?:\/\//, "webcal://");
  const googleUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}`;

  async function copyUrl() {
    await navigator.clipboard.writeText(icsUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Section
      icon={<CalendarDays className="h-4 w-4" />}
      title="Abonnement calendrier"
    >
      <p className="text-sm text-muted-foreground leading-relaxed">
        Abonne-toi à ton calendrier personnalisé pour recevoir les événements
        INQFR directement dans Google Agenda, Apple Calendar ou tout autre
        client compatible.
      </p>
      <div className="flex items-center gap-2 p-2.5 rounded-md bg-muted/50 border border-border">
        <code className="flex-1 text-[11px] text-muted-foreground truncate select-all font-mono">
          {icsUrl}
        </code>
        <button
          type="button"
          onClick={copyUrl}
          aria-label="Copier l'URL"
          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
        >
          {copied ? (
            <CheckIcon className="h-4 w-4 text-green-400" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Ajouter à Google Agenda
        </a>
        <a
          href={webcalUrl}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:underline"
        >
          <CalendarDays className="h-3.5 w-3.5" />
          Ouvrir dans Apple Calendar / Thunderbird
        </a>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Cette URL est personnelle — ne la partagez pas. Les événements affichés
        correspondent à votre rang actuel.
      </p>
    </Section>
  );
}

// ─── Section données personnelles (RGPD) ─────────────────────────────────────

function SectionDonnees() {
  const [sent, setSent]               = useState(false);
  const [error, setError]             = useState("");
  const [isPending, startTransition]  = useTransition();
  const router = useRouter();

  function handleRequest() {
    setError("");
    startTransition(async () => {
      const res = await requestDataExport();
      if (!res.success) { setError(res.error ?? "Erreur"); return; }
      setSent(true);
      router.refresh();
    });
  }

  return (
    <Section icon={<Download className="h-4 w-4" />} title="Mes données">
      <p className="text-sm text-muted-foreground leading-relaxed">
        Conformément au RGPD, vous pouvez demander une copie de vos données
        personnelles. Le Conseil traitera votre demande et vous contactera.
      </p>
      {sent ? (
        <p className="flex items-center gap-1.5 text-sm text-green-400">
          <CheckCircle className="h-4 w-4" /> Demande transmise au Conseil.
        </p>
      ) : (
        <>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleRequest}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Demander mes données (RGPD)
          </Button>
          {error && (
            <p className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5" /> {error}
            </p>
          )}
        </>
      )}
    </Section>
  );
}

// ─── Section comptes liés (OAuth) ────────────────────────────────────────────

type UserIdentity = {
  id: string;
  provider: string;
  identity_data?: { email?: string; name?: string; full_name?: string };
};

const OAUTH_PROVIDERS: {
  key: "google" | "discord";
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "google",
    label: "Google",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
    ),
  },
  {
    key: "discord",
    label: "Discord",
    icon: (
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4 shrink-0"
        aria-hidden="true"
        fill="#5865F2"
      >
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.055a19.9 19.9 0 0 0 5.993 3.03.077.077 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
      </svg>
    ),
  },
];

function SectionComptes() {
  const [identities, setIdentities] = useState<UserIdentity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  useEffect(() => {
    void loadIdentities();
  }, []);

  async function loadIdentities() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setIdentities((user?.identities ?? []) as UserIdentity[]);
    setLoading(false);
  }

  async function handleLink(provider: "google" | "discord") {
    setPending(`link-${provider}`);
    setError("");
    const supabase = createClient();
    const { error: linkErr } = await supabase.auth.linkIdentity({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/profil")}`,
      },
    });
    if (linkErr) {
      setError(linkErr.message);
      setPending(null);
    }
    // Sinon le navigateur redirige vers le provider OAuth
  }

  async function handleUnlink(identityId: string) {
    if (identities.length <= 1) {
      setError("Impossible de délier le seul mode de connexion actif.");
      return;
    }
    setPending(`unlink-${identityId}`);
    setError("");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const fullIdentity = user?.identities?.find((i) => i.id === identityId);
    if (!fullIdentity) {
      setPending(null);
      return;
    }
    const { error: unlinkErr } =
      await supabase.auth.unlinkIdentity(fullIdentity);
    if (unlinkErr) {
      setError(unlinkErr.message);
    } else {
      setIdentities((prev) => prev.filter((i) => i.id !== identityId));
    }
    setPending(null);
  }

  if (loading) {
    return (
      <Section icon={<Link2 className="h-4 w-4" />} title="Comptes liés">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
        </div>
      </Section>
    );
  }

  return (
    <Section icon={<Link2 className="h-4 w-4" />} title="Comptes liés">
      <p className="text-sm text-muted-foreground">
        Lier un compte Google ou Discord te permet de te connecter sans mot de
        passe.
      </p>
      <div className="space-y-3">
        {OAUTH_PROVIDERS.map(({ key, label, icon }) => {
          const identity = identities.find((i) => i.provider === key);
          const isLinked = !!identity;
          const isPendingLink = pending === `link-${key}`;
          const isPendingUnlink = pending === `unlink-${identity?.id}`;
          const displayLabel =
            identity?.identity_data?.email ??
            identity?.identity_data?.name ??
            "";

          return (
            <div
              key={key}
              className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/20 px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                {icon}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {isLinked ? displayLabel || "Lié" : "Non lié"}
                  </p>
                </div>
              </div>
              {isLinked ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnlink(identity.id)}
                  disabled={!!pending}
                  className="shrink-0 text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  {isPendingUnlink && (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  )}
                  Délier
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLink(key)}
                  disabled={!!pending}
                  className="shrink-0"
                >
                  {isPendingLink && (
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  )}
                  Lier
                </Button>
              )}
            </div>
          );
        })}
      </div>
      {error && (
        <p className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5" /> {error}
        </p>
      )}
    </Section>
  );
}

// ─── Section sécurité (mot de passe) ─────────────────────────────────────────

interface PasswordFormValues {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

function SectionSecurite({ email }: { email: string }) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [error, setError] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setError: setFormError,
  } = useForm<PasswordFormValues>();

  function onSubmit(data: PasswordFormValues) {
    if (data.new_password !== data.confirm_password) {
      setFormError("confirm_password", {
        message: "Les mots de passe ne correspondent pas",
      });
      return;
    }

    setStatus("saving");
    startTransition(async () => {
      const supabase = createClient();
      const { error: verifyErr } = await supabase.auth.signInWithPassword({
        email,
        password: data.current_password,
      });
      if (verifyErr) {
        setStatus("error");
        setFormError("current_password", {
          message: "Mot de passe actuel incorrect",
        });
        setError("");
        return;
      }

      const { error: updateErr } = await supabase.auth.updateUser({
        password: data.new_password,
      });
      if (updateErr) {
        setStatus("error");
        setError(updateErr.message);
      } else {
        setStatus("success");
        reset();
      }
    });
  }

  return (
    <Section icon={<Lock className="h-4 w-4" />} title="Sécurité">
      <div className="space-y-1.5">
        <Label>Email</Label>
        <Input value={email} disabled className="opacity-50" />
        <p className="text-[11px] text-muted-foreground">Non modifiable</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="current_password">Mot de passe actuel</Label>
          <div className="relative">
            <Input
              id="current_password"
              type={showCurrent ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="current-password"
              className="pr-9"
              {...register("current_password", { required: "Requis" })}
            />
            <button
              type="button"
              onClick={() => setShowCurrent((v) => !v)}
              aria-label={
                showCurrent
                  ? "Masquer le mot de passe actuel"
                  : "Afficher le mot de passe actuel"
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              {showCurrent ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.current_password && (
            <p className="text-xs text-destructive">
              {errors.current_password.message}
            </p>
          )}
        </div>

        <div className="border-t border-border pt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="new_password">Nouveau mot de passe</Label>
            <div className="relative">
              <Input
                id="new_password"
                type={showNew ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                className="pr-9"
                {...register("new_password", {
                  required: "Requis",
                  minLength: { value: 8, message: "Minimum 8 caractères" },
                })}
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                aria-label={
                  showNew
                    ? "Masquer le nouveau mot de passe"
                    : "Afficher le nouveau mot de passe"
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                {showNew ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.new_password && (
              <p className="text-xs text-destructive">
                {errors.new_password.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm_password">Confirmer le mot de passe</Label>
            <div className="relative">
              <Input
                id="confirm_password"
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                className="pr-9"
                {...register("confirm_password", { required: "Requis" })}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={
                  showConfirm
                    ? "Masquer la confirmation"
                    : "Afficher la confirmation"
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                {showConfirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.confirm_password && (
              <p className="text-xs text-destructive">
                {errors.confirm_password.message}
              </p>
            )}
          </div>
        </div>

        {status === "error" && error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2">
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" size="sm" disabled={isPending}>
            Changer le mot de passe
          </Button>
          {status !== "error" && <Feedback status={status} error={error} />}
        </div>
      </form>
    </Section>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export function ProfilClient({
  profile,
  email,
  activeEvaluation,
  icsParams,
  appOrigin,
}: ProfilClientProps) {
  const router = useRouter();

  function handleSaved() {
    router.refresh();
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Mon profil</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Gérez vos informations personnelles et vos paramètres de sécurité.
        </p>
      </div>

      <SectionIdentite profile={profile} onSaved={handleSaved} />
      <SectionProgression
        profile={profile}
        activeEvaluation={activeEvaluation}
      />
      <SectionStarCitizen profile={profile} onSaved={handleSaved} />
      <SectionSecurite email={email} />
      <SectionMFA />
      <SectionComptes />
      {icsParams && (
        <SectionCalendrier icsParams={icsParams} appOrigin={appOrigin} />
      )}
      <SectionDonnees />
    </div>
  );
}
