import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Patient {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  email: string;
  birth_date: string;
  insurance_plan_id: string | null;
}

interface InsurancePlan {
  id: string;
  name: string;
}

const emptyPatient = { name: "", cpf: "", phone: "", email: "", birth_date: "", insurance_plan_id: "" };

export default function Patients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(emptyPatient);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [plans, setPlans] = useState<InsurancePlan[]>([]);

  useEffect(() => {
    fetchPatients();
    fetchPlans();
  }, []);

  const fetchPatients = async () => {
    const { data } = await supabase.from("patients").select("*").order("name");
    setPatients(data || []);
  };

  const fetchPlans = async () => {
    const { data } = await supabase.from("insurance_plans").select("id, name");
    setPlans(data || []);
  };

  const handleSave = async () => {
    const payload = {
      name: form.name.trim(),
      cpf: form.cpf.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      birth_date: form.birth_date || null,
      insurance_plan_id: form.insurance_plan_id || null,
    };

    if (!payload.name) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (editId) {
      const { error } = await supabase.from("patients").update(payload).eq("id", editId);
      if (error) { toast.error("Erro ao atualizar"); return; }
      toast.success("Paciente atualizado");
    } else {
      const { error } = await supabase.from("patients").insert(payload);
      if (error) { toast.error("Erro ao cadastrar"); return; }
      toast.success("Paciente cadastrado");
    }

    setForm(emptyPatient);
    setEditId(null);
    setOpen(false);
    fetchPatients();
  };

  const handleEdit = (p: Patient) => {
    setForm({
      name: p.name,
      cpf: p.cpf || "",
      phone: p.phone || "",
      email: p.email || "",
      birth_date: p.birth_date || "",
      insurance_plan_id: p.insurance_plan_id || "",
    });
    setEditId(p.id);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("patients").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Paciente excluído");
    fetchPatients();
  };

  const filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pacientes</h1>
          <p className="text-sm text-muted-foreground mt-1">{patients.length} pacientes cadastrados</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setForm(emptyPatient); setEditId(null); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Novo Paciente</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editId ? "Editar Paciente" : "Novo Paciente"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>CPF</Label>
                  <Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de Nascimento</Label>
                  <Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Convênio</Label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={form.insurance_plan_id}
                    onChange={(e) => setForm({ ...form, insurance_plan_id: e.target.value })}
                  >
                    <option value="">Nenhum</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <Button onClick={handleSave} className="w-full mt-2">
                {editId ? "Atualizar" : "Cadastrar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Nome</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">CPF</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Telefone</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">E-mail</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">Nenhum paciente encontrado</td></tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4 text-sm font-medium">{p.name}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{p.cpf || "-"}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{p.phone || "-"}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{p.email || "-"}</td>
                      <td className="py-3 px-4 text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
