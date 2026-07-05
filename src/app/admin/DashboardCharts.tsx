"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Activity, MapPin } from "lucide-react";

const COLORS = ['#0f172a', '#eab308', '#22c55e', '#ef4444', '#64748b'];

export default function DashboardCharts({ 
  unitData, 
  attendanceData 
}: { 
  unitData: { name: string; count: number }[],
  attendanceData: { name: string; value: number }[]
}) {

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
      <div className="glass-card" style={{ padding: "1.5rem" }}>
        <h3 className="heading-2" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.25rem" }}>
          <MapPin size={20} color="var(--primary-navy)" />
          Recruits by Unit
        </h3>
        {unitData.length > 0 ? (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={unitData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                <Tooltip cursor={{ fill: 'rgba(15, 23, 42, 0.05)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
                <Bar dataKey="count" fill="var(--primary-navy)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-muted" style={{ textAlign: "center", padding: "2rem 0" }}>Not enough data.</p>
        )}
      </div>

      <div className="glass-card" style={{ padding: "1.5rem" }}>
        <h3 className="heading-2" style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1.25rem" }}>
          <Activity size={20} color="var(--accent-gold)" />
          Overall Attendance Rate
        </h3>
        {attendanceData.reduce((acc, curr) => acc + curr.value, 0) > 0 ? (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={attendanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {attendanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'Present' ? '#22c55e' : '#ef4444'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-muted" style={{ textAlign: "center", padding: "2rem 0" }}>No attendance recorded yet.</p>
        )}
      </div>
    </div>
  );
}
