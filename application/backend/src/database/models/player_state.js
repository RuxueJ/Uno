import { DataTypes, Model } from 'sequelize';

export default function (sequelize) {
    class PlayerState extends Model {
    }

    PlayerState.init({
        playerstateId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        roomId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        playerHandCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 7,
        },
        playerHand: {
            type: DataTypes.JSON,
            allowNull: false
        }
      }, {
        modelName: 'playerState',
        tableName: 'player_state',
        sequelize,
        timestamps: false
      });
      
}