import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Patient { id: string; name: string; }
interface Record { id: string; patient_id: string; date: string; description: string; notes: string; dentist_name: string; }

export default function MedicalRecords() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [records, setRecords] = useState<Record[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ description: "", notes: "", date: format(new Date(), "yyyy-MM-dd"), dentist_name: "" });

  useEffect(() => { fetchPatients(); }, []);
  useEffect(() => { if (selectedPatient) fetchRecords(); }, [selectedPatient]);

  const fetchPatients = async () => {
    const { data } = await supabase.from("patients").select("id, name").order("name");
    setPatients(data || []);
  };

  const fetchRecords = async () => {
    const { data } = await supabase.from("medical_records").select("*").eq("patient_id", selectedPatient).order("date", { ascending: false });
    setRecords(data || []);
  };

  const handleSave = async () => {
    if (!form.description.trim()) { toast.error("Descrição é obrigatória"); return; }
    const { error } = await supabase.from("medical_records").insert({
      patient_id: selectedPatient,
      description: form.description.trim(),
      notes: form.notes.trim(),
      date: form.date,
      dentist_name: form.dentist_name.trim(),
    });
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Registro salvo");
    setForm({ description: "", notes: "", date: format(new Date(), "yyyy-MM-dd"), dentist_name: "" });
    setOpen(false);
    fetchRecords();
  };

  const filteredPatients = patients.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Prontuário</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-border shadow-sm">
          <CardHeader><CardTitle className="text-base">Pacientes</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <div className="max-h-96 overflow-y-auto space-y-1">
              {filteredPatients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPatient(p.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedPatient === p.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-foreground"}`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          {selectedPatient ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {patients.find((p) => p.id === selectedPatient)?.name}
                </h2>
                <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" />Novo Registro</Button>
              </div>

              {records.length === 0 ? (
                <Card className="border-border shadow-sm">
                  <CardContent className="py-12 text-center text-muted-foreground text-sm">
                    <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    Nenhum registro encontrado
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {records.map((r) => (
                    <Card key={r.id} className="border-border shadow-sm">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-muted-foreground">{r.date}</span>
                          {r.dentist_name && <span className="text-xs text-primary">{r.dentist_name}</span>}
                        </div>
                        <p className="text-sm font-medium mb-1">{r.description}</p>
                        {r.notes && <p className="text-sm text-muted-foreground">{r.notes}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                  <DialogHeader><DialogTitle>Novo Registro Clínico</DialogTitle></DialogHeader>
                  <div className="grid gap-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Data</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                      <div className="space-y-2"><Label>Dentista</Label><Input value={form.dentist_name} onChange={(e) => setForm({ ...form, dentist_name: e.target.value })} /></div>
                    </div>
                    <div className="space-y-2"><Label>Descrição *</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
                    <div className="space-y-2"><Label>Observações</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={4} /></div>
                    <Button onClick={handleSave} className="w-full mt-2">Salvar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <Card className="border-border shadow-sm">
              <CardContent className="py-16 text-center text-muted-foreground text-sm">
                Selecione um paciente para visualizar o prontuário
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
