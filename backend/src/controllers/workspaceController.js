import { WorkspaceService } from '../services/workspaceService.js';

const workspaceService = new WorkspaceService();

const uid = (req) => req.user?._id || req.user?.id || null;

export const listWorkspaces = async (req, res, next) => {
  try {
    const workspaces = await workspaceService.list({ userId: uid(req) });
    return res.status(200).json({ workspaces });
  } catch (error) {
    next(error);
  }
};

export const createWorkspace = async (req, res, next) => {
  try {
    const workspace = await workspaceService.create({ userId: uid(req), title: req.body.title });
    return res.status(201).json({ workspace });
  } catch (error) {
    next(error);
  }
};

export const getWorkspace = async (req, res, next) => {
  try {
    const workspace = await workspaceService.getById({ id: req.params.id, userId: uid(req) });
    return res.status(200).json({ workspace });
  } catch (error) {
    next(error);
  }
};

export const updateWorkspace = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const workspace = await workspaceService.update({ id: req.params.id, userId: uid(req), title, content });
    return res.status(200).json({ workspace });
  } catch (error) {
    next(error);
  }
};

export const deleteWorkspace = async (req, res, next) => {
  try {
    await workspaceService.delete({ id: req.params.id, userId: uid(req) });
    return res.status(200).json({ message: 'Workspace deleted' });
  } catch (error) {
    next(error);
  }
};

export const appendFinding = async (req, res, next) => {
  try {
    const workspace = await workspaceService.appendFinding({
      id: req.params.id,
      userId: uid(req),
      finding: req.body,
    });
    return res.status(200).json({ workspace });
  } catch (error) {
    next(error);
  }
};
