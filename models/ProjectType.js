// Junction Table for Project.js and Type.js

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
      tableName: "ProjectTypes",
      indexes: [
        {
          name: "project_types_unique",
          unique: true,
          fields: ["projectId", "typeId"],
        },
      ],
    }
  );
  return ProjectType;
};
