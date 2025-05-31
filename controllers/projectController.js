var { db } = require("../models");
var { ProjectService, TypeService, TombstoneService } = require("../services");
var projectService = new ProjectService(db);
var typeService = new TypeService(db);
var tombstoneService = new TombstoneService(db);
var { successResponse, errorResponse, createError } = require("../utilities");
var { getLimitOffset } = require("../utilities/getPagination.js");

async function getAll(req, res) {
  const { limit, offset } = getLimitOffset(req);
  const { status, orderBy, order, userId, types, query } = req.query;
  const options = {
    status,
    orderBy,
    order,
    userId,
    types: types ? types.split(",") : [],
    currentUserId: req.user?.id || null,
    query: query || null,
  };

  const { count, rows } = await projectService.getAll(limit, offset, options);

  res.status(200).json(
    successResponse({
      message: "Success",
      data: rows,
      statusCode: 200,
      meta: {
        total: count,
        limit,
        offset,
        hasNext: count > limit + offset,
      },
    })
  );
}

async function getOneId(req, res) {
  const project = await projectService.getOneId(req.params.id, req.user?.id);

  res.status(200).json(
    successResponse({
      message: "Success",
      data: project,
      statusCode: 200,
    })
  );
}

async function create(req, res) {
  const {
    name,
    description,
    eulogy,
    causeOfDeath,
    startDate,
    endDate,
    types = [],
    tombstoneId = null,
    status = "buried",
  } = req.body;
  const userId = req.user.id;
  const project = await projectService.create({
    name,
    description,
    eulogy,
    causeOfDeath,
    startDate,
    endDate,
    userId,
    types,
    tombstoneId,
    status,
  });

  res.status(201).json(
    successResponse({
      message: "Project created successfully",
      data: project,
      statusCode: 201,
    })
  );
}

async function update(req, res) {
  const { id } = req.params;
  const args = req.body;
  const project = await projectService.update(id, args);

  res.status(200).json(
    successResponse({
      message: "Project updated successfully",
      data: project,
      statusCode: 200,
    })
  );
}

async function removeType(req, res) {
  const { id } = req.params;
  const { typeId } = req.body;
  const project = await projectService.removeType(id, typeId);

  res.status(200).json(
    successResponse({
      message: "Type removed from project successfully",
      data: project,
      statusCode: 200,
    })
  );
}

async function getAllTypes(req, res) {
  const types = await typeService.getAll();
  res.status(200).json(
    successResponse({
      message: "Success",
      data: types,
      statusCode: 200,
    })
  );
}

async function addType(req, res) {
  const { id } = req.params;
  const { typeId } = req.body;
  const project = await projectService.addType(id, typeId);

  res.status(200).json(
    successResponse({
      message: "Type added to project successfully",
      data: project,
      statusCode: 200,
    })
  );
}

async function getAllTombstones(req, res) {
  const tombstones = await tombstoneService.getAll();
  res.status(200).json(
    successResponse({
      message: "Success",
      data: tombstones,
      statusCode: 200,
    })
  );
}

async function deleteProject(req, res) {
  const { id } = req.params;
  const deleted = await projectService.delete(id);

  res.status(200).json(
    successResponse({
      message: "Project deleted successfully",
      statusCode: 200,
    })
  );
}

module.exports = {
  getAll,
  getOneId,
  create,
  update,
  getAllTypes,
  removeType,
  addType,
  deleteProject,
  getAllTombstones,
};
