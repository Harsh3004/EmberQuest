const { z } = require('zod');

// Purchase takes no body (itemId rides the URL); equip is an explicit boolean
// so clients can both equip and unequip without a toggle-race.
const equipSchema = z.object({
  equipped: z.boolean({ required_error: 'Equipped must be true or false' }),
});

module.exports = { equipSchema };
