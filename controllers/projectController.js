var { db } = require("../models");
var { ProjectService, TypeService } = require("../services");
var projectService = new ProjectService(db);
var typeService = new TypeService(db);
var { successResponse, errorResponse } = require("../utilities/response.js");

async function getAll(req, res) {
  const projects = await projectService.getAll();
  res.status(200).json(
    successResponse({
      message: "Success",
      data: projects,
      statusCode: 200,
    })
  );
}

async function getOneId(req, res) {
  const project = await projectService.getOneId(req.params.id);
  if (!project) {
    res.status(404).json(
      errorResponse({
        message: "Project not found",
        statusCode: 404,
      })
    );
  }

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
    userId,
    startDate,
    endDate,
    types = [],
    tombstoneId = null,
    status = "buried",
  } = req.body;
  //const userId = req.user.id;

  try {
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
  } catch (error) {
    res.status(500).json(
      errorResponse({
        message: "Error creating project",
        statusCode: 500,
        errors: error.message,
      })
    );
  }
}

async function update(req, res) {
  const { id } = req.params;
  const args = req.body;

  try {
    const project = await projectService.update(id, args);
    if (!project) {
      return res.status(404).json(
        errorResponse({
          message: "Project not found",
          statusCode: 404,
        })
      );
    }

    res.status(200).json(
      successResponse({
        message: "Project updated successfully",
        data: project,
        statusCode: 200,
      })
    );
  } catch (error) {
    res.status(500).json(
      errorResponse({
        message: "Error updating project",
        statusCode: 500,
        errors: error.message,
      })
    );
  }
}

async function removeType(req, res) {
  const { id } = req.params;
  const { typeId } = req.body;
  try {
    const project = await projectService.removeType(id, typeId);
    if (!project) {
      return res.status(404).json(
        errorResponse({
          message: "Project not found",
          statusCode: 404,
        })
      );
    }

    res.status(200).json(
      successResponse({
        message: "Type removed from project successfully",
        data: project,
        statusCode: 200,
      })
    );
  } catch (error) {
    res.status(500).json(
      errorResponse({
        message: "Error removing type from project",
        statusCode: 500,
        errors: error.message,
      })
    );
  }
}

async function getAllTypes(req, res) {
  try {
    const types = await typeService.getAll();
    res.status(200).json(
      successResponse({
        message: "Success",
        data: types,
        statusCode: 200,
      })
    );
  } catch (error) {
    res.status(500).json(
      errorResponse({
        message: "Error fetching types",
        statusCode: 500,
        errors: error.message,
      })
    );
  }
}

async function addType(req, res) {
  const { id } = req.params;
  const { typeId } = req.body;
  try {
    const project = await projectService.addType(id, typeId);
    if (!project) {
      return res.status(404).json(
        errorResponse({
          message: "Project not found",
          statusCode: 404,
        })
      );
    }

    res.status(200).json(
      successResponse({
        message: "Type added to project successfully",
        data: project,
        statusCode: 200,
      })
    );
  } catch (error) {
    res.status(500).json(
      errorResponse({
        message: "Error adding type to project",
        statusCode: 500,
        errors: error.message,
      })
    );
  }
}

async function deleteProject(req, res) {
  const { id } = req.params;
  try {
    const deleted = await projectService.delete(id);
    if (!deleted) {
      return res.status(404).json(
        errorResponse({
          message: "Project not found",
          statusCode: 404,
        })
      );
    }

    res.status(200).json(
      successResponse({
        message: "Project deleted successfully",
        statusCode: 200,
      })
    );
  } catch (error) {
    res.status(500).json(
      errorResponse({
        message: "Error deleting project",
        statusCode: 500,
        errors: error.message,
      })
    );
  }
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
};
