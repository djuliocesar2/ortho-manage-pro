import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Patient { id: string; name: string; }
interface Dentist { id: string; name: string; }
interface Appointment {
  id: string; date: string; time: string; status: string;
  patient_id: string; dentist_id: string;
  patients: { name: string } | null;
  dentists: { name: string } | null;
}

const emptyForm = { patient_id: "", dentist_id: "", date: "", time: "", status: "scheduled" };

export default function Agenda() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [filterDate, setFilterDate] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    fetchAll();
  }, [filterDate]);

  const fetchAll = async () => {
    const [appts, pats, dents] = await Promise.all([
      supabase.from("appointments").select("*, patients(name), dentists(name)").eq("date", filterDate).order("time"),
      supabase.from("patients").select("id, name").order("name"),
      supabase.from("dentists").select("id, name").order("name"),
    ]);
    setAppointments((appts.data as any[]) || []);
    setPatients(pats.data || []);
    setDentists(dents.data || []);
  };

  const handleSave = async () => {
    if (!form.patient_id || !form.dentist_id || !form.date || !form.time) {
      toast.error("Preencha todos os campos obrigatórios"); return;
    }
    const payload = { patient_id: form.patient_id, dentist_id: form.dentist_id, date: form.date, time: form.time, status: form.status };

    if (editId) {
      const { error } = await supabase.from("appointments").update(payload).eq("id", editId);
      if (error) { toast.error("Erro ao atualizar"); return; }
      toast.success("Consulta atualizada");
    } else {
      const { error } = await supabase.from("appointments").insert(payload);
      if (error) { toast.error("Erro ao agendar"); return; }
      toast.success("Consulta agendada");
    }
    setForm(emptyForm); setEditId(null); setOpen(false); fetchAll();
  };

  const handleEdit = (a: Appointment) => {
    setForm({ patient_id: a.patient_id, dentist_id: a.dentist_id, date: a.date, time: a.time, status: a.status });
    setEditId(a.id); setOpen(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("appointments").delete().eq("id", id);
    toast.success("Consulta excluída"); fetchAll();
  };

  const statusLabel: Record<string, string> = { scheduled: "Agendada", completed: "Concluída", cancelled: "Cancelada" };
  const statusVariant = (s: string) => s === "completed" ? "default" : s === "cancelled" ? "destructive" : "secondary";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerenciamento de consultas</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setForm(emptyForm); setEditId(null); } }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Nova Consulta</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Editar Consulta" : "Nova Consulta"}</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="space-y-2">
                <Label>Paciente *</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.patient_id} onChange={(e) => setForm({ ...form, patient_id: e.target.value })}>
                  <option value="">Selecione...</option>
                  {patients.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Dentista *</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.dentist_id} onChange={(e) => setForm({ ...form, dentist_id: e.target.value })}>
                  <option value="">Selecione...</option>
                  {dentists.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Data *</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                <div className="space-y-2"><Label>Horário *</Label><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="scheduled">Agendada</option>
                  <option value="completed">Concluída</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>
              <Button onClick={handleSave} className="w-full mt-2">{editId ? "Atualizar" : "Agendar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3">
        <Label className="text-sm">Data:</Label>
        <Input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="w-48" />
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Horário</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Paciente</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Dentista</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Ações</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">Nenhuma consulta para esta data</td></tr>
                ) : appointments.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium">{a.time}</td>
                    <td className="py-3 px-4 text-sm">{(a.patients as any)?.name || "-"}</td>
                    <td className="py-3 px-4 text-sm">{(a.dentists as any)?.name || "-"}</td>
                    <td className="py-3 px-4"><Badge variant={statusVariant(a.status) as any}>{statusLabel[a.status] || a.status}</Badge></td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(a)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
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
