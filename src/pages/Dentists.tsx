import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Dentist {
  id: string;
  name: string;
  specialty: string;
  phone: string;
  email: string;
}

const emptyForm = { name: "", specialty: "", phone: "", email: "" };

export default function Dentists() {
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    const { data } = await supabase.from("dentists").select("*").order("name");
    setDentists(data || []);
  };

  const handleSave = async () => {
    const payload = { name: form.name.trim(), specialty: form.specialty.trim(), phone: form.phone.trim(), email: form.email.trim() };
    if (!payload.name) { toast.error("Nome é obrigatório"); return; }

    if (editId) {
      const { error } = await supabase.from("dentists").update(payload).eq("id", editId);
      if (error) { toast.error("Erro ao atualizar"); return; }
      toast.success("Dentista atualizado");
    } else {
      const { error } = await supabase.from("dentists").insert(payload);
      if (error) { toast.error("Erro ao cadastrar"); return; }
      toast.success("Dentista cadastrado");
    }
    setForm(emptyForm); setEditId(null); setOpen(false); fetch();
  };

  const handleEdit = (d: Dentist) => {
    setForm({ name: d.name, specialty: d.specialty || "", phone: d.phone || "", email: d.email || "" });
    setEditId(d.id); setOpen(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("dentists").delete().eq("id", id);
    toast.success("Dentista excluído"); fetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dentistas</h1>
          <p className="text-sm text-muted-foreground mt-1">{dentists.length} dentistas cadastrados</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setForm(emptyForm); setEditId(null); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Novo Dentista</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Editar Dentista" : "Novo Dentista"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nome *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="space-y-2"><Label>Especialidade</Label><Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
                <div className="space-y-2"><Label>E-mail</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              </div>
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
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Especialidade</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Telefone</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">E-mail</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Ações</th>
                </tr>
              </thead>
              <tbody>
                {dentists.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">Nenhum dentista cadastrado</td></tr>
                ) : dentists.map((d) => (
                  <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium">{d.name}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{d.specialty || "-"}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{d.phone || "-"}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground">{d.email || "-"}</td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(d)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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
