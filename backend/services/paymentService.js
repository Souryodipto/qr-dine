/**
 * Payment Service — Abstraction layer for Stripe / Razorpay
 * Switch payment provider by changing the implementation here only.
 */

const stripe = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_your_stripe_key'
  ? require('stripe')(process.env.STRIPE_SECRET_KEY)
  : null;

// Create a payment intent (Stripe)
const createPaymentIntent = async ({ amount, currency, restaurantStripeAccountId, platformFeePercent, metadata }) => {
  // DEV MODE — mock payment
  if (!stripe) {
    console.log('💳 [DEV MODE] Mock payment intent created');
    console.log('   Amount:', amount, currency);
    const mockId = 'pi_mock_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    return {
      id: mockId,
      client_secret: mockId + '_secret_mock',
      amount,
      currency,
      status: 'requires_payment_method',
      mock: true
    };
  }

  const platformFee = Math.round(amount * (platformFeePercent / 100));

  const paymentIntentParams = {
    amount: Math.round(amount), // amount in smallest currency unit (paise/cents)
    currency: currency.toLowerCase(),
    metadata: metadata || {},
    automatic_payment_methods: { enabled: true }
  };

  // If restaurant has connected Stripe account, use Connect
  if (restaurantStripeAccountId) {
    paymentIntentParams.application_fee_amount = platformFee;
    paymentIntentParams.transfer_data = {
      destination: restaurantStripeAccountId
    };
  }

  const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);
  return paymentIntent;
};

// Verify webhook signature (Stripe)
const verifyWebhookSignature = (payload, signature) => {
  if (!stripe) {
    // DEV MODE — accept all webhooks
    return JSON.parse(payload);
  }

  return stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
};

// Create Stripe Connect onboarding link
const createConnectOnboardingLink = async (accountId, returnUrl, refreshUrl) => {
  if (!stripe) {
    return { url: returnUrl + '?mock_onboarding=success' };
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    return_url: returnUrl,
    refresh_url: refreshUrl,
    type: 'account_onboarding'
  });

  return accountLink;
};

// Create a new Stripe Connect account
const createConnectAccount = async (email, businessName) => {
  if (!stripe) {
    return { id: 'acct_mock_' + Date.now() };
  }

  const account = await stripe.accounts.create({
    type: 'standard',
    email,
    business_profile: {
      name: businessName
    }
  });

  return account;
};

// Check Connect account status
const getConnectAccountStatus = async (accountId) => {
  if (!stripe) {
    return { charges_enabled: true, payouts_enabled: true, details_submitted: true };
  }

  const account = await stripe.accounts.retrieve(accountId);
  return {
    charges_enabled: account.charges_enabled,
    payouts_enabled: account.payouts_enabled,
    details_submitted: account.details_submitted
  };
};

module.exports = {
  createPaymentIntent,
  verifyWebhookSignature,
  createConnectOnboardingLink,
  createConnectAccount,
  getConnectAccountStatus
};
