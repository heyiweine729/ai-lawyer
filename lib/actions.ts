import { prisma } from './prisma';

// ============================================
// 案件 CRUD
// ============================================

// 获取所有案件列表
export async function getCases(options?: {
  search?: string;
  status?: string;
}) {
  const where: any = {};

  if (options?.status && options.status !== 'all') {
    where.status = options.status;
  }

  if (options?.search) {
    where.OR = [
      { name: { contains: options.search } },
      { caseNumber: { contains: options.search } },
    ];
  }

  return prisma.case.findMany({
    where,
    include: {
      parties: true,
      _count: {
        select: { documents: true, chatSessions: true, evidence: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

// 获取单个案件详情
export async function getCaseById(id: string) {
  return prisma.case.findUnique({
    where: { id },
    include: {
      parties: true,
      documents: { orderBy: { updatedAt: 'desc' } },
      evidence: { orderBy: { createdAt: 'desc' } },
      timeline: { orderBy: { date: 'asc' } },
      chatSessions: { orderBy: { updatedAt: 'desc' }, take: 5 },
    },
  });
}

// 创建案件
export async function createCase(data: {
  name: string;
  caseType: string;
  caseNumber?: string;
  description?: string;
  amount?: number;
  court?: string;
  status?: string;
  aiAnalysis?: string;
  parties?: { name: string; role: string; description?: string }[];
  timelineEvents?: { date: Date; title: string; description?: string }[];
}) {
  return prisma.case.create({
    data: {
      name: data.name,
      caseType: data.caseType,
      caseNumber: data.caseNumber,
      description: data.description,
      amount: data.amount,
      court: data.court,
      status: data.status || 'draft',
      aiAnalysis: data.aiAnalysis,
      parties: data.parties
        ? {
            create: data.parties.map((p) => ({
              name: p.name,
              role: p.role,
            })),
          }
        : undefined,
      timeline: data.timelineEvents
        ? {
            create: data.timelineEvents.map((e) => ({
              date: e.date,
              title: e.title,
              description: e.description,
            })),
          }
        : undefined,
    },
    include: { parties: true, timeline: true },
  });
}

// 更新案件
export async function updateCase(
  id: string,
  data: {
    name?: string;
    caseType?: string;
    caseNumber?: string;
    description?: string;
    amount?: number;
    court?: string;
    judge?: string;
    status?: string;
    filingDate?: Date;
    trialDate?: Date;
    closedDate?: Date;
    aiAnalysis?: string;
  }
) {
  return prisma.case.update({ where: { id }, data });
}

// 删除案件（先删除关联数据）
export async function deleteCase(id: string) {
  return prisma.$transaction(async (tx) => {
    await tx.party.deleteMany({ where: { caseId: id } });
    await tx.evidence.deleteMany({ where: { caseId: id } });
    await tx.timelineEvent.deleteMany({ where: { caseId: id } });
    await tx.message.deleteMany({
      where: { session: { caseId: id } },
    });
    await tx.chatSession.deleteMany({ where: { caseId: id } });
    await tx.document.deleteMany({ where: { caseId: id } });
    return tx.case.delete({ where: { id } });
  });
}

// ============================================
// 统计数据（工作台用）
// ============================================

export async function getDashboardStats() {
  const [total, preparing, trial, closed, recentCases, draftDocs] =
    await Promise.all([
      prisma.case.count(),
      prisma.case.count({ where: { status: 'preparing' } }),
      prisma.case.count({ where: { status: 'trial' } }),
      prisma.case.count({ where: { status: 'closed' } }),
      prisma.case.findMany({
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: { parties: true },
      }),
      prisma.document.count({ where: { status: 'draft' } }),
    ]);

  return {
    total,
    active: preparing + trial,
    preparing,
    trial,
    closed,
    draftDocs,
    recentCases,
  };
}

// ============================================
// 文书 CRUD
// ============================================

export async function getDocuments(options?: { caseId?: string }) {
  const where: any = {};
  if (options?.caseId) where.caseId = options.caseId;

  return prisma.document.findMany({
    where,
    include: { case: { select: { name: true } } },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function createDocument(data: {
  title: string;
  type: string;
  content?: string;
  caseId?: string;
}) {
  return prisma.document.create({ data });
}

export async function updateDocument(
  id: string,
  data: { title?: string; content?: string; status?: string }
) {
  return prisma.document.update({ where: { id }, data });
}

// ============================================
// 对话会话
// ============================================

export async function getChatSessions() {
  return prisma.chatSession.findMany({
    include: {
      _count: { select: { messages: true } },
      case: { select: { name: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function createChatSession(data: {
  title: string;
  caseId?: string;
}) {
  return prisma.chatSession.create({ data });
}

export async function getChatMessages(sessionId: string) {
  return prisma.message.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function addChatMessage(data: {
  sessionId: string;
  role: string;
  content: string;
}) {
  // 更新会话的 updatedAt
  await prisma.chatSession.update({
    where: { id: data.sessionId },
    data: { updatedAt: new Date() },
  });

  return prisma.message.create({ data });
}
