/**
 * ProjectTag Model
 *
 * Junction Table for Project.js and Type.js
 * Each project can have one or more "types"(e.g: "burnout", “Dog ate my keyboard”, etc).
 *
 * @note Removed ID field — using a composite primary key [projectId + typeId] instead.
 */

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
