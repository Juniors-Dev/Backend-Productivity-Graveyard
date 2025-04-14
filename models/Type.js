/**
 * Type Model
 *
 * Represents categories/death types for projects (classifies why projects were abandoned/buried).
 *
 * @note Could add `iconUrl` field if that's something frontend wants.
 */

module.exports = (sequelize, Sequelize) => {
  const { DataTypes } = Sequelize;

  const Type = sequelize.define(
    "Type",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        comment: "Label for the death type/category",
      },
    },
    {
      timestamps: true,
      tableName: "Types",
    }
  );

  Type.associate = (models) => {
    Type.belongsToMany(models.Project, {
      through: "ProjectTags",
      foreignKey: "typeId",
      otherKey: "projectId",
      as: "projects",
      onDelete: "CASCADE",
    });
  };
  return Type;
};
