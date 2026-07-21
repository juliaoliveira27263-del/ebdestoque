import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { supabase } from '@/lib/supabase';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface StockByIndustry {
  industry: string;
  stock: number;
}

interface TopProduct {
  name: string;
  count: number;
}

interface MovementsOverTime {
  date: string;
  in: number;
  out: number;
}

interface RequestsSummary {
  pending: number;
  approved: number;
  rejected: number;
  fulfilled: number;
}

export function ReportsPage() {
  const [period, setPeriod] = useState('30');

  const days = parseInt(period, 10);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data: stockByIndustry = [] } = useQuery<StockByIndustry[]>({
    queryKey: ['report-stock-by-industry'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('stock_quantity, industry:industries(name)');
      if (error) throw error;
      const map = new Map<string, number>();
      (data || []).forEach((item: { stock_quantity: number; industry: { name: string }[] | null }) => {
        const name = item.industry?.[0]?.name || 'Sem indústria';
        map.set(name, (map.get(name) || 0) + (item.stock_quantity || 0));
      });
      return Array.from(map.entries()).map(([industry, stock]) => ({ industry, stock }));
    },
  });

  const { data: topProducts = [] } = useQuery<TopProduct[]>({
    queryKey: ['report-top-products', period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('request_items')
        .select('quantity, product:products(name)')
        .gte('created_at', startDate.toISOString());
      if (error) throw error;
      const map = new Map<string, number>();
      (data || []).forEach((item: { quantity: number; product: { name: string }[] | null }) => {
        const name = item.product?.[0]?.name || 'Desconhecido';
        map.set(name, (map.get(name) || 0) + item.quantity);
      });
      return Array.from(map.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    },
  });

  const { data: movementsOverTime = [] } = useQuery<MovementsOverTime[]>({
    queryKey: ['report-movements-over-time', period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movements')
        .select('type, quantity, created_at')
        .gte('created_at', startDate.toISOString());
      if (error) throw error;
      const map = new Map<string, MovementsOverTime>();
      (data || []).forEach((item: { type: string; quantity: number; created_at: string }) => {
        const date = item.created_at.split('T')[0];
        const existing = map.get(date) || { date, in: 0, out: 0 };
        if (item.type === 'in') existing.in += item.quantity;
        if (item.type === 'out') existing.out += item.quantity;
        map.set(date, existing);
      });
      return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    },
  });

  const { data: requestsSummary } = useQuery<RequestsSummary>({
    queryKey: ['report-requests-summary', period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requests')
        .select('status')
        .gte('created_at', startDate.toISOString());
      if (error) throw error;
      const items = data || [];
      return {
        pending: items.filter((r: { status: string }) => r.status === 'pending').length,
        approved: items.filter((r: { status: string }) => r.status === 'approved').length,
        rejected: items.filter((r: { status: string }) => r.status === 'rejected').length,
        fulfilled: items.filter((r: { status: string }) => r.status === 'fulfilled').length,
      };
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Análise de dados do sistema</p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="period">Período:</Label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger id="period" className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="15">15 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Pendentes', value: requestsSummary?.pending ?? 0, color: 'text-warning' },
          { label: 'Aprovadas', value: requestsSummary?.approved ?? 0, color: 'text-success' },
          { label: 'Rejeitadas', value: requestsSummary?.rejected ?? 0, color: 'text-destructive' },
          { label: 'Atendidas', value: requestsSummary?.fulfilled ?? 0, color: 'text-primary' },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
            <p className="text-xs text-muted-foreground">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Estoque por indústria</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stockByIndustry}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="industry" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
              }}
            />
            <Bar dataKey="stock" fill="#dc2626" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Produtos mais solicitados</h2>
        {topProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum dado no período selecionado</p>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={150} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                }}
              />
              <Bar dataKey="count" fill="#dc2626" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Movimentações ao longo do tempo</h2>
        {movementsOverTime.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum dado no período selecionado</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={movementsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="in" stroke="#22c55e" name="Entrada" strokeWidth={2} />
              <Line type="monotone" dataKey="out" stroke="#dc2626" name="Saída" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
