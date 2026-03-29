import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp, TrendingDown, Wallet, Target, Edit2, Trash2, Plus, Database } from 'lucide-react';

const API_URL = 'http://100.98.95.20:3001/api';

// Función para formatear moneda
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Función para formatear números grandes (para gráficos)
const formatCompactCurrency = (amount) => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K`;
  }
  return `${amount.toFixed(0)}`;
};

const FinanceDashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [dbConnected, setDbConnected] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showMonthlyReport, setShowMonthlyReport] = useState(false);
  const [showEditBudgetModal, setShowEditBudgetModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [allocateAmount, setAllocateAmount] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  const [newGoal, setNewGoal] = useState({
    nombre: '',
    monto_objetivo: '',
    descripcion: ''
  });

  const [newBudget, setNewBudget] = useState({
    categoria_id: '',
    limite: '',
    mes: new Date().getMonth() + 1,
    anio: new Date().getFullYear()
  });

  const [newTransaction, setNewTransaction] = useState({
    fecha: new Date().toISOString().split('T')[0],
    categoria_id: '',
    monto: '',
    descripcion: '',
    tipo: 'gasto'
  });

  // Cargar datos
  useEffect(() => {
    const loadData = async () => {
      // 1. Verificar conexión
      try {
        const healthRes = await fetch(`${API_URL}/health`);
        const healthData = await healthRes.json();
        setDbConnected(healthData.success);
      } catch (error) {
        console.error('❌ Error de conexión:', error);
        setDbConnected(false);
      }

      // 2. Cargar categorías
      try {
        const catRes = await fetch(`${API_URL}/categorias`);
        const catData = await catRes.json();
        if (catData.success) {
          setCategories(catData.data);
          console.log('✅ Categorías cargadas:', catData.data.length);
        }
      } catch (error) {
        console.error('❌ Error cargando categorías:', error);
      }

      // 3. Cargar transacciones
      try {
        const transRes = await fetch(`${API_URL}/transacciones`);
        const transData = await transRes.json();
        
        console.log('📦 Respuesta del backend:', transData);
        
        if (transData.success) {
          const transformed = transData.data.map(t => {
            const transaction = {
              id: t.id,
              date: t.fecha.split('T')[0],
              category: t.categoria_nombre || 'Sin categoría',
              categoria_id: t.categoria_id,
              amount: parseFloat(t.monto),
              description: t.descripcion,
              type: t.tipo
            };
            console.log('✅ Transacción transformada:', transaction);
            return transaction;
          });
          
          console.log('📊 Total transacciones transformadas:', transformed.length);
          setTransactions(transformed);
        }
      } catch (error) {
        console.error('❌ Error cargando transacciones:', error);
      }

      // 4. Cargar metas de ahorro
      try {
        const metasRes = await fetch(`${API_URL}/metas`);
        const metasData = await metasRes.json();
        if (metasData.success) {
          setSavingsGoals(metasData.data);
          console.log('✅ Metas cargadas:', metasData.data.length);
        }
      } catch (error) {
        console.error('❌ Error cargando metas:', error);
      }

      // 5. Cargar presupuestos
      try {
        const budgetRes = await fetch(`${API_URL}/presupuestos`);
        const budgetData = await budgetRes.json();
        if (budgetData.success) {
          setBudgets(budgetData.data);
          console.log('✅ Presupuestos cargados:', budgetData.data.length);
        }
      } catch (error) {
        console.error('❌ Error cargando presupuestos:', error);
      }
    };

    loadData();
  }, []);

  // Calcular métricas
  const metrics = useMemo(() => {
    console.log('💰 Calculando métricas con', transactions.length, 'transacciones');
    
    const totalIncome = transactions
      .filter(t => t.type === 'ingreso')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = Math.abs(transactions
      .filter(t => t.type === 'gasto')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0));
    
    const totalAllocated = savingsGoals.reduce((sum, goal) => sum + parseFloat(goal.monto_actual || 0), 0);
    
    const realBalance = totalIncome - totalExpenses;
    const balance = realBalance - totalAllocated;
    const savingsRate = totalIncome > 0 ? ((realBalance / totalIncome) * 100).toFixed(1) : 0;
    const totalGoalsTarget = savingsGoals.reduce((sum, goal) => sum + parseFloat(goal.monto_objetivo || 0), 0);
    const unallocatedSavings = Math.max(0, balance);
    
    console.log('💰 Métricas calculadas:', { totalIncome, totalExpenses, balance });
    
    return {
      totalIncome,
      totalExpenses,
      totalAllocated,
      realBalance,
      balance,
      savingsRate,
      totalGoalsTarget,
      unallocatedSavings
    };
  }, [transactions, savingsGoals]);

  const { totalIncome, totalExpenses, totalAllocated, realBalance, balance, savingsRate, totalGoalsTarget, unallocatedSavings } = metrics;

  // Helper: obtener color de categoría
  const getCategoryColor = (categoryName) => {
    const category = categories.find(c => c.nombre === categoryName);
    return category?.color || '#FF6B9D';
  };

  // CRUD Transacciones
  const createTransaction = async () => {
    const amount = parseFloat(newTransaction.monto);
    
    if (!amount || !newTransaction.descripcion || !newTransaction.categoria_id) {
      alert('⚠️ Por favor completa todos los campos');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/transacciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha: newTransaction.fecha,
          categoria_id: parseInt(newTransaction.categoria_id),
          monto: newTransaction.tipo === 'gasto' ? -Math.abs(amount) : Math.abs(amount),
          descripcion: newTransaction.descripcion,
          tipo: newTransaction.tipo,
          cuenta: 'Principal'
        })
      });

      const data = await response.json();

      if (data.success) {
        const transRes = await fetch(`${API_URL}/transacciones`);
        const transData = await transRes.json();
        if (transData.success) {
          const transformed = transData.data.map(t => ({
            id: t.id,
            date: t.fecha.split('T')[0],
            category: t.categoria_nombre || 'Sin categoría',
            categoria_id: t.categoria_id,
            amount: parseFloat(t.monto),
            description: t.descripcion,
            type: t.tipo
          }));
          setTransactions(transformed);
        }
        setShowAddModal(false);
        setNewTransaction({
          fecha: new Date().toISOString().split('T')[0],
          categoria_id: '',
          monto: '',
          descripcion: '',
          tipo: 'gasto'
        });
        alert('✅ Transacción guardada exitosamente');
      }
    } catch (error) {
      console.error('❌ Error:', error);
      alert('❌ Error al guardar la transacción');
    }
  };

  const updateTransaction = async () => {
    try {
      const amount = parseFloat(selectedTransaction.monto);
      
      const response = await fetch(`${API_URL}/transacciones/${selectedTransaction.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fecha: selectedTransaction.fecha,
          categoria_id: parseInt(selectedTransaction.categoria_id),
          monto: selectedTransaction.tipo === 'gasto' ? -Math.abs(amount) : Math.abs(amount),
          descripcion: selectedTransaction.descripcion,
          tipo: selectedTransaction.tipo
        })
      });

      const data = await response.json();

      if (data.success) {
        const transRes = await fetch(`${API_URL}/transacciones`);
        const transData = await transRes.json();
        if (transData.success) {
          const transformed = transData.data.map(t => ({
            id: t.id,
            date: t.fecha.split('T')[0],
            category: t.categoria_nombre || 'Sin categoría',
            categoria_id: t.categoria_id,
            amount: parseFloat(t.monto),
            description: t.descripcion,
            type: t.tipo
          }));
          setTransactions(transformed);
        }
        setShowEditModal(false);
        setSelectedTransaction(null);
        alert('✅ Transacción actualizada');
      }
    } catch (error) {
      console.error('❌ Error:', error);
      alert('❌ Error al actualizar');
    }
  };

  const deleteTransaction = async (id) => {
    if (!window.confirm('¿Eliminar esta transacción?')) return;

    try {
      const response = await fetch(`${API_URL}/transacciones/${id}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        const transRes = await fetch(`${API_URL}/transacciones`);
        const transData = await transRes.json();
        if (transData.success) {
          const transformed = transData.data.map(t => ({
            id: t.id,
            date: t.fecha.split('T')[0],
            category: t.categoria_nombre || 'Sin categoría',
            categoria_id: t.categoria_id,
            amount: parseFloat(t.monto),
            description: t.descripcion,
            type: t.tipo
          }));
          setTransactions(transformed);
        }
        alert('✅ Transacción eliminada');
      }
    } catch (error) {
      console.error('❌ Error:', error);
      alert('❌ Error al eliminar');
    }
  };

  // CRUD Metas
  const addGoal = async () => {
    if (!newGoal.nombre || !newGoal.monto_objetivo) {
      alert('⚠️ Completa nombre y monto objetivo');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/metas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: newGoal.nombre,
          monto_objetivo: parseFloat(newGoal.monto_objetivo),
          descripcion: newGoal.descripcion
        })
      });

      const data = await response.json();

      if (data.success) {
        const metasRes = await fetch(`${API_URL}/metas`);
        const metasData = await metasRes.json();
        if (metasData.success) {
          setSavingsGoals(metasData.data);
        }
        
        setShowGoalsModal(false);
        setNewGoal({ nombre: '', monto_objetivo: '', descripcion: '' });
        alert('✅ Meta creada exitosamente');
      }
    } catch (error) {
      console.error('❌ Error:', error);
      alert('❌ Error al crear meta');
    }
  };

  const allocateFunds = async (goalId, amount) => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) return;
    
    if (numAmount > balance) {
      alert(`Solo tienes ${formatCurrency(balance)} disponibles para asignar`);
      return;
    }

    const goal = savingsGoals.find(g => g.id === goalId);
    const newAmount = Math.min(
      parseFloat(goal.monto_actual || 0) + numAmount, 
      parseFloat(goal.monto_objetivo)
    );

    try {
      const response = await fetch(`${API_URL}/metas/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto_actual: newAmount,
          completada: newAmount >= parseFloat(goal.monto_objetivo)
        })
      });

      const data = await response.json();

      if (data.success) {
        const metasRes = await fetch(`${API_URL}/metas`);
        const metasData = await metasRes.json();
        if (metasData.success) {
          setSavingsGoals(metasData.data);
        }
        
        setAllocateAmount('');
        setShowAllocateModal(false);
        alert('✅ Fondos asignados');
      }
    } catch (error) {
      console.error('❌ Error:', error);
      alert('❌ Error al asignar fondos');
    }
  };

  const removeAllocation = async (goalId, amount) => {
    const goal = savingsGoals.find(g => g.id === goalId);
    const newAmount = Math.max(0, parseFloat(goal.monto_actual || 0) - amount);

    try {
      const response = await fetch(`${API_URL}/metas/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          monto_actual: newAmount,
          completada: false
        })
      });

      if (response.ok) {
        const metasRes = await fetch(`${API_URL}/metas`);
        const metasData = await metasRes.json();
        if (metasData.success) {
          setSavingsGoals(metasData.data);
        }
      }
    } catch (error) {
      console.error('❌ Error:', error);
    }
  };

  const deleteGoal = async (goalId) => {
    if (!window.confirm('¿Eliminar esta meta?')) return;

    try {
      const response = await fetch(`${API_URL}/metas/${goalId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        const metasRes = await fetch(`${API_URL}/metas`);
        const metasData = await metasRes.json();
        if (metasData.success) {
          setSavingsGoals(metasData.data);
        }
        alert('✅ Meta eliminada');
      }
    } catch (error) {
      console.error('❌ Error:', error);
      alert('❌ Error al eliminar meta');
    }
  };

  // Función auxiliar para recargar presupuestos
  const loadBudgets = async () => {
    try {
      const budgetRes = await fetch(`${API_URL}/presupuestos`);
      const budgetData = await budgetRes.json();
      if (budgetData.success) {
        setBudgets(budgetData.data);
        console.log('✅ Presupuestos recargados:', budgetData.data.length);
      }
    } catch (error) {
      console.error('❌ Error recargando presupuestos:', error);
    }
  };

  // CRUD Presupuestos
  const createBudget = async () => {
    if (!newBudget.categoria_id || !newBudget.limite) {
      alert('⚠️ Completa todos los campos');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/presupuestos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoria_id: parseInt(newBudget.categoria_id),
          mes: parseInt(newBudget.mes),
          anio: parseInt(newBudget.anio),
          limite: parseFloat(newBudget.limite),
          alertas: true
        })
      });

      const data = await response.json();

      if (data.success) {
        await loadBudgets();
        setShowBudgetModal(false);
        setNewBudget({
          categoria_id: '',
          limite: '',
          mes: new Date().getMonth() + 1,
          anio: new Date().getFullYear()
        });
        alert('✅ Presupuesto creado');
      }
    } catch (error) {
      console.error('❌ Error:', error);
      alert('❌ Error al crear presupuesto');
    }
  };

  const updateBudget = async () => {
    if (!selectedBudget.limite) {
      alert('⚠️ Completa el límite');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/presupuestos/${selectedBudget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          limite: parseFloat(selectedBudget.limite),
          alertas: selectedBudget.alertas
        })
      });

      const data = await response.json();

      if (data.success) {
        await loadBudgets();
        setShowEditBudgetModal(false);
        setSelectedBudget(null);
        alert('✅ Presupuesto actualizado');
      }
    } catch (error) {
      console.error('❌ Error:', error);
      alert('❌ Error al actualizar presupuesto');
    }
  };

  const deleteBudget = async (budgetId) => {
    if (!window.confirm('¿Eliminar este presupuesto?')) return;

    try {
      const response = await fetch(`${API_URL}/presupuestos/${budgetId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        await loadBudgets();
        alert('✅ Presupuesto eliminado');
      }
    } catch (error) {
      console.error('❌ Error:', error);
      alert('❌ Error al eliminar presupuesto');
    }
  };

  // Datos para gráficos
  const categoryData = useMemo(() => {
    return transactions
      .filter(t => t.type === 'gasto')
      .reduce((acc, t) => {
        const existing = acc.find(item => item.name === t.category);
        if (existing) {
          existing.value += Math.abs(t.amount);
        } else {
          acc.push({ name: t.category, value: Math.abs(t.amount) });
        }
        return acc;
      }, []);
  }, [transactions]);

  // Generar datos de tendencia - agrupar por fecha
  const trendData = useMemo(() => {
    console.log('🔄 Recalculando trendData...');
    console.log('🔍 Transacciones disponibles:', transactions.length);
    
    if (transactions.length === 0) {
      console.log('⚠️ No hay transacciones para procesar');
      return [];
    }
    
    console.log('🔍 Muestra de transacciones:', transactions.slice(0, 3));
    
    const data = transactions
      .reduce((acc, t) => {
        const date = t.date;
        const existing = acc.find(item => item.date === date);
        
        if (existing) {
          if (t.type === 'ingreso') {
            existing.income += Math.abs(t.amount);
          } else if (t.type === 'gasto') {
            existing.expenses += Math.abs(t.amount);
          }
        } else {
          acc.push({
            date,
            income: t.type === 'ingreso' ? Math.abs(t.amount) : 0,
            expenses: t.type === 'gasto' ? Math.abs(t.amount) : 0
          });
        }
        return acc;
      }, [])
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .filter(item => item.income > 0 || item.expenses > 0);

    console.log('📊 Datos procesados para gráfico:', data);
    console.log('📊 Cantidad de puntos:', data.length);
    
    return data;
  }, [transactions]);

  const COLORS = ['#FF6B9D', '#C44569', '#FFA502', '#FFD93D', '#6BCF7F', '#4ECDC4', '#5F27CD', '#FF6348'];
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  // Calcular estadísticas mensuales
  const getMonthlyStats = (month, year) => {
    const monthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() + 1 === month && date.getFullYear() === year;
    });

    const income = monthTransactions
      .filter(t => t.type === 'ingreso')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = Math.abs(monthTransactions
      .filter(t => t.type === 'gasto')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0));

    const categoryBreakdown = monthTransactions
      .filter(t => t.type === 'gasto')
      .reduce((acc, t) => {
        const existing = acc.find(item => item.name === t.category);
        if (existing) {
          existing.value += Math.abs(t.amount);
          existing.count += 1;
        } else {
          acc.push({ name: t.category, value: Math.abs(t.amount), count: 1 });
        }
        return acc;
      }, [])
      .sort((a, b) => b.value - a.value);

    const avgDailyExpense = expenses / (monthTransactions.filter(t => t.type === 'gasto').length || 1);
    const topExpense = monthTransactions
      .filter(t => t.type === 'gasto')
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))[0];

    return {
      income,
      expenses,
      balance: income - expenses,
      savingsRate: income > 0 ? ((income - expenses) / income * 100).toFixed(1) : 0,
      transactionCount: monthTransactions.length,
      categoryBreakdown,
      avgDailyExpense,
      topExpense
    };
  };

  const currentMonthStats = getMonthlyStats(selectedMonth, selectedYear);
  const previousMonthStats = getMonthlyStats(
    selectedMonth === 1 ? 12 : selectedMonth - 1,
    selectedMonth === 1 ? selectedYear - 1 : selectedYear
  );

  // Log de estado general
  console.log('🎨 RENDER - Estado actual:', {
    transactionsCount: transactions.length,
    categoriesCount: categories.length,
    goalsCount: savingsGoals.length,
    trendDataPoints: trendData.length,
    categoryDataPoints: categoryData.length
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      fontFamily: '"Outfit", "Segoe UI", sans-serif',
      color: '#ffffff',
      padding: '2rem'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: '800',
            background: 'linear-gradient(135deg, #FFD93D 0%, #FFA502 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0
          }}>
            Mi Dashboard Financiero
          </h1>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: dbConnected ? 'rgba(107, 207, 127, 0.2)' : 'rgba(255, 107, 157, 0.2)',
              padding: '0.5rem 1rem',
              borderRadius: '2rem',
              border: `2px solid ${dbConnected ? '#6BCF7F' : '#FF6B9D'}`
            }}>
              <Database size={20} />
              <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                {dbConnected ? 'PostgreSQL ✓' : 'Desconectado'}
              </span>
            </div>
            <button onClick={() => setShowBudgetModal(true)} style={{
              background: 'linear-gradient(135deg, #5F27CD 0%, #341f97 100%)',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '2rem',
              color: 'white',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '1rem'
            }}>
              💰 Nuevo Presupuesto
            </button>
            <button onClick={() => setShowMonthlyReport(true)} style={{
              background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '2rem',
              color: 'white',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '1rem'
            }}>
              📊 Resumen Mensual
            </button>
            <button onClick={() => setShowGoalsModal(true)} style={{
              background: 'linear-gradient(135deg, #FFD93D 0%, #FFA502 100%)',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '2rem',
              color: '#1a1a2e',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '1rem'
            }}>
              <Target size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Nueva Meta
            </button>
            <button onClick={() => setShowAddModal(true)} style={{
              background: 'linear-gradient(135deg, #FF6B9D 0%, #C44569 100%)',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '2rem',
              color: 'white',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '1rem'
            }}>
              <Plus size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Nueva Transacción
            </button>
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2.5rem'
      }}>
        {[
          { icon: DollarSign, label: 'Balance Total', value: `${formatCurrency(balance)}`, color: '#6BCF7F' },
          { icon: TrendingUp, label: 'Ingresos', value: `${formatCurrency(totalIncome)}`, color: '#4ECDC4' },
          { icon: TrendingDown, label: 'Gastos', value: `${formatCurrency(totalExpenses)}`, color: '#FF6B9D' },
          { icon: Wallet, label: 'Tasa de Ahorro', value: `${savingsRate}%`, color: '#FFD93D' }
        ].map((metric, idx) => (
          <div key={idx} style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '1.5rem',
            padding: '1.5rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{
                background: `${metric.color}22`,
                padding: '0.75rem',
                borderRadius: '1rem',
                border: `2px solid ${metric.color}`
              }}>
                <metric.icon size={24} color={metric.color} />
              </div>
            </div>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)' }}>
              {metric.label}
            </p>
            <h2 style={{ margin: 0, fontSize: '2rem', fontWeight: '800', color: metric.color }}>
              {metric.value}
            </h2>
          </div>
        ))}
      </div>

      {/* Presupuestos */}
      {budgets.length > 0 && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '1.5rem',
          padding: '2rem',
          marginBottom: '2.5rem'
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', fontWeight: '700' }}>
            💰 Presupuestos del Mes
          </h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {budgets.map((budget) => {
              const percentage = (parseFloat(budget.gastado || 0) / parseFloat(budget.limite) * 100).toFixed(1);
              const isOverBudget = percentage > 100;
              const isWarning = percentage > 80;
              
              return (
                <div key={budget.id} style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: `2px solid ${isOverBudget ? '#FF6B9D' : isWarning ? '#FFA502' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  position: 'relative'
                }}>
                  <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => {
                        setSelectedBudget({
                          id: budget.id,
                          categoria_id: budget.categoria_id,
                          categoria_nombre: budget.categoria_nombre,
                          limite: parseFloat(budget.limite),
                          mes: budget.mes,
                          anio: budget.anio,
                          alertas: budget.alertas
                        });
                        setShowEditBudgetModal(true);
                      }}
                      style={{
                        background: 'rgba(78, 205, 196, 0.2)',
                        border: '1px solid #4ECDC4',
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        color: '#4ECDC4',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Editar presupuesto"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => deleteBudget(budget.id)}
                      style={{
                        background: 'rgba(255, 107, 157, 0.2)',
                        border: '1px solid #FF6B9D',
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        color: '#FF6B9D',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Eliminar presupuesto"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem', marginRight: '5rem' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>
                        {budget.categoria_nombre}
                      </h4>
                      <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                        Límite: ${formatCurrency(parseFloat(budget.limite))}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.8rem', fontWeight: '800', color: isOverBudget ? '#FF6B9D' : '#6BCF7F' }}>
                        ${formatCurrency(parseFloat(budget.gastado || 0))}
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                        {percentage}% usado
                      </div>
                    </div>
                  </div>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    height: '12px',
                    borderRadius: '1rem',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      background: isOverBudget ? '#FF6B9D' : isWarning ? '#FFA502' : '#6BCF7F',
                      height: '100%',
                      width: `${Math.min(percentage, 100)}%`,
                      borderRadius: '1rem',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>
                  {isOverBudget && (
                    <p style={{ margin: '0.75rem 0 0 0', color: '#FF6B9D', fontSize: '0.9rem', fontWeight: '600' }}>
                      ⚠️ Has excedido tu presupuesto en ${formatCurrency(parseFloat(budget.gastado || 0) - parseFloat(budget.limite))}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Metas de Ahorro */}
      {savingsGoals.length > 0 && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '1.5rem',
          padding: '2rem',
          marginBottom: '2.5rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
              🎯 Metas de Ahorro
            </h3>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '0.25rem' }}>
                Balance real: <strong style={{ color: '#4ECDC4' }}>${formatCurrency(realBalance)}</strong>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '0.25rem' }}>
                Asignado a metas: <strong style={{ color: '#FFD93D' }}>${formatCurrency(totalAllocated)}</strong>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#6BCF7F', marginTop: '0.5rem' }}>
                ${formatCurrency(balance)}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                Balance disponible
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {savingsGoals.map((goal) => {
              const montoActual = parseFloat(goal.monto_actual || 0);
              const montoObjetivo = parseFloat(goal.monto_objetivo);
              const progress = (montoActual / montoObjetivo) * 100;
              const remaining = montoObjetivo - montoActual;
              
              return (
                <div key={goal.id} style={{
                  background: 'rgba(255, 217, 61, 0.15)',
                  border: '2px solid #FFD93D',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  position: 'relative'
                }}>
                  <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => {
                        setSelectedGoal(goal);
                        setShowAllocateModal(true);
                      }}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        color: 'white'
                      }}
                      title="Asignar fondos"
                    >
                      <Plus size={16} />
                    </button>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      style={{
                        background: 'rgba(255, 107, 157, 0.2)',
                        border: 'none',
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        color: '#FF6B9D'
                      }}
                      title="Eliminar meta"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div style={{ marginBottom: '1rem', marginRight: '4rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: '700' }}>
                      {goal.nombre}
                    </h4>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                      Meta: ${formatCurrency(montoObjetivo)}
                    </p>
                  </div>

                  <div style={{
                    background: 'rgba(255, 217, 61, 0.3)',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.75rem',
                    marginBottom: '1rem',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2rem', fontWeight: '800', color: '#FFD93D' }}>
                      {progress.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                      completado
                    </div>
                  </div>

                  <div style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    height: '16px',
                    borderRadius: '1rem',
                    overflow: 'hidden',
                    marginBottom: '1rem',
                    position: 'relative'
                  }}>
                    <div style={{
                      background: 'linear-gradient(90deg, #FFD93D, #FFA502)',
                      height: '100%',
                      width: `${Math.min(progress, 100)}%`,
                      borderRadius: '1rem',
                      transition: 'width 0.5s ease'
                    }} />
                    {progress >= 100 && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: '700'
                      }}>
                        🎉 ¡META CUMPLIDA!
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                    <div>
                      <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Ahorrado </span>
                      <span style={{ fontWeight: '700', color: '#FFD93D' }}>${formatCurrency(montoActual)}</span>
                    </div>
                    <div>
                      <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Falta </span>
                      <span style={{ fontWeight: '700' }}>${formatCurrency(remaining)}</span>
                    </div>
                  </div>

                  {montoActual > 0 && (
                    <button
                      onClick={() => {
                        const amount = parseFloat(prompt(`¿Cuánto deseas retirar de ${goal.nombre}? (Máximo: ${montoActual.toFixed(2)})`));
                        if (amount && amount > 0 && amount <= montoActual) {
                          removeAllocation(goal.id, amount);
                        }
                      }}
                      style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        padding: '0.5rem',
                        borderRadius: '0.5rem',
                        color: 'white',
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      Retirar fondos
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {balance > 0 && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1.25rem',
              background: 'rgba(255, 217, 61, 0.15)',
              border: '2px dashed #FFD93D',
              borderRadius: '1rem',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '1.2rem' }}>
                💡 Tienes <strong style={{ color: '#FFD93D', fontSize: '1.3rem' }}>${formatCurrency(balance)}</strong> disponibles para asignar a metas
              </span>
            </div>
          )}

          {balance < 0 && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1.25rem',
              background: 'rgba(255, 107, 157, 0.15)',
              border: '2px solid #FF6B9D',
              borderRadius: '1rem',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '1.1rem', color: '#FF6B9D' }}>
                ⚠️ Has asignado más dinero del que tienes disponible (${formatCurrency(Math.abs(balance))})
              </span>
            </div>
          )}
        </div>
      )}

      {/* Gráficos */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '2rem',
        marginBottom: '2.5rem'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '1.5rem',
          padding: '2rem'
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', fontWeight: '700' }}>
            Tendencia de Ingresos vs Gastos
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" tickFormatter={(value) => `${formatCurrency(value)}`} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.5rem'
                }}
                formatter={(value) => `${formatCurrency(value)}`}
              />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#4ECDC4" strokeWidth={3} name="Ingresos" />
              <Line type="monotone" dataKey="expenses" stroke="#FF6B9D" strokeWidth={3} name="Gastos" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '1.5rem',
          padding: '2rem'
        }}>
          <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.5rem', fontWeight: '700' }}>
            Gastos por Categoría
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.5rem'
                }}
                formatter={(value) => `${formatCurrency(value)}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla de transacciones */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '1.5rem',
        padding: '2rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
            Transacciones Recientes
          </h3>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '0.75rem',
              padding: '0.5rem 1rem',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="all">Todas</option>
            <option value="ingreso">Ingresos</option>
            <option value="gasto">Gastos</option>
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid rgba(255, 255, 255, 0.1)' }}>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600' }}>Fecha</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600' }}>Categoría</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600' }}>Descripción</th>
                <th style={{ padding: '1rem', textAlign: 'right', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600' }}>Monto</th>
                <th style={{ padding: '1rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.6)', fontWeight: '600' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {transactions
                .filter(t => filter === 'all' || t.type === filter)
                .map((transaction) => (
                  <tr
                    key={transaction.id}
                    style={{
                      borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                    }}
                  >
                    <td style={{ padding: '1rem' }}>{transaction.date}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        background: `${getCategoryColor(transaction.category)}33`,
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        border: `1px solid ${getCategoryColor(transaction.category)}`
                      }}>
                        {transaction.category}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: 'rgba(255, 255, 255, 0.8)' }}>{transaction.description}</td>
                    <td style={{
                      padding: '1rem',
                      textAlign: 'right',
                      fontWeight: '700',
                      fontSize: '1.1rem',
                      color: transaction.type === 'ingreso' ? '#6BCF7F' : '#FF6B9D'
                    }}>
                      {transaction.type === 'ingreso' ? '+' : '-'}${formatCurrency(Math.abs(transaction.amount))}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button
                          onClick={() => {
                            setSelectedTransaction({
                              id: transaction.id,
                              fecha: transaction.date,
                              categoria_id: transaction.categoria_id,
                              monto: Math.abs(transaction.amount),
                              descripcion: transaction.description,
                              tipo: transaction.type
                            });
                            setShowEditModal(true);
                          }}
                          style={{
                            background: 'rgba(78, 205, 196, 0.2)',
                            border: '1px solid #4ECDC4',
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            color: '#4ECDC4',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => deleteTransaction(transaction.id)}
                          style={{
                            background: 'rgba(255, 107, 157, 0.2)',
                            border: '1px solid #FF6B9D',
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            color: '#FF6B9D',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva Transacción */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }} onClick={() => setShowAddModal(false)}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '1.5rem',
            padding: '2rem',
            width: '90%',
            maxWidth: '500px'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '2rem', fontWeight: '700' }}>
              Nueva Transacción
            </h2>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                Tipo
              </label>
              <select
                value={newTransaction.tipo}
                onChange={(e) => setNewTransaction({...newTransaction, tipo: e.target.value, categoria_id: ''})}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.75rem',
                  padding: '0.75rem',
                  color: 'white',
                  fontSize: '1rem'
                }}
              >
                <option value="gasto">Gasto</option>
                <option value="ingreso">Ingreso</option>
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                Fecha
              </label>
              <input
                type="date"
                value={newTransaction.fecha}
                onChange={(e) => setNewTransaction({...newTransaction, fecha: e.target.value})}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.75rem',
                  padding: '0.75rem',
                  color: 'white',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                Categoría
              </label>
              <select
                value={newTransaction.categoria_id}
                onChange={(e) => setNewTransaction({...newTransaction, categoria_id: e.target.value})}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.75rem',
                  padding: '0.75rem',
                  color: 'white',
                  fontSize: '1rem'
                }}
              >
                <option value="">Selecciona una categoría</option>
                {categories
                  .filter(cat => cat.tipo === newTransaction.tipo)
                  .map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                Monto
              </label>
              <input
                type="number"
                step="0.01"
                value={newTransaction.monto}
                onChange={(e) => setNewTransaction({...newTransaction, monto: e.target.value})}
                placeholder="0.00"
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.75rem',
                  padding: '0.75rem',
                  color: 'white',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                Descripción
              </label>
              <input
                type="text"
                value={newTransaction.descripcion}
                onChange={(e) => setNewTransaction({...newTransaction, descripcion: e.target.value})}
                placeholder="Ej: Compra en supermercado"
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.75rem',
                  padding: '0.75rem',
                  color: 'white',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={createTransaction}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #FF6B9D 0%, #C44569 100%)',
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  color: 'white',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Transacción */}
      {showEditModal && selectedTransaction && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }} onClick={() => setShowEditModal(false)}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '1.5rem',
            padding: '2rem',
            width: '90%',
            maxWidth: '500px'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '2rem', fontWeight: '700' }}>
              Editar Transacción
            </h2>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                Tipo
              </label>
              <select
                value={selectedTransaction.tipo}
                onChange={(e) => setSelectedTransaction({...selectedTransaction, tipo: e.target.value})}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.75rem',
                  padding: '0.75rem',
                  color: 'white',
                  fontSize: '1rem'
                }}
              >
                <option value="gasto">Gasto</option>
                <option value="ingreso">Ingreso</option>
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                Fecha
              </label>
              <input
                type="date"
                value={selectedTransaction.fecha}
                onChange={(e) => setSelectedTransaction({...selectedTransaction, fecha: e.target.value})}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.75rem',
                  padding: '0.75rem',
                  color: 'white',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                Categoría
              </label>
              <select
                value={selectedTransaction.categoria_id}
                onChange={(e) => setSelectedTransaction({...selectedTransaction, categoria_id: e.target.value})}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.75rem',
                  padding: '0.75rem',
                  color: 'white',
                  fontSize: '1rem'
                }}
              >
                <option value="">Selecciona una categoría</option>
                {categories
                  .filter(cat => cat.tipo === selectedTransaction.tipo)
                  .map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                Monto
              </label>
              <input
                type="number"
                step="0.01"
                value={selectedTransaction.monto}
                onChange={(e) => setSelectedTransaction({...selectedTransaction, monto: e.target.value})}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.75rem',
                  padding: '0.75rem',
                  color: 'white',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                Descripción
              </label>
              <input
                type="text"
                value={selectedTransaction.descripcion}
                onChange={(e) => setSelectedTransaction({...selectedTransaction, descripcion: e.target.value})}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.75rem',
                  padding: '0.75rem',
                  color: 'white',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowEditModal(false)}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={updateTransaction}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  color: 'white',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva Meta */}
      {showGoalsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }} onClick={() => setShowGoalsModal(false)}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '1.5rem',
            padding: '2rem',
            width: '90%',
            maxWidth: '500px'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '2rem', fontWeight: '700' }}>
              Nueva Meta de Ahorro
            </h2>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                Nombre de la meta
              </label>
              <input
                type="text"
                value={newGoal.nombre}
                onChange={(e) => setNewGoal({...newGoal, nombre: e.target.value})}
                placeholder="Ej: Viaje a Europa"
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.75rem',
                  padding: '0.75rem',
                  color: 'white',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                Monto objetivo
              </label>
              <input
                type="number"
                step="0.01"
                value={newGoal.monto_objetivo}
                onChange={(e) => setNewGoal({...newGoal, monto_objetivo: e.target.value})}
                placeholder="0.00"
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.75rem',
                  padding: '0.75rem',
                  color: 'white',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                Descripción (opcional)
              </label>
              <input
                type="text"
                value={newGoal.descripcion}
                onChange={(e) => setNewGoal({...newGoal, descripcion: e.target.value})}
                placeholder="Ej: Para vacaciones de verano"
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.75rem',
                  padding: '0.75rem',
                  color: 'white',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowGoalsModal(false)}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={addGoal}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #FFD93D 0%, #FFA502 100%)',
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  color: '#1a1a2e',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Crear Meta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Asignar Fondos */}
      {showAllocateModal && selectedGoal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }} onClick={() => setShowAllocateModal(false)}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            border: '2px solid #FFD93D',
            borderRadius: '1.5rem',
            padding: '2rem',
            width: '90%',
            maxWidth: '400px'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: '700' }}>
                {selectedGoal.nombre}
              </h2>
              <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.6)' }}>
                Balance disponible: <strong style={{ color: balance > 0 ? '#FFD93D' : '#FF6B9D' }}>${formatCurrency(balance)}</strong>
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                Monto a asignar
              </label>
              <input
                type="number"
                step="0.01"
                value={allocateAmount}
                onChange={(e) => setAllocateAmount(e.target.value)}
                placeholder="0.00"
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.75rem',
                  padding: '0.75rem',
                  color: 'white',
                  fontSize: '1.2rem',
                  textAlign: 'center',
                  fontWeight: '700'
                }}
                autoFocus
              />
              <div style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                Restante de la meta: ${formatCurrency(parseFloat(selectedGoal.monto_objetivo) - parseFloat(selectedGoal.monto_actual || 0))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowAllocateModal(false)}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => allocateFunds(selectedGoal.id, allocateAmount)}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #FFD93D, #FFA502)',
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  color: '#1a1a2e',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Asignar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo Presupuesto */}
      {showBudgetModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }} onClick={() => setShowBudgetModal(false)}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '1.5rem',
            padding: '2rem',
            width: '90%',
            maxWidth: '500px'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '2rem', fontWeight: '700' }}>
              Nuevo Presupuesto
            </h2>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                Categoría
              </label>
              <select
                value={newBudget.categoria_id}
                onChange={(e) => setNewBudget({...newBudget, categoria_id: e.target.value})}
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.75rem',
                  padding: '0.75rem',
                  color: 'white',
                  fontSize: '1rem'
                }}
              >
                <option value="">Selecciona una categoría</option>
                {categories
                  .filter(cat => cat.tipo === 'gasto')
                  .map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                Límite de gasto
              </label>
              <input
                type="number"
                step="0.01"
                value={newBudget.limite}
                onChange={(e) => setNewBudget({...newBudget, limite: e.target.value})}
                placeholder="0.00"
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.75rem',
                  padding: '0.75rem',
                  color: 'white',
                  fontSize: '1rem'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                  Mes
                </label>
                <select
                  value={newBudget.mes}
                  onChange={(e) => setNewBudget({...newBudget, mes: e.target.value})}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.75rem',
                    padding: '0.75rem',
                    color: 'white',
                    fontSize: '1rem'
                  }}
                >
                  {monthNames.map((month, idx) => (
                    <option key={idx} value={idx + 1}>{month}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                  Año
                </label>
                <select
                  value={newBudget.anio}
                  onChange={(e) => setNewBudget({...newBudget, anio: e.target.value})}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.75rem',
                    padding: '0.75rem',
                    color: 'white',
                    fontSize: '1rem'
                  }}
                >
                  {[2024, 2025, 2026, 2027].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowBudgetModal(false)}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={createBudget}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #5F27CD 0%, #341f97 100%)',
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  color: 'white',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Crear Presupuesto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Resumen Mensual */}
      {showMonthlyReport && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '2rem',
          overflowY: 'auto'
        }} onClick={() => setShowMonthlyReport(false)}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '1.5rem',
            padding: '2.5rem',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ margin: '0 0 1rem 0', fontSize: '2.5rem', fontWeight: '800' }}>
                📊 Resumen Mensual
              </h2>
              
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.75rem',
                    padding: '0.75rem 1rem',
                    color: 'white',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  {monthNames.map((month, idx) => (
                    <option key={idx} value={idx + 1}>{month}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '0.75rem',
                    padding: '0.75rem 1rem',
                    color: 'white',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  {[2024, 2025, 2026, 2027].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              {[
                { 
                  label: 'Ingresos', 
                  value: `${formatCurrency(currentMonthStats.income)}`, 
                  color: '#4ECDC4',
                  change: currentMonthStats.income - previousMonthStats.income,
                  icon: '💰'
                },
                { 
                  label: 'Gastos', 
                  value: `${formatCurrency(currentMonthStats.expenses)}`, 
                  color: '#FF6B9D',
                  change: currentMonthStats.expenses - previousMonthStats.expenses,
                  icon: '💸'
                },
                { 
                  label: 'Balance', 
                  value: `${formatCurrency(currentMonthStats.balance)}`, 
                  color: currentMonthStats.balance >= 0 ? '#6BCF7F' : '#FF6B9D',
                  change: currentMonthStats.balance - previousMonthStats.balance,
                  icon: '💵'
                },
                { 
                  label: 'Tasa Ahorro', 
                  value: `${currentMonthStats.savingsRate}%`, 
                  color: '#FFD93D',
                  change: currentMonthStats.savingsRate - previousMonthStats.savingsRate,
                  icon: '📈'
                }
              ].map((metric, idx) => (
                <div
                  key={idx}
                  style={{
                    background: `${metric.color}15`,
                    border: `2px solid ${metric.color}`,
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{metric.icon}</div>
                  <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '0.5rem' }}>
                    {metric.label}
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '800', color: metric.color, marginBottom: '0.5rem' }}>
                    {metric.value}
                  </div>
                  {metric.change !== 0 && !isNaN(metric.change) && (
                    <div style={{
                      fontSize: '0.85rem',
                      color: metric.change > 0 ? (metric.label === 'Gastos' ? '#FF6B9D' : '#6BCF7F') : (metric.label === 'Gastos' ? '#6BCF7F' : '#FF6B9D'),
                      fontWeight: '600'
                    }}>
                      {metric.change > 0 ? '▲' : '▼'} {metric.label === 'Tasa Ahorro' ? `${Math.abs(metric.change).toFixed(1)}%` : `${formatCurrency(Math.abs(metric.change))}`} vs mes anterior
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '1rem',
                padding: '1.5rem'
              }}>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
                  📝 Transacciones
                </h4>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#5F27CD', marginBottom: '0.5rem' }}>
                  {currentMonthStats.transactionCount}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                  Total de movimientos este mes
                </div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '1rem',
                padding: '1.5rem'
              }}>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
                  📅 Promedio Diario
                </h4>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: '#FFA502', marginBottom: '0.5rem' }}>
                  ${formatCurrency(currentMonthStats.avgDailyExpense)}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                  Gasto promedio por transacción
                </div>
              </div>

              {currentMonthStats.topExpense && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '1rem',
                  padding: '1.5rem'
                }}>
                  <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem' }}>
                    🔥 Mayor Gasto
                  </h4>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: '#FF6348', marginBottom: '0.5rem' }}>
                    ${formatCurrency(Math.abs(currentMonthStats.topExpense.amount))}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                    {currentMonthStats.topExpense.description}
                  </div>
                </div>
              )}
            </div>

            {currentMonthStats.categoryBreakdown.length > 0 && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '1rem',
                padding: '1.5rem',
                marginBottom: '2rem'
              }}>
                <h4 style={{ margin: '0 0 1.5rem 0', fontSize: '1.3rem', fontWeight: '700' }}>
                  📊 Desglose por Categorías
                </h4>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {currentMonthStats.categoryBreakdown.map((cat, idx) => {
                    const percentage = (cat.value / currentMonthStats.expenses * 100).toFixed(1);
                    return (
                      <div key={idx}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              background: COLORS[idx % COLORS.length]
                            }} />
                            <span style={{ fontWeight: '600' }}>{cat.name}</span>
                            <span style={{ 
                              fontSize: '0.85rem', 
                              color: 'rgba(255, 255, 255, 0.5)',
                              background: 'rgba(255, 255, 255, 0.1)',
                              padding: '0.15rem 0.5rem',
                              borderRadius: '0.5rem'
                            }}>
                              {cat.count} transacciones
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <span style={{ fontWeight: '700', color: COLORS[idx % COLORS.length] }}>
                              ${formatCurrency(cat.value)}
                            </span>
                            <span style={{ 
                              fontSize: '0.85rem', 
                              color: 'rgba(255, 255, 255, 0.6)',
                              minWidth: '50px',
                              textAlign: 'right'
                            }}>
                              {percentage}%
                            </span>
                          </div>
                        </div>
                        <div style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          height: '8px',
                          borderRadius: '1rem',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            background: COLORS[idx % COLORS.length],
                            height: '100%',
                            width: `${percentage}%`,
                            borderRadius: '1rem',
                            transition: 'width 0.5s ease'
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '1rem',
              padding: '1.5rem',
              marginBottom: '2rem'
            }}>
              <h4 style={{ margin: '0 0 1.5rem 0', fontSize: '1.3rem', fontWeight: '700' }}>
                📈 Comparación con Mes Anterior
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '0.5rem' }}>
                    Mes Anterior
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                    {monthNames[selectedMonth === 1 ? 11 : selectedMonth - 2]}
                  </div>
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div>Ingresos: <strong style={{ color: '#4ECDC4' }}>${formatCurrency(previousMonthStats.income)}</strong></div>
                    <div>Gastos: <strong style={{ color: '#FF6B9D' }}>${formatCurrency(previousMonthStats.expenses)}</strong></div>
                    <div>Balance: <strong style={{ color: previousMonthStats.balance >= 0 ? '#6BCF7F' : '#FF6B9D' }}>${formatCurrency(previousMonthStats.balance)}</strong></div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '0.5rem' }}>
                    Cambios
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#FFD93D' }}>
                    Variación
                  </div>
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{
                      color: (currentMonthStats.income - previousMonthStats.income) >= 0 ? '#6BCF7F' : '#FF6B9D',
                      fontWeight: '700'
                    }}>
                      {(currentMonthStats.income - previousMonthStats.income) >= 0 ? '▲' : '▼'} ${formatCurrency(Math.abs(currentMonthStats.income - previousMonthStats.income))}
                    </div>
                    <div style={{
                      color: (currentMonthStats.expenses - previousMonthStats.expenses) >= 0 ? '#FF6B9D' : '#6BCF7F',
                      fontWeight: '700'
                    }}>
                      {(currentMonthStats.expenses - previousMonthStats.expenses) >= 0 ? '▲' : '▼'} ${formatCurrency(Math.abs(currentMonthStats.expenses - previousMonthStats.expenses))}
                    </div>
                    <div style={{
                      color: (currentMonthStats.balance - previousMonthStats.balance) >= 0 ? '#6BCF7F' : '#FF6B9D',
                      fontWeight: '700'
                    }}>
                      {(currentMonthStats.balance - previousMonthStats.balance) >= 0 ? '▲' : '▼'} ${formatCurrency(Math.abs(currentMonthStats.balance - previousMonthStats.balance))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{
              padding: '1.5rem',
              background: 'linear-gradient(135deg, rgba(95, 39, 205, 0.2), rgba(52, 31, 151, 0.2))',
              border: '2px solid #5F27CD',
              borderRadius: '1rem'
            }}>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', fontWeight: '700' }}>
                💡 Insights del Mes
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {currentMonthStats.savingsRate >= 20 && (
                  <li style={{ color: '#6BCF7F' }}>¡Excelente! Estás ahorrando más del 20% de tus ingresos</li>
                )}
                {currentMonthStats.savingsRate < 10 && currentMonthStats.savingsRate >= 0 && (
                  <li style={{ color: '#FFA502' }}>Tu tasa de ahorro es baja. Intenta reducir gastos no esenciales</li>
                )}
                {currentMonthStats.balance < 0 && (
                  <li style={{ color: '#FF6B9D' }}>⚠️ Gastaste más de lo que ganaste este mes</li>
                )}
                {currentMonthStats.categoryBreakdown[0] && (
                  <li>Tu mayor gasto fue en <strong>{currentMonthStats.categoryBreakdown[0].name}</strong> (${formatCurrency(currentMonthStats.categoryBreakdown[0].value)})</li>
                )}
                {currentMonthStats.expenses > previousMonthStats.expenses && (
                  <li style={{ color: '#FFD93D' }}>Tus gastos aumentaron ${formatCurrency(currentMonthStats.expenses - previousMonthStats.expenses)} respecto al mes pasado</li>
                )}
                {currentMonthStats.income < previousMonthStats.income && (
                  <li style={{ color: '#FFA502' }}>Tus ingresos disminuyeron ${formatCurrency(previousMonthStats.income - currentMonthStats.income)} respecto al mes pasado</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Presupuesto */}
      {showEditBudgetModal && selectedBudget && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }} onClick={() => setShowEditBudgetModal(false)}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '1.5rem',
            padding: '2rem',
            width: '90%',
            maxWidth: '500px'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '2rem', fontWeight: '700' }}>
              Editar Presupuesto
            </h2>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                Categoría
              </label>
              <input
                type="text"
                value={selectedBudget.categoria_nombre}
                disabled
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.75rem',
                  padding: '0.75rem',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: '1rem',
                  cursor: 'not-allowed'
                }}
              />
              <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.4)', marginTop: '0.25rem' }}>
                No puedes cambiar la categoría. Crea un nuevo presupuesto si necesitas otra categoría.
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                Nuevo límite de gasto
              </label>
              <input
                type="number"
                step="0.01"
                value={selectedBudget.limite}
                onChange={(e) => setSelectedBudget({...selectedBudget, limite: e.target.value})}
                placeholder="0.00"
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '0.75rem',
                  padding: '0.75rem',
                  color: 'white',
                  fontSize: '1rem'
                }}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={selectedBudget.alertas}
                  onChange={(e) => setSelectedBudget({...selectedBudget, alertas: e.target.checked})}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                  Activar alertas cuando exceda el 80%
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowEditBudgetModal(false)}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={updateBudget}
                style={{
                  flex: 1,
                  background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
                  border: 'none',
                  padding: '0.75rem',
                  borderRadius: '0.75rem',
                  color: 'white',
                  fontWeight: '700',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&display=swap');
        
        select option {
          background: #1a1a2e;
          color: white;
        }

        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
        }
      `}</style>
    </div>
  );
};

export default FinanceDashboard;