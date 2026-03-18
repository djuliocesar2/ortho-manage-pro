import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CalendarDays, Stethoscope, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

interface StatsData {
  totalPatients: number;
  todayAppointments: number;
  totalDentists: number;
  completedToday: number;
}

interface Appointment {
  id: string;
  date: string;
  time: string;
  status: string;
  patients: { name: string } | null;
  dentists: { name: string } | null;
}

export default function Dashboard() {
  const [stats, setStats] = useState<StatsData>({
    totalPatients: 0,
    todayAppointments: 0,
    totalDentists: 0,
    completedToday: 0,
  });
  const [todayAppts, setTodayAppts] = useState<Appointment[]>([]);

  useEffect(() => {
    fetchStats();
    fetchTodayAppointments();
  }, []);

  const fetchStats = async () => {
    const today = format(new Date(), "yyyy-MM-dd");

    const [patients, dentists, todayAppts, completed] = await Promise.all([
      supabase.from("patients").select("id", { count: "exact", head: true }),
      supabase.from("dentists").select("id", { count: "exact", head: true }),
      supabase.from("appointments").select("id", { count: "exact", head: true }).eq("date", today),
      supabase.from("appointments").select("id", { count: "exact", head: true }).eq("date", today).eq("status", "completed"),
    ]);

    setStats({
      totalPatients: patients.count || 0,
      todayAppointments: todayAppts.count || 0,
      totalDentists: dentists.count || 0,
      completedToday: completed.count || 0,
    });
  };

  const fetchTodayAppointments = async () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const { data } = await supabase
      .from("appointments")
      .select("id, date, time, status, patients(name), dentists(name)")
      .eq("date", today)
      .order("time");
    setTodayAppts((data as any[]) || []);
  };

  const statusLabel: Record<string, string> = {
    scheduled: "Agendada",
    completed: "Concluída",
    cancelled: "Cancelada",
  };

  const statusVariant = (s: string) => {
    if (s === "completed") return "default";
    if (s === "cancelled") return "destructive";
    return "secondary";
  };

  const statCards = [
    { label: "Pacientes", value: stats.totalPatients, icon: Users, color: "text-primary" },
    { label: "Consultas Hoje", value: stats.todayAppointments, icon: CalendarDays, color: "text-accent" },
    { label: "Dentistas", value: stats.totalDentists, icon: Stethoscope, color: "text-primary" },
    { label: "Concluídas Hoje", value: stats.completedToday, icon: CheckCircle, color: "text-success" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className="border-border shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{card.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl bg-muted flex items-center justify-center ${card.color}`}>
                  <card.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Consultas de Hoje</CardTitle>
        </CardHeader>
        <CardContent>
          {todayAppts.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              Nenhuma consulta agendada para hoje.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase">Horário</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase">Paciente</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase">Dentista</th>
                    <th className="text-left py-3 px-2 text-xs font-medium text-muted-foreground uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todayAppts.map((appt) => (
                    <tr key={appt.id} className="border-b border-border last:border-0">
                      <td className="py-3 px-2 text-sm font-medium">{appt.time}</td>
                      <td className="py-3 px-2 text-sm">{(appt.patients as any)?.name || "-"}</td>
                      <td className="py-3 px-2 text-sm">{(appt.dentists as any)?.name || "-"}</td>
                      <td className="py-3 px-2">
                        <Badge variant={statusVariant(appt.status) as any}>
                          {statusLabel[appt.status] || appt.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
