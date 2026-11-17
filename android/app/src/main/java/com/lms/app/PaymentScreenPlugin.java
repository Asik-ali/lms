package com.lms.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.JSObject;
import com.cashfree.pg.api.CFPaymentGatewayService;
import com.cashfree.pg.core.api.CFSession;
import com.cashfree.pg.core.api.exception.CFException;
import com.cashfree.pg.core.api.utils.CFErrorResponse;
import com.cashfree.pg.ui.api.upi.intent.CFIntentTheme;
import com.cashfree.pg.ui.api.upi.intent.CFUPIIntentCheckout;
import com.cashfree.pg.ui.api.upi.intent.CFUPIIntentCheckoutPayment;
import java.util.Arrays;
import java.util.ArrayList;
import java.util.List;
import android.os.Handler;
import android.os.Looper;

@CapacitorPlugin(name = "PaymentScreen")
public class PaymentScreenPlugin extends Plugin {
    private static final long CHECKOUT_TIMEOUT_MS = 120000;
    private static final List<String> UPI_APP_PACKAGES = Arrays.asList(
        "com.google.android.apps.nbu.paisa.user",
        "com.phonepe.app",
        "net.one97.paytm",
        "in.org.npci.upiapp",
        "com.dreamplug.androidapp");
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private PluginCall checkoutCall;
    private final Runnable checkoutTimeout = () -> finishCheckout(
        null, "timeout",
        "Android did not return from UPI checkout. Install EXAMSTICK from Google Play or another trusted app store, or choose Other methods. Check My Purchases before retrying.");

    @PluginMethod
    public void hasUpiApps(PluginCall call) {
        JSObject result = new JSObject();
        result.put("available", !getInstalledUpiApps().isEmpty());
        call.resolve(result);
    }

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
        List<String> installedUpiApps = getInstalledUpiApps();
        if (installedUpiApps.isEmpty()) {
            call.reject("No supported UPI app is installed. Install Google Pay, PhonePe, Paytm, BHIM, or CRED from a trusted app store, then retry.");
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
            CFUPIIntentCheckout upiCheckout = new CFUPIIntentCheckout.CFUPIIntentBuilder()
                .setOrderUsingPackageName(installedUpiApps)
                .build();
            CFUPIIntentCheckoutPayment payment = new CFUPIIntentCheckoutPayment.CFUPIIntentPaymentBuilder()
                .setSession(session)
                .setCfUPIIntentCheckout(upiCheckout)
                .setCfIntentTheme(theme)
                .build();

            checkoutCall = call;
            call.setKeepAlive(true);
            CFPaymentGatewayService service = CFPaymentGatewayService.getInstance();
            MainActivity activity = (MainActivity) getActivity();
            activity.registerPaymentScreenPlugin(this);
            mainHandler.postDelayed(checkoutTimeout, CHECKOUT_TIMEOUT_MS);
            service.doPayment(activity, payment);
        } catch (CFException error) {
            mainHandler.removeCallbacks(checkoutTimeout);
            if (getActivity() instanceof MainActivity) {
                ((MainActivity) getActivity()).clearPaymentScreenPlugin(this);
            }
            checkoutCall = null;
            call.setKeepAlive(false);
            call.reject("Unable to start Cashfree UPI checkout.", error);
        }
    }

    private List<String> getInstalledUpiApps() {
        List<String> installed = new ArrayList<>();
        if (getActivity() == null) return installed;
        android.content.pm.PackageManager packageManager = getActivity().getPackageManager();
        for (String packageName : UPI_APP_PACKAGES) {
            try {
                if (packageManager.getApplicationInfo(packageName, 0).enabled) installed.add(packageName);
            } catch (android.content.pm.PackageManager.NameNotFoundException ignored) {
                // This package is not installed.
            }
        }
        return installed;
    }

    public void onCashfreePaymentVerify(String orderId) {
        finishCheckout(orderId, "verify", null);
    }

    public void onCashfreePaymentFailure(CFErrorResponse error, String orderId) {
        String message = error == null ? "Cashfree UPI checkout did not complete." : error.getMessage();
        finishCheckout(orderId, "failure", message);
    }

    private void finishCheckout(String orderId, String outcome, String message) {
        PluginCall call = checkoutCall;
        checkoutCall = null;
        if (call == null) return;

        mainHandler.removeCallbacks(checkoutTimeout);
        if (getActivity() instanceof MainActivity) {
            ((MainActivity) getActivity()).clearPaymentScreenPlugin(this);
        }
        call.setKeepAlive(false);
        JSObject result = new JSObject();
        result.put("orderId", orderId);
        result.put("outcome", outcome);
        if (message != null && !message.isEmpty()) result.put("message", message);
        call.resolve(result);
    }
}
