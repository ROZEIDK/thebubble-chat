import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Palette, Check } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { PRESETS, buildCustomFromBase, ThemeId } from "@/lib/themes";
import { cn } from "@/lib/utils";

export default function ThemePicker() {
  const { theme, setPreset, setCustom } = useTheme();
  const [hex, setHex] = useState("#1f2937");

  const applyCustom = () => {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
    setCustom(buildCustomFromBase(hex));
  };

  return (
    <Card className="bg-surface border-border p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Palette className="h-5 w-5 text-muted-foreground" />
        <h2 className="font-semibold">Appearance</h2>
        <span className="text-xs text-muted-foreground ml-2">Saved on this device</span>
      </div>

      <div>
        <Label className="text-sm text-muted-foreground mb-3 block">Presets</Label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {PRESETS.map((p) => {
            const active = theme.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPreset(p.id as ThemeId)}
                className={cn(
                  "group rounded-lg border p-3 text-left transition-colors",
                  active ? "border-primary" : "border-border hover:border-muted-foreground/40"
                )}
              >
                <div
                  className="h-10 w-full rounded-md mb-2 border border-border"
                  style={{ background: p.swatch }}
                />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{p.label}</span>
                  {active && <Check className="h-4 w-4 text-primary" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border pt-5">
        <Label className="text-sm text-muted-foreground mb-3 block">Custom base color</Label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            className="h-10 w-12 rounded-md bg-transparent border border-border cursor-pointer"
            aria-label="Pick custom color"
          />
          <Input
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            maxLength={7}
            className="font-mono w-32"
          />
          <Button onClick={applyCustom} variant="secondary">Apply custom</Button>
          {theme.id === "custom" && (
            <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
              <Check className="h-3.5 w-3.5" /> Custom active
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          We'll generate a balanced palette around your color. Pick a light hex for a light theme.
        </p>
      </div>
    </Card>
  );
}
