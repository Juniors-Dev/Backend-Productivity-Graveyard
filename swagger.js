const { ValidationError } = require("sequelize");

const swaggerAutogen = require("swagger-autogen")();
require("dotenv").config();

const host = process.env.HOST && process.env.PORT ? `${process.env.HOST}:${process.env.PORT}` : "localhost:3000";

const doc = {
  info: {
    version: "1.0.0",
    title: "Noroff EP e-commerce",
    description: " Noroff EP e-commerce API documentation",
  },
  host: host,
  schemes: ["http", "https"],
  security: {
    bearerAuth: [],
  },

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        in: "header",
        name: "Authorization",
        description: "Bearer token to access these api endpoints",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  securityDefinitions: {
    Bearer: {
      type: "apiKey",
      name: "Authorization",
      in: "header",
    },
  },
  definitions: {},
};

const outputFile = "./swagger-output.json";
const endpointsFiles = ["./app.js"];
swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
  require("./bin/www");
});
