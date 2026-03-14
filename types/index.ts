// ============================================
// 全局类型定义
// ============================================

export type CaseStatus = 'draft' | 'preparing' | 'trial' | 'closed';
export type PartyRole = 'plaintiff' | 'defendant' | 'third_party';
export type DocumentType = 'complaint' | 'defense' | 'lawyer_letter' | 'opinion' | 'contract_review' | 'appeal';

export interface CaseInfo {
  id: string;
  name: string;
  caseNumber: string | null;
  caseType: string;
  status: CaseStatus;
  description: string | null;
  amount: number | null;
  court: string | null;
  filingDate: string | null;
  trialDate: string | null;
  createdAt: string;
  updatedAt: string;
  parties?: PartyInfo[];
}

export interface PartyInfo {
  id: string;
  name: string;
  role: PartyRole;
  phone: string | null;
  lawyer: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface DocumentInfo {
  id: string;
  title: string;
  type: DocumentType;
  content: string | null;
  status: string;
  caseId: string | null;
  createdAt: string;
}

export const CASE_TYPE_OPTIONS = [
  '合同纠纷', '劳动争议', '知识产权', '人身损害',
  '婚姻家庭', '继承纠纷', '房屋买卖', '民间借贷',
  '交通事故', '公司纠纷', '行政诉讼', '刑事辩护', '其他',
] as const;

export const CASE_STATUS_MAP: Record<CaseStatus, { label: string; color: string }> = {
  draft:     { label: '草稿',   color: 'gray' },
  preparing: { label: '准备中', color: 'blue' },
  trial:     { label: '审理中', color: 'amber' },
  closed:    { label: '已结案', color: 'green' },
};

export const DOC_TYPE_MAP: Record<DocumentType, { label: string; icon: string }> = {
  complaint:       { label: '民事起诉状',   icon: '📄' },
  defense:         { label: '民事答辩状',   icon: '📋' },
  lawyer_letter:   { label: '律师函',       icon: '✉️' },
  opinion:         { label: '法律意见书',   icon: '📝' },
  contract_review: { label: '合同审查报告', icon: '📑' },
  appeal:          { label: '上诉状',       icon: '⚖️' },
};
