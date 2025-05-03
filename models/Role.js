module.exports = (sequelize, Sequelize) => {
  const { DataTypes } = Sequelize;

  const Role = sequelize.define(
    "Role",
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
      },
      permissionLevel: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: "Numeric access level representing permission hierarchy (higher = more access)",
      },
    },
    {
      timestamps: true,
      tableName: "Roles",
    }
  );

  Role.associate = (models) => {
    Role.hasMany(models.User, {
      foreignKey: "roleId",
      as: "users",
      onDelete: "RESTRICT",
    });
  };
  return Role;
};
