import { DataTypes, Model } from 'sequelize';

export default function (sequelize) {
    class GameState extends Model {
    }

    GameState.init({
        gamestateId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            primaryKey: true,
            autoIncrement: true,
        },
        roomId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        currentPlayerTurn: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,        //1st index in player_orders arr
        },
        direction: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        playerOrder: {
            type: DataTypes.ARRAY(DataTypes.INTEGER),
            allowNull: true,
        },
        drawAmount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        drawDeck: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        discardDeck: {
            type: DataTypes.JSON,
            allowNull: true,
        },
        discardDeckTopCard: {
            type: DataTypes.JSON,
            allowNull: true,
        },
      }, {
        modelName: 'gameState',
        tableName: 'game_state',
        sequelize,
        timestamps: false
      });
      
}