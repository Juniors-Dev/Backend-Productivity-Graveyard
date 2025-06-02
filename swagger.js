const swaggerJSDoc = require("swagger-jsdoc");
require("dotenv").config();

const host = process.env.HOST && process.env.PORT ? `${process.env.HOST}:${process.env.PORT}` : "localhost:3000";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Noroff EP e-commerce",
      version: "1.0.0",
      description: "Productivity Graveyard API documentation",
    },
    servers: [
      {
        url: `http://${host}`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./routes/*.js", "./docs/*.js"], // legg inn din path her
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
