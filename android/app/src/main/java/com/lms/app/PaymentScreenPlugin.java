package com.lms.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.JSObject;
import com.cashfree.pg.api.CFPaymentGatewayService;
import com.cashfree.pg.core.api.CFSession;
import com.cashfree.pg.core.api.callback.CFCheckoutResponseCallback;
import com.cashfree.pg.core.api.exception.CFException;
import com.cashfree.pg.core.api.utils.CFErrorResponse;
import com.cashfree.pg.ui.api.upi.intent.CFIntentTheme;
import com.cashfree.pg.ui.api.upi.intent.CFUPIIntentCheckout;
import com.cashfree.pg.ui.api.upi.intent.CFUPIIntentCheckoutPayment;

@CapacitorPlugin(name = "PaymentScreen")
public class PaymentScreenPlugin extends Plugin implements CFCheckoutResponseCallback {
    private PluginCall checkoutCall;

    @PluginMethod
    public void setSecure(PluginCall call) {
        Boolean enabled = call.getBoolean("enabled");
        if (enabled == null) {
            call.reject("The enabled value is required.");
            return;
        }

        if (!(getActivity() instanceof MainActivity)) {
            call.reject("Payment screen controls are unavailable.");
            return;
        }

        MainActivity activity = (MainActivity) getActivity();
        activity.runOnUiThread(() -> {
            activity.setSecureContent(enabled);
            call.resolve();
        });
    }

    @PluginMethod
    public void startUpiCheckout(PluginCall call) {
        String orderId = call.getString("orderId");
        String paymentSessionId = call.getString("paymentSessionId");
        String mode = call.getString("mode", "production");
        if (orderId == null || orderId.isEmpty() || paymentSessionId == null || paymentSessionId.isEmpty()) {
            call.reject("Cashfree order ID and payment session are required.");
            return;
        }
        if (checkoutCall != null) {
            call.reject("A UPI checkout is already in progress.");
            return;
        }
        if (getActivity() == null) {
            call.reject("The Android activity is unavailable.");
            return;
        }

        try {
            CFSession session = new CFSession.CFSessionBuilder()
                .setEnvironment("sandbox".equalsIgnoreCase(mode)
                    ? CFSession.Environment.SANDBOX
                    : CFSession.Environment.PRODUCTION)
                .setPaymentSessionID(paymentSessionId)
                .setOrderId(orderId)
                .build();
            CFIntentTheme theme = new CFIntentTheme.CFIntentThemeBuilder()
                .setPrimaryTextColor("#1B1B1B")
                .setBackgroundColor("#FFFFFF")
                .build();
            CFUPIIntentCheckout upiCheckout = new CFUPIIntentCheckout.CFUPIIntentBuilder().build();
            CFUPIIntentCheckoutPayment payment = new CFUPIIntentCheckoutPayment.CFUPIIntentPaymentBuilder()
                .setSession(session)
                .setCfUPIIntentCheckout(upiCheckout)
                .setCfIntentTheme(theme)
                .build();

            checkoutCall = call;
            call.setKeepAlive(true);
            CFPaymentGatewayService service = CFPaymentGatewayService.getInstance();
            service.setCheckoutCallback(this);
            service.doPayment(getActivity(), payment);
        } catch (CFException error) {
            checkoutCall = null;
            call.setKeepAlive(false);
            call.reject("Unable to start Cashfree UPI checkout.", error);
        }
    }

    @Override
    public void onPaymentVerify(String orderId) {
        finishCheckout(orderId, "verify", null);
    }

    @Override
    public void onPaymentFailure(CFErrorResponse error, String orderId) {
        String message = error == null ? "Cashfree UPI checkout did not complete." : error.getMessage();
        finishCheckout(orderId, "failure", message);
    }

    private void finishCheckout(String orderId, String outcome, String message) {
        PluginCall call = checkoutCall;
        checkoutCall = null;
        if (call == null) return;

        call.setKeepAlive(false);
        JSObject result = new JSObject();
        result.put("orderId", orderId);
        result.put("outcome", outcome);
        if (message != null && !message.isEmpty()) result.put("message", message);
        call.resolve(result);
    }
}
