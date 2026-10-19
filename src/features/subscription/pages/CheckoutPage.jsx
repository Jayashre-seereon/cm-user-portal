import { useEffect, useState } from "react";
import { Button, Col, Divider, Input, Row, Select } from "antd";
import { useSearchParams } from "react-router-dom";
import {
  ArrowLeftOutlined,
  BankOutlined,
  CheckCircleFilled,
  CreditCardOutlined,
  LockOutlined,
  SafetyCertificateFilled,
  ThunderboltOutlined,
} from "@ant-design/icons";
import { subscriptions } from "../../../data/careermapData";
import { usePortalNavigation } from "../../portal/components/portalPageShared";

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
        {label}
      </span>
      {children}
    </div>
  );
}

const BRAND = "#9a2119";
const BRAND_LIGHT = "#fdf1f0";

function resolveReturnPath(path) {
  if (!path) {
    return "/app/dashboard";
  }

  try {
    let decoded = path;
    while (decoded.includes("%")) {
      const next = decodeURIComponent(decoded);
      if (next === decoded) {
        break;
      }
      decoded = next;
    }
    return decoded || "/app/dashboard";
  } catch {
    return path;
  }
}

function createTransactionId() {
  return `TXN-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

export default function CheckoutPage() {
  const { navigate } = usePortalNavigation();
  const [params] = useSearchParams();
  const planId = params.get("planId");
  const returnTo = params.get("returnTo");
  const plan = subscriptions.find((item) => item.id === planId) || subscriptions[0];
  const subscriptionBackPath = `/app/subscription${
    returnTo ? `?returnTo=${encodeURIComponent(resolveReturnPath(returnTo))}` : ""
  }`;

  const [method, setMethod] = useState("upi");
  const [processing, setProcessing] = useState(false);
  const [values, setValues] = useState({
    upiId: "",
    cardName: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
    bank: "",
  });

  function update(key, value) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function formatCard(value) {
    return value
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();
  }

  function formatExpiry(value) {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    return digits.length >= 3 ? `${digits.slice(0, 2)} / ${digits.slice(2)}` : digits;
  }

  const rawCard = values.cardNumber.replace(/\s/g, "");

  const canPay =
    method === "upi"
      ? values.upiId.includes("@") && values.upiId.length > 3
      : method === "card"
        ? values.cardName && rawCard.length === 16 && values.cardExpiry && values.cardCvv.length >= 3
        : Boolean(values.bank);

  useEffect(() => {
    if (!processing) {
      return undefined;
    }

    const transactionId = createTransactionId();
    const timer = setTimeout(() => {
      const successParams = new URLSearchParams({
        planId: plan.id,
        transactionId,
      });
      const destination = resolveReturnPath(returnTo);

      if (destination) {
        successParams.set("returnTo", encodeURIComponent(destination));
      }

      navigate(`/payment-success?${successParams.toString()}`, { replace: true });
    }, 1800);

    return () => clearTimeout(timer);
  }, [navigate, plan.id, processing, returnTo]);

  const paymentMethods = [
    { id: "upi", label: "UPI", icon: <ThunderboltOutlined /> },
    { id: "card", label: "Card", icon: <CreditCardOutlined /> },
    { id: "netbanking", label: "Net Banking", icon: <BankOutlined /> },
  ];

  if (processing) {
    return (
      <div className="min-h-screen bg-[#f7f7f8] flex items-center justify-center p-4">
        <div className="w-full max-w-3xl rounded-[28px] border border-[#efefef] bg-white px-6 py-16 text-center shadow-[0_14px_34px_rgba(15,23,42,0.06)] sm:px-10">
          <div
            className="mx-auto mb-6 h-14 w-14 rounded-full border-[5px] border-t-transparent animate-spin"
            style={{ borderColor: `${BRAND} transparent ${BRAND} ${BRAND}` }}
          />
          <p className="text-[34px] font-black text-[#12284c] max-sm:text-[28px]">
            Verifying Payment...
          </p>
          <p className="mt-2 text-lg text-[#9ba3b3] max-sm:text-base">
            Please do not close this window
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6 lg:py-10">
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => navigate(subscriptionBackPath)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors text-sm font-medium bg-transparent border-none cursor-pointer p-0"
          >
            <ArrowLeftOutlined style={{ fontSize: 16 }} />
            Back
          </button>

          <div className="flex items-center gap-1.5 text-green-700 bg-green-50 border border-green-200 text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
            <SafetyCertificateFilled />
            Secure Checkout
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900 leading-tight">Complete your purchase</h1>
          <p className="text-sm text-gray-400 mt-1">You're one step away from unlocking {plan.name}</p>
        </div>

        <Row gutter={[20, 20]} className="items-stretch">
          <Col xs={24} lg={15} className="flex flex-col">
            <div
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col flex-1"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
            >
              <div className="px-6 py-4 border-b border-gray-50">
                <h2 className="text-sm font-black text-gray-800 m-0 uppercase tracking-tight">
                  Payment Method
                </h2>
              </div>

              <div className="px-6 py-5 flex flex-col flex-1 gap-5">
                <div className="grid grid-cols-3 gap-2">
                  {paymentMethods.map((item) => {
                    const active = method === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setMethod(item.id)}
                        className="flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-xl border-2 cursor-pointer transition-all font-medium text-xs"
                        style={{
                          borderColor: active ? BRAND : "#e5e7eb",
                          background: active ? BRAND_LIGHT : "#fff",
                          color: active ? BRAND : "#6b7280",
                        }}
                      >
                        <span style={{ fontSize: 18 }}>{item.icon}</span>
                        {item.label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col flex-1 justify-between">
                  <div className="flex flex-col gap-3">
                    {method === "upi" && (
                      <>
                        <Field label="UPI ID">
                          <Input
                            placeholder="yourname@upi"
                            size="large"
                            className="!rounded-lg"
                            value={values.upiId}
                            onChange={(event) => update("upiId", event.target.value)}
                          />
                        </Field>
                        <p className="text-xs text-gray-400">
                          Supported: @okicici, @ybl, @paytm, @upi
                        </p>
                      </>
                    )}

                    {method === "card" && (
                      <>
                        <Field label="Cardholder Name">
                          <Input
                            placeholder="Full name on card"
                            size="large"
                            className="!rounded-lg"
                            value={values.cardName}
                            onChange={(event) => update("cardName", event.target.value)}
                          />
                        </Field>
                        <Field label="Card Number">
                          <Input
                            placeholder="0000 0000 0000 0000"
                            size="large"
                            className="!rounded-lg"
                            value={values.cardNumber}
                            onChange={(event) => update("cardNumber", formatCard(event.target.value))}
                          />
                        </Field>
                        <Row gutter={12}>
                          <Col span={12}>
                            <Field label="Expiry">
                              <Input
                                placeholder="MM / YY"
                                size="large"
                                className="!rounded-lg"
                                value={values.cardExpiry}
                                onChange={(event) => update("cardExpiry", formatExpiry(event.target.value))}
                              />
                            </Field>
                          </Col>
                          <Col span={12}>
                            <Field label="CVV">
                              <Input.Password
                                placeholder="***"
                                size="large"
                                className="!rounded-lg"
                                value={values.cardCvv}
                                onChange={(event) =>
                                  update("cardCvv", event.target.value.replace(/\D/g, "").slice(0, 4))
                                }
                              />
                            </Field>
                          </Col>
                        </Row>
                      </>
                    )}

                    {method === "netbanking" && (
                      <>
                        <Field label="Select Bank">
                          <Select
                            size="large"
                            className="w-full"
                            placeholder="Choose your bank"
                            value={values.bank || undefined}
                            onChange={(value) => update("bank", value)}
                            options={[
                              "SBI",
                              "HDFC Bank",
                              "ICICI Bank",
                              "Axis Bank",
                              "Kotak Mahindra",
                              "Punjab National Bank",
                            ].map((bank) => ({ label: bank, value: bank }))}
                          />
                        </Field>
                        <p className="text-xs text-gray-400">
                          You will be redirected to your bank&apos;s secure portal.
                        </p>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-4 mt-auto border-t border-gray-50">
                    <LockOutlined style={{ color: "#9ca3af", fontSize: 13 }} />
                    <span className="text-[11px] text-gray-400">
                      Your payment info is encrypted and never stored.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Col>

          <Col xs={24} lg={9} className="flex flex-col">
            <div
              className="bg-white rounded-2xl border overflow-hidden flex flex-col flex-1"
              style={{
                borderColor: "#f0d5d3",
                boxShadow: "0 1px 4px rgba(154,33,25,0.08)",
              }}
            >
              <div className="h-1 w-full" style={{ background: BRAND }} />

              <div className="px-5 py-5 flex flex-col flex-1">
                <div
                  className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full self-start mb-4"
                  style={{ background: BRAND_LIGHT, color: BRAND }}
                >
                  <CheckCircleFilled />
                  Selected Plan
                </div>

                <h3 className="text-base font-black text-gray-900 mb-0.5">{plan.name}</h3>
                <p className="text-xs text-gray-400 mb-4">{plan.description}</p>

                <div className="flex flex-col gap-2 mb-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{plan.name}</span>
                    <span className="font-semibold text-gray-800">{plan.price}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">GST (18%)</span>
                    <span className="font-semibold text-gray-800">Included</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Billing cycle</span>
                    <span className="font-semibold text-gray-800">Annual access</span>
                  </div>
                </div>

                <Divider className="my-3" />

                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold text-gray-700">Total due</span>
                  <span className="text-2xl font-black" style={{ color: BRAND }}>
                    {plan.price}
                  </span>
                </div>

                <div className="flex-1" />

                <Button
                  type="primary"
                  size="large"
                  block
                  disabled={!canPay}
                  onClick={() => setProcessing(true)}
                  className="!h-12 !rounded-xl !text-sm !font-bold"
                  style={canPay ? { background: BRAND, borderColor: BRAND } : {}}
                  icon={<LockOutlined />}
                >
                  Complete Payment
                </Button>

                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <SafetyCertificateFilled style={{ color: "#9ca3af", fontSize: 12 }} />
                  <span className="text-[11px] text-gray-400">256-bit SSL and PCI-DSS compliant</span>
                </div>

                <p className="text-[10px] text-center text-gray-300 mt-3 leading-relaxed px-2">
                  By completing payment you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
}
