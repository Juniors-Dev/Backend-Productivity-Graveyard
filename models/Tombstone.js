/**
 * Tombstone Model
 *
 * Optional feature.
 * Represents a visual or template style for a project's memorial/burial.
 */

module.exports = (sequelize, Sequelize) => {
  const { DataTypes } = Sequelize;

  const Tombstone = sequelize.define(
    "Tombstone",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      imageUrl: {
        type: DataTypes.STRING,
        comment: "URL to the tombstone image asset",
      },
    },
    {
      timestamps: true,
      tableName: "Tombstones",
    }
  );

  Tombstone.associate = (models) => {
    Tombstone.hasMany(models.Project, {
      foreignKey: "tombstoneId",
      onDelete: "SET NULL",
    });
  };
  return Tombstone;
};
