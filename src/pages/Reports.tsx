import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Download } from "lucide-react";
import { format } from "date-fns";

interface ReportAppointment {
  id: string; date: string; time: string; status: string;
  patients: { name: string } | null;
  dentists: { name: string } | null;
}

export default function Reports() {
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-01"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [appointments, setAppointments] = useState<ReportAppointment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("appointments")
      .select("id, date, time, status, patients(name), dentists(name)")
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date")
      .order("time");
    setAppointments((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchReport(); }, []);

  const total = appointments.length;
  const completed = appointments.filter((a) => a.status === "completed").length;
  const cancelled = appointments.filter((a) => a.status === "cancelled").length;
  const scheduled = appointments.filter((a) => a.status === "scheduled").length;

  const statusLabel: Record<string, string> = { scheduled: "Agendada", completed: "Concluída", cancelled: "Cancelada" };
  const statusVariant = (s: string) => s === "completed" ? "default" : s === "cancelled" ? "destructive" : "secondary";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>

      <Card className="border-border shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Data Início</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-44" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Data Fim</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-44" />
            </div>
            <Button onClick={fetchReport} disabled={loading}>
              <BarChart3 className="w-4 h-4 mr-2" />Gerar Relatório
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: total, cls: "text-foreground" },
          { label: "Agendadas", value: scheduled, cls: "text-primary" },
          { label: "Concluídas", value: completed, cls: "text-success" },
          { label: "Canceladas", value: cancelled, cls: "text-destructive" },
        ].map((s) => (
          <Card key={s.label} className="border-border shadow-sm">
            <CardContent className="pt-6 text-center">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className={`text-3xl font-bold mt-1 ${s.cls}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader><CardTitle className="text-base">Consultas no Período</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Data</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Horário</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Paciente</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Dentista</th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground text-sm">Nenhuma consulta no período</td></tr>
                ) : appointments.map((a) => (
                  <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 text-sm">{a.date}</td>
                    <td className="py-3 px-4 text-sm">{a.time}</td>
                    <td className="py-3 px-4 text-sm">{(a.patients as any)?.name || "-"}</td>
                    <td className="py-3 px-4 text-sm">{(a.dentists as any)?.name || "-"}</td>
                    <td className="py-3 px-4"><Badge variant={statusVariant(a.status) as any}>{statusLabel[a.status] || a.status}</Badge></td>
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
