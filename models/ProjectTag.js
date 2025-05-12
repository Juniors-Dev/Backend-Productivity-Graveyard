// Junction Table for Project.js and Type.js

module.exports = (sequelize, Sequelize) => {
  const { DataTypes } = Sequelize;

  const ProjectTag = sequelize.define(
    "ProjectTag",
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
      tableName: "ProjectTags",
      indexes: [
        {
          name: "project_type_unique",
          unique: true,
          fields: ["projectId", "typeId"],
        },
      ],
    }
  );
  return ProjectTag;
};
