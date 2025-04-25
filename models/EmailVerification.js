module.exports = (sequelize, Sequelize) => {
  const { DataTypes } = Sequelize;

  const EmailVerification = sequelize.define(
    "EmailVerification",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        }
      },
      token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      newEmail: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isEmail: true
        }
      },
      type: {
        type: DataTypes.ENUM('email_verification', 'email_change', 'password_reset'),
        allowNull: false
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      used: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    },
    {
      timestamps: true,
      tableName: "EmailVerifications",
      indexes: [
        { fields: ["userId"] },
        { fields: ["token"] },
        { fields: ["expiresAt"] }
      ]
    }
  );

  EmailVerification.associate = (models) => {
    EmailVerification.belongsTo(models.User, {
      foreignKey: "userId",
      onDelete: "CASCADE"
    });
  };

  return EmailVerification;
}; 