/**
 * User Model
 *
 * Represents a registered user in the system.
 * Handles identity, access, and relationships to projects, comments, etc.
 */

module.exports = (sequelize, Sequelize) => {
  const { DataTypes } = Sequelize;

  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          len: [3, 30],
        },
        set(value) {
          this.setDataValue("username", value.toLowerCase().trim());
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
        set(value) {
          this.setDataValue("email", value.toLowerCase().trim());
        },
      },
      hashedPassword: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "Bcrypt-hashed password",
      },
      avatarUrl: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: { isUrl: true },
        comment: "Optional user profile image URL",
      },
      bio: {
        type: DataTypes.TEXT,
        comment: "Optional short bio/about section",
      },
      roleId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Allow role to be removed without deleting the user
        defaultValue: 1, // Assuming 1 will be a default user role
      },
    },
    {
      timestamps: true,
      tableName: "Users",
      indexese: [{ fields: ["roleId"] }],
    }
  );

  User.associate = (models) => {
    User.belongsTo(models.Role, {
      foreignKey: "roleId",
      onDelete: "SET NULL",
    });
    User.hasMany(models.Project, {
      foreignKey: "userId",
      onDelete: "CASCADE",
    });
    User.hasMany(models.Comment, {
      foreignKey: "userId",
      onDelete: "SET NULL",
    });
    User.hasMany(models.Upvote, {
      foreignKey: "userId",
      onDelete: "SET NULL",
    });
    User.belongsToMany(models.Achievement, {
      through: "UserAchievements",
      foreignKey: "userId",
      otherKey: "achievementId",
      as: "achievements",
      onDelete: "CASCADE",
    });
  };
  return User;
};
