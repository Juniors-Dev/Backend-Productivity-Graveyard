module.exports = (sequelize, Sequelize) => {
  const { DataTypes } = Sequelize;

  const Token = sequelize.define(
    "Token",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM("email_verification", "email_change", "password_reset"),
        allowNull: false,
      },
      tokenHash: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      usedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      ipAddress: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      timestamps: true,
      tableName: "Tokens",
      paranoid: false,
      indexes: [{ fields: ["tokenHash"] }, { fields: ["userId", "type"] }],
    }
  );

  Token.associate = (models) => {
    Token.belongsTo(models.User, {
      foreignKey: "userId",
      onDelete: "CASCADE",
    });
  };

  return Token;
};
