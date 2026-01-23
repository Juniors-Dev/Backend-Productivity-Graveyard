const swaggerJSDoc = require("swagger-jsdoc");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

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
  apis: ["./docs/*.js", "./routes/*.js"], // legg inn din path her
};

const swaggerSpec = swaggerJSDoc(options);
if (process.env.OUTPUT_SWAGGER === "true") {
  const outputPath = path.join(__dirname, "./swagger-output.json");
  fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2));
}
module.exports = swaggerSpec;
