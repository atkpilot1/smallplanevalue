import { z } from 'zod'
import { matchPromo, promoSessionId } from '~/utils/promo'
import { requireAuthUser } from '../utils/supabase'
import { grantCredits } from '../utils/valuationAccess'

const bodySchema = z.object({
  code: z.string().trim().min(1).max(40),
})

export default defineEventHandler(async (event) => {
  const user = await requireAuthUser(event)
  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Enter a code.' })
  }

  const promo = matchPromo(parsed.data.code)
  if (!promo) {
    throw createError({ statusCode: 400, statusMessage: 'That code isn’t valid.' })
  }

  const sessionId = promoSessionId(promo.code, user.id)
  const status = await grantCredits(user.id, promo.credits, sessionId, sessionId)
  if (status.granted !== true) {
    throw createError({
      statusCode: 409,
      statusMessage: 'This code was already used on this account.',
    })
  }

  return {
    granted: true,
    credits: promo.credits,
    credit_balance: status.credit_balance,
    valuation_count: status.valuation_count,
  }
})
