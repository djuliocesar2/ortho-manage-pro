import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface InsurancePlan { id: string; name: string; provider: string; phone: string; }

export default function Insurance() {
  const [plans, setPlans] = useState<InsurancePlan[]>([]);
  const [form, setForm] = useState({ name: "", provider: "", phone: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    const { data } = await supabase.from("insurance_plans").select("*").order("name");
    setPlans(data || []);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    const payload = { name: form.name.trim(), provider: form.provider.trim(), phone: form.phone.trim() };

    if (editId) {
      await supabase.from("insurance_plans").update(payload).eq("id", editId);
      toast.success("Convênio atualizado");
    } else {
      await supabase.from("insurance_plans").insert(payload);
      toast.success("Convênio cadastrado");
    }
    setForm({ name: "", provider: "", phone: "" }); setEditId(null); setOpen(false); fetch();
  };

  const handleEdit = (p: InsurancePlan) => {
    setForm({ name: p.name, provider: p.provider || "", phone: p.phone || "" });
    setEditId(p.id); setOpen(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("insurance_plans").delete().eq("id", id);
    toast.success("Convênio excluído"); fetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Convênios</h1>
          <p className="text-sm text-muted-foreground mt-1">{plans.length} convênios cadastrados</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setForm({ name: "", provider: "", phone: "" }); setEditId(null); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Novo Convênio</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Editar Convênio" : "Novo Convênio"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="space-y-2"><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-2"><Label>Operadora</Label><Input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} /></div>
              <div className="space-y-2"><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <Button onClick={handleSave} className="w-full mt-2">{editId ? "Atualizar" : "Cadastrar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Nome</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Operadora</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Telefone</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Ações</th>
                </tr>
              </thead>
              <tbody>
                {plans.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-muted-foreground text-sm">Nenhum convênio cadastrado</td></tr>
                ) : plans.map((p) => (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium">{p.name}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{p.provider || "-"}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{p.phone || "-"}</td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
