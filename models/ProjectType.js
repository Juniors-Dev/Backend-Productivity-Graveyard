/**
 * Junction Table for Project.js and Type.js
 * Each project can have one or more "types"(e.g: "burnout", “Dog ate my keyboard”, etc).
 */

module.exports = (sequelize, Sequelize) => {
  const { DataTypes } = Sequelize;

  const ProjectType = sequelize.define(
    "ProjectType",
    {
      projectId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Projects",
          key: "id",
        },
      },
      typeId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Types",
          key: "id",
        },
      },
    },
    {
      timestamps: true,
      tableName: "ProjectType",
      indexes: [
        {
          name: "project_type_unique",
          unique: true,
          fields: ["projectId", "typeId"],
        },
      ],
    }
  );
  return ProjectType;
};
