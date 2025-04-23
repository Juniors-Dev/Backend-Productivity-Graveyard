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
      firstName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      fullName: {
        type: DataTypes.VIRTUAL,
        get() {
          return `${this.firstName} ${this.lastName || ""}`;
        },
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          len: [3, 30],
        },
      },
      displayName: {
        type: DataTypes.STRING,
        allowNull: false,
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
      salt: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "Bcrypt salt for password hashing",
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
        allowNull: false,
        defaultValue: 1,
      },
    },
    {
      paranoid: true,
      timestamps: true,
      tableName: "Users",
      indexese: [{ fields: ["roleId"] }, { fields: ["email"] }],
    }
  );

  User.associate = (models) => {
    User.belongsTo(models.Role, {
      foreignKey: "roleId",
      onDelete: "RESTRICT",
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
      onDelete: "CASCADE",
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
