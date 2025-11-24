import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// --- Rotas de Transações ---

app.get('/transactions', async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { date: 'desc' }
    });
    // Parse attachments JSON string back to object
    const formatted = transactions.map(t => ({
      ...t,
      attachments: JSON.parse(t.attachments)
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar transações' });
  }
});

app.post('/transactions', async (req, res) => {
  try {
    const { date, type, desc, amount, category, attachments } = req.body;
    const transaction = await prisma.transaction.create({
      data: {
        date, type, desc, amount: Number(amount), category,
        attachments: JSON.stringify(attachments || [])
      }
    });
    res.json({ ...transaction, attachments: JSON.parse(transaction.attachments) });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar transação' });
  }
});

app.delete('/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.transaction.delete({ where: { id: Number(id) } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar transação' });
  }
});

app.put('/transactions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, type, desc, amount, category, attachments } = req.body;
    const transaction = await prisma.transaction.update({
      where: { id: Number(id) },
      data: {
        date, type, desc, amount: Number(amount), category,
        attachments: JSON.stringify(attachments || [])
      }
    });
    res.json({ ...transaction, attachments: JSON.parse(transaction.attachments) });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar transação' });
  }
});

// --- Rotas de Moradores ---

app.get('/residents', async (req, res) => {
  const residents = await prisma.resident.findMany();
  res.json(residents);
});

app.post('/residents', async (req, res) => {
  const resident = await prisma.resident.create({ data: req.body });
  res.json(resident);
});

app.put('/residents/:id', async (req, res) => {
  const { id } = req.params;
  const resident = await prisma.resident.update({
    where: { id: Number(id) },
    data: req.body
  });
  res.json(resident);
});

app.delete('/residents/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.resident.delete({ where: { id: Number(id) } });
  res.json({ success: true });
});

// --- Rotas de Férias ---

app.get('/vacations', async (req, res) => {
  const vacations = await prisma.vacationNotice.findMany();
  res.json(vacations);
});

app.post('/vacations', async (req, res) => {
  const vacation = await prisma.vacationNotice.create({ data: req.body });
  res.json(vacation);
});

app.delete('/vacations/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.vacationNotice.delete({ where: { id: Number(id) } });
  res.json({ success: true });
});

app.put('/vacations/:id', async (req, res) => {
    const { id } = req.params;
    const vacation = await prisma.vacationNotice.update({
      where: { id: Number(id) },
      data: req.body
    });
    res.json(vacation);
});

// --- Rotas de Aprovações (Orçamentos) ---

app.get('/proposals', async (req, res) => {
  const proposals = await prisma.budgetProposal.findMany();
  res.json(proposals);
});

app.post('/proposals', async (req, res) => {
  const proposal = await prisma.budgetProposal.create({ data: req.body });
  res.json(proposal);
});

app.put('/proposals/:id/vote', async (req, res) => {
  const { id } = req.params;
  const { type } = req.body; // 'for' or 'against'
  
  const updateData = type === 'for' 
    ? { votesFor: { increment: 1 } }
    : { votesAgainst: { increment: 1 } };

  const proposal = await prisma.budgetProposal.update({
    where: { id: Number(id) },
    data: updateData
  });
  res.json(proposal);
});

app.put('/proposals/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'approved' or 'rejected'
  const proposal = await prisma.budgetProposal.update({
    where: { id: Number(id) },
    data: { status }
  });
  res.json(proposal);
});

// --- Rotas de Ideias ---

app.get('/ideas', async (req, res) => {
  const ideas = await prisma.improvementIdea.findMany();
  // Formatar o retorno para bater com o frontend structure
  const formatted = ideas.map(i => ({
    id: i.id,
    title: i.title,
    description: i.description,
    authorUnit: i.authorUnit,
    createdAt: i.createdAt,
    votes: {
      low: i.votesLow,
      medium: i.votesMedium,
      high: i.votesHigh
    }
  }));
  res.json(formatted);
});

app.post('/ideas', async (req, res) => {
  const { title, description, authorUnit, createdAt } = req.body;
  const idea = await prisma.improvementIdea.create({
    data: {
      title, description, authorUnit, createdAt,
      votesLow: 0, votesMedium: 0, votesHigh: 0
    }
  });
  // Return formatted
  res.json({
    ...idea,
    votes: { low: 0, medium: 0, high: 0 }
  });
});

app.delete('/ideas/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.improvementIdea.delete({ where: { id: Number(id) } });
  res.json({ success: true });
});

app.put('/ideas/:id/vote', async (req, res) => {
  const { id } = req.params;
  const { priority } = req.body; // 'low', 'medium', 'high'
  
  let updateData = {};
  if (priority === 'low') updateData = { votesLow: { increment: 1 } };
  if (priority === 'medium') updateData = { votesMedium: { increment: 1 } };
  if (priority === 'high') updateData = { votesHigh: { increment: 1 } };

  const idea = await prisma.improvementIdea.update({
    where: { id: Number(id) },
    data: updateData
  });
  
  res.json({
      ...idea,
      votes: {
          low: idea.votesLow,
          medium: idea.votesMedium,
          high: idea.votesHigh
      }
  });
});

// Inicialização
app.listen(PORT, () => {
  console.log(`🚀 Backend CondoManager rodando em http://localhost:${PORT}`);
  console.log(`📂 Banco de dados SQLite inicializado`);
});