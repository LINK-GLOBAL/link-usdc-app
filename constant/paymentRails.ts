export const PaymentRails = [
  {
    currency: "GHS",
    country: "Ghana",
    paymentMethods: [
      { method: "MTN Mobile Money", value: "mtn_momo_gh" },
      { method: "Vodafone Cash", value: "vodafone_cash_gh" },
      { method: "Bank Transfer (Instant Pay)", value: "bank_transfer_gh" },
    ],
  },
  {
    currency: "KES",
    country: "Kenya",
    paymentMethods: [
      { method: "M-Pesa", value: "mpesa" },
      { method: "Bank Transfer", value: "bank_transfer_kenya" },
      { method: "Airtel Money", value: "airtel_money" },
    ],
  },
  {
    currency: "NGN",
    country: "Nigeria",
    paymentMethods: [{ method: "Bank Transfer", value: "bank_transfer_ng" }],
  },
  {
    currency: "XAF",
    country: "Cameroon",
    paymentMethods: [
      { method: "MTN Mobile Money", value: "mtn_momo" },
      { method: "Orange Money", value: "orange_money" },
      { method: "Afriland Bank", value: "afriland" },
    ],
  },
  {
    currency: "ZAR",
    country: "South Africa",
    paymentMethods: [
      { method: "FNB", value: "fnb" },
    ],
  },
  {
    currency: "TZS",
    country: "Tanzania",
    paymentMethods: [
      { method: "TigoPesa", value: "tigopesa" },
      { method: "Airtel Money", value: "airtel_money" },
      { method: "Vodacom", value: "vodacom" },
    ],
  },
  {
    currency: "SLE",
    country: "Sierra Leone",
    paymentMethods: [
      { method: "Orange Money", value: "orange_money" },
      { method: "Afrimoney", value: "afrimoney" },
    ],
  },
  {
    currency: "MWK",
    country: "Malawi",
    paymentMethods: [
      { method: "Airtel Money", value: "airtel_money" },
      { method: "Bank Transfer", value: "bank_transfer_mw" },
    ],
  },
  {
    currency: "UGX",
    country: "Uganda",
    paymentMethods: [
      { method: "MTN Mobile Money", value: "mtn_momo_ug" },
      { method: "Airtel Money", value: "airtel_money_ug" },
    ],
  },
  {
    currency: "ZMW",
    country: "Zambia",
    paymentMethods: [
      { method: "Airtel Money", value: "airtel_money_zm" },
      { method: "MTN Mobile Money", value: "mtn_momo_zm" },
      { method: "Bank Transfer", value: "bank_transfer_zm" },
    ],
  },
];

// Helper to get payment methods by currency
export const getPaymentMethodsByCurrency = (currency: string) => {
  const rail = PaymentRails.find(
    (r) => r.currency.toUpperCase() === currency.toUpperCase()
  );
  return rail?.paymentMethods || [];
};

export const KycRails = [
  {
    country: "Nigeria",
    country_code: "ng",
    id_types: [
      { label: "BVN", value: "bvn" },
      { label: "NIN", value: "nin" },
    ],
  },
  {
    country: "Kenya",
    country_code: "ke",
    id_types: [
      { label: "NIN", value: "nin" },
      { label: "Passport Number", value: "pn" },
    ],
  },
  {
    country: "Ghana",
    country_code: "gh",
    id_types: [
      { label: "Passport Number", value: "pn" },
      { label: "Driver's Licence", value: "dl" },
    ],
  },
  {
    country: "South Africa",
    country_code: "za",
    id_types: [
      { label: "NIN", value: "nin" },
    ],
  },
];

// Helper to get ID types by country_code
export const getIdTypesByCountry = (country_code: string) => {
  const rail = KycRails.find(
    (r) => r.country_code.toLowerCase() === country_code.toLowerCase()
  );
  return rail?.id_types || [];
};
