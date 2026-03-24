import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Ticket, Users, BarChart3, LogOut, Menu, X, Trash2,
  AlertCircle, CheckCircle, Clock, Star, Plus, PieChart as PieIcon, LineChart as LineIcon,
  LayoutDashboard
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from "recharts";
import {
  getAdminReport, addAgent, deleteAgent, assignTicket, handlePwRequest,
  getDashboard, logout, isAuthenticated, getCurrentUser,
} from "@/api";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); 
  const [loading, setLoading] = useState(true);

  // Data
  const [reportStats, setReportStats] = useState<any>({ total: 0, resolved: 0, pending: 0, avg_rating: 0 });
  const [performance, setPerformance] = useState<any[]>([]);
  const [priorityData, setPriorityData] = useState<any[]>([]);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [pwRequests, setPwRequests] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [agentsList, setAgentsList] = useState<any[]>([]);

  // Add agent form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: "", email: "", role: "Agent" });

  useEffect(() => {
    if (!isAuthenticated()) {
      setLocation("/staff-login");
      return;
    }
    const user = getCurrentUser();
    if (user && user.Role !== "Administrator" && user.role !== "Administrator") {
      setLocation("/agent-dashboard");
      return;
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [report, dashboard] = await Promise.all([
        getAdminReport(),
        getDashboard(),
      ]);
      setReportStats(report.stats || {});
      setPerformance(report.performance || []);
      setPriorityData(report.priority_data || []);
      setDailyData(report.daily_data || []);
      setPwRequests(report.pw_requests || []);
      setTickets(dashboard.tickets || []);
      setAgentsList(dashboard.agents || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAgent = async () => {
    try {
      await addAgent(newAgent);
      toast.success(`Added ${newAgent.name}`);
      setNewAgent({ name: "", email: "", role: "Agent" });
      setShowAddForm(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteAgent = async (agentId: number) => {
    if (!confirm("Are you sure you want to remove this agent? All assigned tickets will be unassigned.")) return;
    try {
      await deleteAgent(agentId);
      toast.success("Agent removed from Nexora Registry");
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAssign = async (ticketId: number, agentId: number | null) => {
    try {
      await assignTicket(ticketId, agentId);
      toast.success("Ticket assigned!");
      fetchData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const COLORS = ['#00E5FF', '#BD00FF', '#00FFA3', '#FF005C'];

  return (
    <div className="min-h-screen bg-background grid-bg-animated overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/20 bg-background/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-card/50 rounded-lg transition-colors md:hidden">
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex items-center gap-2 flex-1 md:flex-none">
            <span className="text-xl font-black text-primary neon-glow tracking-tighter">NEXORA <span className="text-muted-foreground opacity-50 font-normal">| ADMIN PORTAL</span></span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={logout} className="flex items-center gap-2 p-2 px-4 bg-red-500/10 border border-red-500/20 rounded-md hover:bg-red-500/20 transition-all">
              <span className="text-[10px] font-black text-red-400">TERMINATE SESSION</span>
              <LogOut className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} border-r border-border/20 bg-card/30 backdrop-blur-md h-[calc(100vh-73px)] sticky top-[73px] transition-all duration-300 overflow-hidden hidden md:block z-30`}>
          <nav className="p-4 space-y-1">
            {[
              { id: "overview", label: "Overview", icon: LayoutDashboard },
              { id: "assign", label: "Assign Tickets", icon: Ticket },
              { id: "analytics", label: "Operational Intel", icon: BarChart3 },
              { id: "agents", label: "Team Management", icon: Users },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === item.id 
                    ? "bg-primary/20 text-primary border border-primary/30 shadow-[0_0_15px_rgba(0,229,255,0.1)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="font-bold text-[11px] uppercase tracking-widest leading-none">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-10">
          <Tabs value={activeTab} className="w-full space-y-8">
            
            {/* 1. OVERVIEW (RESTORED) */}
            <TabsContent value="overview" className="space-y-8 outline-none materialize">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="glass-card p-6 border-primary/20">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Grid Throughput</p>
                    <p className="text-3xl font-black text-primary">{reportStats.total || 0}</p>
                  </div>
                  <div className="glass-card p-6 border-green-500/20">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Resolved Units</p>
                    <p className="text-3xl font-black text-green-400">{reportStats.resolved || 0}</p>
                  </div>
                  <div className="glass-card p-6 border-secondary/20">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Active Backlog</p>
                    <p className="text-3xl font-black text-secondary">{reportStats.pending || 0}</p>
                  </div>
                  <div className="glass-card p-6 border-yellow-500/20">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Satisfaction Avg</p>
                    <p className="text-3xl font-black text-yellow-400">{reportStats.avg_rating || "N/A"}</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Simplified Quick Assign */}
                <div className="glass-card overflow-hidden">
                  <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-widest">Priority Triage</h3>
                    <span className="text-[10px] bg-secondary/10 text-secondary px-2 py-0.5 rounded border border-secondary/20 font-bold">UNASSIGNED TKTs</span>
                  </div>
                  <div className="max-h-[350px] overflow-y-auto">
                    {tickets.filter(t => !t.Agent_ID && t.Status !== "Resolved").slice(0, 10).map((t: any) => (
                      <div key={t.Ticket_ID} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors flex items-center justify-between group">
                         <div>
                            <p className="text-xs font-bold text-primary mb-0.5">#{String(t.Ticket_ID).padStart(4, '0')}</p>
                            <p className="text-sm font-semibold truncate max-w-[200px]">{t.Subject}</p>
                         </div>
                         <Select
                              value="unassigned"
                              onValueChange={(v) => handleAssign(t.Ticket_ID, v === "unassigned" ? null : parseInt(v))}
                            >
                              <SelectTrigger className="bg-white/5 border-white/10 w-32 h-8 text-[10px] font-bold">
                                <SelectValue placeholder="Quick Assign" />
                              </SelectTrigger>
                              <SelectContent>
                                {agentsList.map((a: any) => (
                                  <SelectItem key={a.Agent_ID} value={String(a.Agent_ID)}>{a.Name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                      </div>
                    ))}
                    {tickets.filter(t => !t.Agent_ID && t.Status !== "Resolved").length === 0 && (
                      <div className="p-10 text-center text-xs italic text-muted-foreground">Grid is stable. No unassigned units.</div>
                    )}
                  </div>
                </div>

                {/* Performance Preview */}
                <div className="glass-card overflow-hidden">
                  <div className="p-4 border-b border-white/5 bg-white/5">
                    <h3 className="text-xs font-bold uppercase tracking-widest">Top Performers</h3>
                  </div>
                  <div className="p-4 space-y-4">
                    {performance.slice(0, 5).map((agent: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-xs">
                               {agent.Name.charAt(0)}
                            </div>
                            <div>
                               <p className="text-sm font-bold">{agent.Name}</p>
                               <span className="text-[10px] text-muted-foreground uppercase">{agent.solved} RESOLUTIONS</span>
                            </div>
                         </div>
                         <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-xs font-bold">{agent.avg_rating || "0.0"}</span>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 2. ASSIGN TICKETS */}
            <TabsContent value="assign" className="materialize outline-none">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground">Assign Tickets</h2>
                <p className="text-sm text-muted-foreground">Command and control hub for incoming grid requests.</p>
              </div>

              <div className="glass-card-enhanced overflow-hidden border-border/10">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/20 bg-card/60">
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">ID</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Subject</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Priority</th>
                        <th className="px-6 py-4 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Operation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/10">
                      {tickets.filter(t => t.Status !== "Resolved").map((ticket: any) => (
                        <tr key={ticket.Ticket_ID} className="hover:bg-primary/5 transition-all group">
                          <td className="px-6 py-4">
                            <span className="text-xs font-mono font-bold text-primary">#{String(ticket.Ticket_ID).padStart(4, '0')}</span>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold">{ticket.Subject}</td>
                          <td className="px-6 py-4">
                             <span className={`text-[10px] font-bold px-2 py-1 rounded-sm border ${
                               ticket.Priority === 'High' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
                               ticket.Priority === 'Medium' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' :
                               'bg-green-500/10 border-green-500/30 text-green-500'
                             }`}>
                               {ticket.Priority?.toUpperCase()}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Select
                              value={ticket.Agent_ID ? String(ticket.Agent_ID) : "unassigned"}
                              onValueChange={(v) => handleAssign(ticket.Ticket_ID, v === "unassigned" ? null : parseInt(v))}
                            >
                              <SelectTrigger className="bg-white/5 border-white/10 w-48 h-9 text-xs font-bold">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned" className="text-red-400 font-bold">● UNASSIGNED</SelectItem>
                                {agentsList.map((a: any) => (
                                  <SelectItem key={a.Agent_ID} value={String(a.Agent_ID)}>{a.Name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            {/* 3. OPERATIONAL INTEL (ANALYTICS) */}
            <TabsContent value="analytics" className="materialize outline-none space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-card p-6 border-primary/20">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-8">Resolution Trends</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={dailyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={10} tickFormatter={(v) => v.slice(5)} />
                        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#020818', border: '1px solid rgba(255,255,255,0.1)' }} />
                        <Line type="monotone" dataKey="count" stroke="#00E5FF" strokeWidth={3} dot={{ r: 4, fill: '#00E5FF' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="glass-card p-6 border-secondary/20">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-secondary mb-8">Priority Mix</h3>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={priorityData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="count"
                          nameKey="Priority"
                        >
                          {priorityData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#020818', border: '1px solid rgba(255,255,255,0.1)' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* 4. TEAM MANAGEMENT */}
            <TabsContent value="agents" className="materialize outline-none space-y-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-foreground">Team Management</h2>
                <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary inline-flex items-center gap-2 group">
                  <Plus className={`w-4 h-4 transition-transform duration-500 ${showAddForm ? 'rotate-45' : ''}`} /> 
                  <span className="font-bold text-xs uppercase tracking-widest">Enroll Agent</span>
                </button>
              </div>

              {showAddForm && (
                <div className="glass-card p-8 materialize space-y-6 border-primary/30">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input value={newAgent.name} onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })} className="bg-white/5" placeholder="Agent Name" />
                    <Input value={newAgent.email} onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })} className="bg-white/5" placeholder="Identifier Email" />
                  </div>
                  <div className="flex gap-4">
                    <Select value={newAgent.role} onValueChange={(v) => setNewAgent({ ...newAgent, role: v })}>
                         <SelectTrigger className="bg-white/5 border-white/10"><SelectValue /></SelectTrigger>
                         <SelectContent>
                           <SelectItem value="Agent">Support Node</SelectItem>
                           <SelectItem value="Administrator">Lead Overseer</SelectItem>
                         </SelectContent>
                    </Select>
                    <button onClick={handleAddAgent} className="btn-primary px-8">ACTIVATE UNIT</button>
                  </div>
                </div>
              )}

              <div className="glass-card-enhanced overflow-hidden border-border/10">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/20 bg-card/60">
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Ident</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Load</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Solved</th>
                        <th className="px-6 py-4 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Rating</th>
                        <th className="px-6 py-4 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/10">
                      {performance.map((agent: any, idx: number) => (
                        <tr key={idx} className="hover:bg-primary/5 transition-all group/row">
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-foreground">{agent.Name}</p>
                            <p className="text-[10px] text-muted-foreground">{agent.Email_ID}</p>
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-muted-foreground">{agent.assigned}</td>
                          <td className="px-6 py-4 text-sm font-mono text-green-400">{agent.solved}</td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                <span className="text-xs font-bold">{agent.avg_rating || 0}</span>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <button onClick={() => handleDeleteAgent(agent.Agent_ID)} className="p-2 text-muted-foreground hover:text-red-400 opacity-0 group-hover/row:opacity-100 transition-all">
                               <Trash2 className="w-4 h-4" />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
