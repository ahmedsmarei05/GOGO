exports.getExchangeRates = async (_req, res) => {
  try {
    const response = await fetch("https://open.er-api.com/v6/latest/USD");
    if (!response.ok) throw new Error("Could not fetch exchange rates.");
    const data = await response.json();
    res.json({
      success: true,
      base: data.base_code,
      rates: {
        EGP: data.rates.EGP,
        EUR: data.rates.EUR,
        GBP: data.rates.GBP
      },
      updated: data.time_last_update_utc
    });
  } catch (err) {
    res.status(502).json({ success: false, message: err.message });
  }
};
