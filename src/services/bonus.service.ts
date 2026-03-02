import { BonusTransaction } from '../models/BonusTransaction';
import { Op, Sequelize } from 'sequelize';
import { sequelize } from "../db";
import { Transaction } from 'sequelize';

type AppError = Error & { status?: number };

function createAppError(message: string, status: number): AppError {
  const error = new Error(message) as AppError;
  error.status = status;
  return error;
}

export async function getUserBalance(userId: string, transaction?:Transaction): Promise<number> {
  const accruals = await BonusTransaction.findAll({
    where: {
      user_id: userId,
      expires_at: {
        [Op.lte]: Sequelize.literal('NOW()')
      }
    },
    transaction
  }, );


  const balance = accruals.reduce((sum, tx) => {
    if(tx.type === 'accrual') {
      return sum + tx.amount;
    } else if (tx.type === 'spend') {
      return sum - tx.amount;
    }
    return  sum;
  }, 0);

  // TODO: учитывать expires_at
  // TODO: учитывать spend
  // TODO: учитывать конкурентные списания
  return balance;
}

export async function spendBonus(userId: string, amount: number, idempotencyKey: string) {
  // Legacy-набросок: намеренно наивная реализация для задания.
  // Здесь специально нет транзакции, защиты от гонок и идемпотентности.


  let transaction: Transaction = await sequelize.transaction();
  let isDuplicate:boolean = false;
  try {
    let recordForCurrentUser = await checkExistUserIdWithIdempotencyKey(userId, idempotencyKey, transaction );
    isDuplicate = recordForCurrentUser !== null;

    if (recordForCurrentUser !== null && recordForCurrentUser?.amount !== amount) {
      await transaction.rollback();
      return {
        success: false,
        error: 'Record for current user exist',
        code: 409
      };
    }

    const balance = await getUserBalance(userId, transaction);
    if (balance < amount) {
      await transaction.rollback();
      return {
        success: false,
        error: 'Not enough bonus',
        code: 400
      };
    }


    const  newBonus = await BonusTransaction.create({
      user_id: userId,
      type: 'spend',
      amount,
      expires_at: new Date(),
      request_id: idempotencyKey,
    },{ transaction: transaction });

    await transaction.commit();
    return {
      success: true,
      data: newBonus,
      duplicate: isDuplicate,
      code: 200,
      message: 'Транзакция успешно выполнена'
    };
    
  } catch (error: unknown) {
    await transaction.rollback();
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

}

async function checkExistUserIdWithIdempotencyKey(userId: string, idempotencyKey:string,  transaction?: Transaction){

  const user = await BonusTransaction.findOne({
    where: {
      user_id: userId,
      request_id: idempotencyKey,
      type: 'spend'
    },
    transaction
  });
  return user;
}
 export async function getBonusWithExpiredDateAndCheckIt() {
   const bonuses = await BonusTransaction.findAll({
     where: {
       expires_at: { [Op.lt]: new Date() },
       type: 'spend',
     }

   });

   let arrExpireBonusId:string[] = [];
   bonuses.forEach((value, index) => {
     if(value.request_id !== null && value.request_id.includes("expire:")) {
       const index = value.request_id.indexOf(':');
       const result = value.request_id.slice(index + 1).trim();
       arrExpireBonusId.push(result);
     }

   })

   if(bonuses.length !== 0) {
     for (const item of bonuses) {
       const key = bonuses.indexOf(item);
       if(!arrExpireBonusId.includes(item.id) && ( item.request_id!== null && !item.request_id.includes("expire:"))) {

        await createRecordExpireBonus(item);
       }
     }
   }
 }
 async function createRecordExpireBonus(bonus: BonusTransaction) {
  try {
    const record = await BonusTransaction.create({
      user_id: bonus.user_id,
      type: 'spend',
      amount: bonus.amount,
      expires_at: new Date(),
      request_id: "expire:" + bonus.id,
    });

    return record;
  } catch (error) {
    throw createAppError('Error ', 400);
  }

 }

// module.exports = { spendBonus };
