package com.lms.app;

import com.cashfree.pg.api.CFPaymentGatewayService;
import com.cashfree.pg.core.api.CFSession;
import com.cashfree.pg.core.api.callback.CFCheckoutResponseCallback;
import com.cashfree.pg.core.api.exception.CFException;
import com.cashfree.pg.core.api.utils.CFErrorResponse;
import com.cashfree.pg.core.api.webcheckout.CFWebCheckoutPayment;
import com.cashfree.pg.core.api.webcheckout.CFWebCheckoutTheme;
import com.cashfree.pg.ui.api.upi.intent.CFIntentTheme;
import com.cashfree.pg.ui.api.upi.intent.CFUPIIntentCheckout;
import com.cashfree.pg.ui.api.upi.intent.CFUPIIntentCheckoutPayment;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Arrays;

@CapacitorPlugin(name = "CashfreeNative")
public class CashfreeNativePlugin extends Plugin implements CFCheckoutResponseCallback {
    private PluginCall pendingCall;

    @Override
    public void load() {
        registerCheckoutCallback();
    }

    @PluginMethod
    public void startCheckout(PluginCall call) {
        String orderId = call.getString("orderId");
        String paymentSessionId = call.getString("paymentSessionId");
        String mode = call.getString("mode", "production");
        String method = call.getString("method", "upi");
        if (orderId == null || orderId.isEmpty() || paymentSessionId == null || paymentSessionId.isEmpty()) {
            call.reject("Cashfree order details are missing.");
            return;
        }
        if (pendingCall != null) {
            call.reject("A payment is already open.");
            return;
        }

        try {
            CFSession.Environment environment = "sandbox".equalsIgnoreCase(mode)
                ? CFSession.Environment.SANDBOX : CFSession.Environment.PRODUCTION;
            CFSession session = new CFSession.CFSessionBuilder()
                .setEnvironment(environment)
                .setPaymentSessionID(paymentSessionId)
                .setOrderId(orderId)
                .build();

            Object payment;
            if ("upi".equalsIgnoreCase(method)) {
                CFIntentTheme theme = new CFIntentTheme.CFIntentThemeBuilder()
                    .setPrimaryTextColor("#071A3D")
                    .setBackgroundColor("#FFFFFF")
                    .build();
                // Cashfree requires an ordered list of UPI apps for an intent
                // checkout. An empty builder displays app choices but cannot
                // reliably hand off to the selected app.
                CFUPIIntentCheckout upiApps = new CFUPIIntentCheckout.CFUPIIntentBuilder()
                    .setOrder(Arrays.asList(
                        CFUPIIntentCheckout.CFUPIApps.GOOGLE_PAY,
                        CFUPIIntentCheckout.CFUPIApps.PHONEPE,
                        CFUPIIntentCheckout.CFUPIApps.PAYTM,
                        CFUPIIntentCheckout.CFUPIApps.BHIM,
                        CFUPIIntentCheckout.CFUPIApps.CRED,
                        CFUPIIntentCheckout.CFUPIApps.AMAZON_PAY,
                        CFUPIIntentCheckout.CFUPIApps.WHATSAPP
                    ))
                    .build();
                payment = new CFUPIIntentCheckoutPayment.CFUPIIntentPaymentBuilder()
                    .setSession(session)
                    .setCfUPIIntentCheckout(upiApps)
                    .setCfIntentTheme(theme)
                    .build();
            } else if ("all".equalsIgnoreCase(method)) {
                CFWebCheckoutTheme theme = new CFWebCheckoutTheme.CFWebCheckoutThemeBuilder()
                    .setNavigationBarBackgroundColor("#071A3D")
                    .setNavigationBarTextColor("#FFFFFF")
                    .build();
                payment = new CFWebCheckoutPayment.CFWebCheckoutPaymentBuilder()
                    .setSession(session)
                    .setCFWebCheckoutUITheme(theme)
                    .build();
            } else {
                call.reject("Unsupported payment method.");
                return;
            }

            registerCheckoutCallback();
            pendingCall = call;
            call.setKeepAlive(true);
            Object paymentRequest = payment;
            getActivity().runOnUiThread(() -> {
                try {
                    if (paymentRequest instanceof CFUPIIntentCheckoutPayment) {
                        CFPaymentGatewayService.getInstance().doPayment(getActivity(), (CFUPIIntentCheckoutPayment) paymentRequest);
                    } else {
                        CFPaymentGatewayService.getInstance().doPayment(getActivity(), (CFWebCheckoutPayment) paymentRequest);
                    }
                } catch (Exception error) {
                    rejectPending(error.getMessage());
                }
            });
        } catch (Exception error) {
            call.reject(error.getMessage() == null ? "Unable to open Cashfree checkout." : error.getMessage());
        }
    }

    private void registerCheckoutCallback() {
        try {
            CFPaymentGatewayService.getInstance().setCheckoutCallback(this);
        } catch (CFException error) {
            android.util.Log.e("CashfreeNative", "Unable to register payment callback", error);
        }
    }

    @Override
    public void onPaymentVerify(String orderId) {
        resolvePending("verified", orderId, null);
    }

    @Override
    public void onPaymentFailure(CFErrorResponse error, String orderId) {
        String message = error == null ? "Payment was cancelled or failed." : error.getMessage();
        resolvePending("failed", orderId, message);
    }

    private void resolvePending(String status, String orderId, String message) {
        PluginCall call = pendingCall;
        pendingCall = null;
        if (call == null) return;
        JSObject result = new JSObject();
        result.put("status", status);
        result.put("orderId", orderId);
        if (message != null) result.put("message", message);
        call.resolve(result);
    }

    private void rejectPending(String message) {
        PluginCall call = pendingCall;
        pendingCall = null;
        if (call != null) call.reject(message == null ? "Unable to start Cashfree checkout." : message);
    }
}
