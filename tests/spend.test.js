import {spendBonus} from '../src/services/bonus.service';
jest.mock('../src/services/bonus.service');

const expectedResult = {
 success: true,
 data: {
  user_id: '123',
  type: 'spend',
  amount: 10,
  request_id: "242-23423-234-2343"
 },
 duplicate: false,
 code: 200,
 message: 'Транзакция успешно выполнена'
};
test('Первое списание средств', async () => {
 spendBonus.mockResolvedValue(expectedResult);
 const spendBonusResult = await spendBonus('123', 10, "242-23423-234-2343");
 expect(spendBonusResult).toEqual({"code": 200, "data": {"amount": 10, "request_id": "242-23423-234-2343", "type": "spend", "user_id": "123"}, "duplicate": false, "message": "Транзакция успешно выполнена", "success": true});

});




