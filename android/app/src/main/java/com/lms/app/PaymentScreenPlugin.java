package com.lms.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PluginMethod;

@CapacitorPlugin(name = "PaymentScreen")
public class PaymentScreenPlugin extends Plugin {
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
}
