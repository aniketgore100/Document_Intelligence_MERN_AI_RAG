import { WorkspaceRepository } from '../repositories/workspaceRepository.js';
import { OrganizationMembershipRepository } from '../repositories/organizationMembershipRepository.js';

// ─── Markdown → Tiptap JSON ───────────────────────────────────────────────────

function parseInline(text) {
  const parts = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', text: text.slice(lastIndex, match.index) });
    }
    if (match[0].startsWith('**')) {
      parts.push({ type: 'text', text: match[2], marks: [{ type: 'bold' }] });
    } else if (match[0].startsWith('*')) {
      parts.push({ type: 'text', text: match[3], marks: [{ type: 'italic' }] });
    } else {
      parts.push({ type: 'text', text: match[4], marks: [{ type: 'code' }] });
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push({ type: 'text', text: text.slice(lastIndex) });
  return parts.length > 0 ? parts : [{ type: 'text', text }];
}

function markdownToTiptapNodes(markdown) {
  const lines = (markdown || '').split('\n');
  const nodes = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      nodes.push({ type: 'heading', attrs: { level: headingMatch[1].length }, content: parseInline(headingMatch[2]) });
      i++; continue;
    }
    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push({ type: 'listItem', content: [{ type: 'paragraph', content: parseInline(lines[i].replace(/^[-*]\s+/, '')) }] });
        i++;
      }
      nodes.push({ type: 'bulletList', content: items });
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push({ type: 'listItem', content: [{ type: 'paragraph', content: parseInline(lines[i].replace(/^\d+\.\s+/, '')) }] });
        i++;
      }
      nodes.push({ type: 'orderedList', attrs: { start: 1 }, content: items });
      continue;
    }
    if (/^---+$/.test(line.trim())) { nodes.push({ type: 'horizontalRule' }); i++; continue; }
    if (!line.trim()) { nodes.push({ type: 'paragraph', content: [] }); i++; continue; }
    nodes.push({ type: 'paragraph', content: parseInline(line) });
    i++;
  }
  return nodes;
}

const toId = (v) => v?._id?.toString() || v?.toString();

export class WorkspaceService {
  constructor({
    workspaceRepository = new WorkspaceRepository(),
    organizationMembershipRepository = new OrganizationMembershipRepository(),
  } = {}) {
    this.workspaceRepository = workspaceRepository;
    this.organizationMembershipRepository = organizationMembershipRepository;
  }

  async resolveOrganization(userId) {
    const membership = await this.organizationMembershipRepository.findAnyActiveMembership({ userId });
    if (!membership) {
      const err = new Error('No active organization membership found');
      err.statusCode = 403;
      throw err;
    }
    return toId(membership.organization);
  }

  async list({ userId }) {
    const workspaces = await this.workspaceRepository.findByOwner(userId);
    return workspaces.map((w) => ({
      id: w._id,
      title: w.title,
      createdAt: w.createdAt,
      updatedAt: w.updatedAt,
    }));
  }

  async create({ userId, title }) {
    const organizationId = await this.resolveOrganization(userId);
    const workspace = await this.workspaceRepository.create({
      title: title?.trim() || 'Untitled Workspace',
      owner: userId,
      organization: organizationId,
      content: { type: 'doc', content: [] },
    });
    return { id: workspace._id, title: workspace.title, content: workspace.content, createdAt: workspace.createdAt, updatedAt: workspace.updatedAt };
  }

  async getById({ id, userId }) {
    const workspace = await this.workspaceRepository.findByIdAndOwner(id, userId);
    if (!workspace) {
      const err = new Error('Workspace not found');
      err.statusCode = 404;
      throw err;
    }
    return { id: workspace._id, title: workspace.title, content: workspace.content, createdAt: workspace.createdAt, updatedAt: workspace.updatedAt };
  }

  async update({ id, userId, title, content }) {
    const workspace = await this.workspaceRepository.findByIdAndOwner(id, userId);
    if (!workspace) {
      const err = new Error('Workspace not found');
      err.statusCode = 404;
      throw err;
    }
    const update = {};
    if (title !== undefined) update.title = title.trim() || 'Untitled Workspace';
    if (content !== undefined) update.content = content;
    const updated = await this.workspaceRepository.updateById(id, update);
    return { id: updated._id, title: updated.title, content: updated.content, updatedAt: updated.updatedAt };
  }

  async delete({ id, userId }) {
    const workspace = await this.workspaceRepository.findByIdAndOwner(id, userId);
    if (!workspace) {
      const err = new Error('Workspace not found');
      err.statusCode = 404;
      throw err;
    }
    await this.workspaceRepository.deleteById(id);
    return { success: true };
  }

  async appendFinding({ id, userId, finding }) {
    const workspace = await this.workspaceRepository.findByIdAndOwner(id, userId);
    if (!workspace) {
      const err = new Error('Workspace not found');
      err.statusCode = 404;
      throw err;
    }

    const content = workspace.content && workspace.content.type === 'doc'
      ? { ...workspace.content, content: Array.isArray(workspace.content.content) ? [...workspace.content.content] : [] }
      : { type: 'doc', content: [] };

    // Separator before new finding
    if (content.content.length > 0) {
      content.content.push({ type: 'paragraph', content: [] });
    }

    const para = (text) => ({ type: 'paragraph', content: text ? [{ type: 'text', text }] : [] });

    content.content.push(...markdownToTiptapNodes(finding.answer || ''));

    // Divider + trailing paragraph for cursor
    content.content.push({ type: 'horizontalRule' });
    content.content.push(para(''));

    const updated = await this.workspaceRepository.updateById(id, { content });
    return { id: updated._id, title: updated.title, content: updated.content, updatedAt: updated.updatedAt };
  }
}
