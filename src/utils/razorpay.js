let razorpayPromise = null;

const loadScript = (src, timeoutMs = 15000) => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (!value && script.parentNode) {
        script.parentNode.removeChild(script);
      }
      resolve(value);
    };
    const timer = setTimeout(() => finish(false), timeoutMs);
    script.src = src;
    script.onload = () => finish(true);
    script.onerror = () => finish(false);
    document.body.appendChild(script);
  });
};

export const loadRazorpayScript = () => {
  if (typeof window !== "undefined" && window.Razorpay) {
    return Promise.resolve(true);
  }
  if (!razorpayPromise) {
    razorpayPromise = loadScript("https://checkout.razorpay.com/v1/checkout.js").then((ok) => {
      if (!ok) razorpayPromise = null;
      return ok;
    });
  }
  return razorpayPromise;
};
