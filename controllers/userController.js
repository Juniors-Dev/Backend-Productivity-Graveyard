const { UserServices, ProjectServices } = require("../services/index");
const { db } = require("../models");
const userServices = new UserServices(db);
const projectServices = new ProjectServices(db);
